import * as React from "react";
import { cn } from "@/lib/utils";
import { ECOGRID_LOGO_ALT, ECOGRID_LOGO_SRC } from "@/lib/branding";

export type EcoGridLogoProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  alt?: string;
};

/** Site mark: `public/logo/logoec.png` (see `ECOGRID_LOGO_SRC`). */
export function EcoGridLogo({ className, alt, ...props }: EcoGridLogoProps) {
  return (
    <img
      src={ECOGRID_LOGO_SRC}
      alt={alt ?? ECOGRID_LOGO_ALT}
      className={cn("object-contain select-none", className)}
      draggable={false}
      {...props}
    />
  );
}
