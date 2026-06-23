import Image from "next/image";

import logoMark from "@/public/logo.png";
import darkBackgroundWordmark from "@/public/logo&text_fordark.png";
import lightBackgroundWordmark from "@/public/logo&text_forlight.png";

type BrandLogoProps = {
  className?: string;
  compactClassName?: string;
  wordmarkClassName?: string;
  priority?: boolean;
  compactOnSmallScreens?: boolean;
  themeAware?: boolean;
};

export default function BrandLogo({
  className = "",
  compactClassName = "h-9 w-9",
  wordmarkClassName = "h-auto w-40",
  priority = false,
  compactOnSmallScreens = true,
  themeAware = false,
}: BrandLogoProps) {
  const compactVisibility = compactOnSmallScreens ? "sm:hidden" : "";
  const baseWordmarkVisibility = compactOnSmallScreens ? "hidden sm:block" : "block";
  const lightWordmarkVisibility = themeAware
    ? `${baseWordmarkVisibility} dark:hidden`
    : baseWordmarkVisibility;
  const darkWordmarkVisibility = themeAware
    ? compactOnSmallScreens
      ? "hidden dark:sm:block"
      : "hidden dark:block"
    : "hidden";

  return (
    <span className={`inline-flex shrink-0 items-center ${className}`}>
      {compactOnSmallScreens ? (
        <Image
          src={logoMark}
          alt="Kartografer"
          className={`${compactVisibility} object-contain ${compactClassName}`}
          priority={priority}
        />
      ) : null}

      <Image
        src={lightBackgroundWordmark}
        alt="Kartografer"
        className={`${lightWordmarkVisibility} object-contain ${wordmarkClassName}`}
        priority={priority}
      />
      <Image
        src={darkBackgroundWordmark}
        alt="Kartografer"
        className={`${darkWordmarkVisibility} object-contain ${wordmarkClassName}`}
        priority={priority}
      />
    </span>
  );
}