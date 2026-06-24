"use client";

import { useRef, useState } from "react";
import NextImage from "next/image";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { ImagePlus, Loader2, RotateCcw, Trash2, UploadCloud, X } from "lucide-react";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const COVER_ASPECT = 16 / 9;

type CloudinaryUploadResponse =
  | { ok: true; url: string; publicId: string }
  | { ok: false; error: string };

type CoverImageUploaderProps = {
  value: string | null;
  onChange: (url: string | null) => void;
};

export default function CoverImageUploader({ value, onChange }: CoverImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; file: File } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  function openFilePicker() {
    setError("");
    fileInputRef.current?.click();
  }

  function closeCropper() {
    if (selectedPhoto) {
      URL.revokeObjectURL(selectedPhoto.url);
    }

    setSelectedPhoto(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsUploading(false);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!ACCEPTED_TYPES.has(file.type)) {
      setError("Only JPG, PNG, and WEBP images are supported.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("Image must be 10MB or smaller.");
      return;
    }

    if (selectedPhoto) {
      URL.revokeObjectURL(selectedPhoto.url);
    }

    setError("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setSelectedPhoto({ url: URL.createObjectURL(file), file });
  }

  async function handleUploadCroppedImage() {
    if (!selectedPhoto || !croppedAreaPixels) {
      setError("Choose and crop an image before uploading.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const croppedBlob = await getCroppedImg(selectedPhoto.url, croppedAreaPixels, selectedPhoto.file.type);

      if (!croppedBlob) {
        throw new Error("Failed to crop image.");
      }

      const croppedFile = new File([croppedBlob], selectedPhoto.file.name, {
        type: selectedPhoto.file.type || "image/jpeg",
      });
      const formData = new FormData();
      formData.append("file", croppedFile);

      const response = await fetch("/api/uploads/cloudinary", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json().catch(() => null)) as CloudinaryUploadResponse | null;

      if (!result) {
        throw new Error("Failed to upload image.");
      }

      if (!response.ok || result.ok === false) {
        throw new Error(result.ok === false ? result.error : "Failed to upload image.");
      }

      onChange(result.url);
      closeCropper();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-foreground">Cover image</p>
          <p className="mt-1 text-xs leading-5 text-secondary-foreground">
            This image appears on Explore cards and the public itinerary page.
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileChange}
      />

      {value ? (
        <div className="group relative aspect-video overflow-hidden rounded-[26px] border border-border bg-card-secondary shadow-sm">
          <NextImage src={value} alt="Trip cover preview" fill className="h-full w-full object-cover" unoptimized />
          <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent opacity-80 transition group-hover:opacity-100" />
          <div className="absolute bottom-3 right-3 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={openFilePicker}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/35 bg-white/90 px-3 py-2 text-xs font-black text-[#54371d] shadow-sm transition hover:bg-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Change
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/25 bg-[#5b261c]/90 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-[#4b1e16]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openFilePicker}
          className="group flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-[26px] border border-dashed border-border bg-card-secondary/60 px-4 text-center transition hover:border-primary/60 hover:bg-card-secondary focus:outline-none focus:ring-4 focus:ring-ring/20"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm transition group-hover:scale-105">
            <ImagePlus className="h-5 w-5" />
          </span>
          <span className="mt-4 text-sm font-black text-foreground">Upload cover image</span>
          <span className="mt-1 text-xs font-semibold text-secondary-foreground">PNG, JPG or WEBP up to 10MB</span>
          <span className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-4 text-xs font-black text-primary-foreground shadow-sm transition group-hover:bg-primary-hover">
            Choose image
          </span>
        </button>
      )}

      {error ? (
        <p className="rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-bold text-danger">
          {error}
        </p>
      ) : null}

      {selectedPhoto ? (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-[30px] border border-border bg-card shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-border bg-card-secondary/70 px-5 py-4">
              <div>
                <h3 className="text-lg font-black text-foreground">Crop cover image</h3>
                <p className="mt-1 text-sm text-secondary-foreground">Frame the image in a wide 16:9 crop for Explore.</p>
              </div>
              <button
                type="button"
                onClick={closeCropper}
                disabled={isUploading}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-card-secondary disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="relative aspect-video overflow-hidden rounded-3xl border border-border bg-black">
                <Cropper
                  image={selectedPhoto.url}
                  crop={crop}
                  zoom={zoom}
                  aspect={COVER_ASPECT}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                  classes={{ containerClassName: isUploading ? "opacity-70 pointer-events-none" : "" }}
                />
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-secondary-foreground">Zoom</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  disabled={isUploading}
                  className="w-full accent-primary"
                />
              </label>

              {error ? (
                <p className="rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-bold text-danger">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="grid gap-3 border-t border-border p-5 sm:grid-cols-2">
              <button
                type="button"
                onClick={closeCropper}
                disabled={isUploading}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-border bg-card px-5 text-sm font-black text-foreground transition hover:bg-card-secondary disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadCroppedImage}
                disabled={isUploading}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                {isUploading ? "Uploading..." : "Upload cover"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Failed to load image.")));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area, mimeType: string): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to crop image.");
  }

  canvas.width = Math.max(1, Math.round(pixelCrop.width));
  canvas.height = Math.max(1, Math.round(pixelCrop.height));

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to generate cropped image."));
          return;
        }

        resolve(blob);
      },
      mimeType || "image/jpeg",
      0.92
    );
  });
}