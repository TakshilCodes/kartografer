import CinematicFinalCta from "@/components/landing/CinematicFinalCta";
import CinematicLandingFooter from "@/components/landing/CinematicLandingFooter";
import CinematicLandingHero from "@/components/landing/CinematicLandingHero";
import styles from "@/components/landing/Landing.module.css";
import LandingTemplateGallery from "@/components/landing/LandingTemplateGallery";
import LandingWorkspaceShowcase from "@/components/landing/LandingWorkspaceShowcase";

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <CinematicLandingHero />
      <main>
        <LandingWorkspaceShowcase />
        <LandingTemplateGallery />
        <CinematicFinalCta />
      </main>
      <CinematicLandingFooter />
    </div>
  );
}