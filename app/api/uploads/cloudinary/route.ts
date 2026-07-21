import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getCloudinaryClient } from "@/lib/cloudinary";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

type CloudinaryUploadError = {
  http_code?: number;
  message?: string;
  name?: string;
};

function getUploadErrorResponse(error: unknown) {
  const cloudinaryError = error as CloudinaryUploadError;

  if (cloudinaryError.http_code === 401 || cloudinaryError.http_code === 403) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Cloudinary rejected the upload credentials. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET, then restart the dev server.",
      },
      { status: 502 },
    );
  }

  if (
    error instanceof Error &&
    error.message.includes("environment variables")
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Cloudinary is not configured yet. Add the Cloudinary environment variables and restart the dev server.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      error: "Failed to upload image. Please try again in a moment.",
    },
    { status: 500 },
  );
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "You must be logged in to upload images." },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Please choose an image to upload." },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { ok: false, error: "Only JPG, PNG, and WEBP images are supported." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Image must be 10MB or smaller." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const cloudinary = getCloudinaryClient();

    const uploaded = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "kartografer/trip-covers",
          resource_type: "image",
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary upload failed."));
            return;
          }

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );

      stream.end(buffer);
    });

    return NextResponse.json({
      ok: true,
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
    });
  } catch (error) {
    console.error("CLOUDINARY_UPLOAD_ERROR", error);
    return getUploadErrorResponse(error);
  }
}
