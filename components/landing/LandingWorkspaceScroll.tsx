import ContainerScroll from "@/components/landing/ContainerScroll";
import Image from "next/image";

export default function LandingWorkspaceScroll() {
    return (
        <ContainerScroll
            titleComponent={
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9b6034]">
                        The planning workspace
                    </p>

                    <h2 className="mx-auto mt-4 max-w-4xl text-3xl font-black leading-tight tracking-[-0.04em] text-[#2d1e11] sm:text-5xl lg:text-[3.7rem]">
                        One place to draft, edit, and organize the whole trip.
                    </h2>

                    <p className="mx-auto mt-5 max-w-2xl text-sm font-semibold leading-6 text-[#806a55] sm:text-base sm:leading-7">
                        Chat with AI, compare options, update days, and keep the final itinerary
                        clean without losing useful alternatives.
                    </p>
                </div>
            }
        >
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#fffdf9]">
                {/* Desktop + tablet screenshot */}
                <Image
                    src="/landing/edit-page-desktop.png"
                    alt="Kartografer editable itinerary workspace"
                    fill
                    priority
                    className="hidden object-contain object-center sm:block"
                    sizes="(max-width: 1024px) 100vw, 1152px"
                />

                {/* Phone-only screenshot */}
                <Image
                    src="/landing/edit-page-mobile.png"
                    alt="Kartografer mobile editable itinerary workspace"
                    fill
                    priority
                    className="block object-contain object-center sm:hidden"
                    sizes="100vw"
                />

                <div className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-inset ring-white/60" />
            </div>
        </ContainerScroll>
    );
}