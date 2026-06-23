import LandingHero from "@/components/landing/LandingHero";
import LandingProductStory from "./LandingProductStory";
import LandingWorkspaceScroll from "./LandingWorkspaceScroll";
import LandingExploreTemplates from "./LandingExploreTemplates";
import LandingExportPdf from "./LandingExportPdf";
import LandingFinalCta from "./LandingFinalCta";
import LandingFooter from "./LandingFooter";

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden bg-[#fffdf9] text-[#2d1e11]">
      <LandingHero />
      <LandingWorkspaceScroll />
      <LandingProductStory />
      <LandingExploreTemplates />
      <LandingExportPdf />
      <LandingFinalCta />
      <LandingFooter />
    </div>
  );
}