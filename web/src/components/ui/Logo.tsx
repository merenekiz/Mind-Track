/**
 * MindTrack logo component.
 *
 * Logo dosyaları `web/public/logo/` altında:
 *   - logo-icon.png  (kare simge versiyonu — sidebar, login, küçük yerler için)
 *   - logo.png       (yatay/tam logo — geniş yerler için)
 *
 * Dosya bulunamazsa otomatik placeholder gösterilir.
 */
"use client";

import { useState } from "react";

interface LogoProps {
  size?: number;
  variant?: "full" | "icon";
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}

export default function Logo({ size = 32, variant = "icon", className, alt = "MindTrack", style }: LogoProps) {
  const [errored, setErrored] = useState(false);

  const src = variant === "icon" ? "/logo/logo-icon.png" : "/logo/logo.png";

  if (errored) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-label={alt}
        style={style}
      >
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          fill="currentColor"
        />
        <path
          d="M3.5 12h3l1.5-3 2 6 2-4.5 1.5 1.5h3"
          stroke="white"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Native <img> kullanıyoruz — next/image ile boyut/optimization sorunlarını
  // baypas eder ve direkt çalışır. Logo zaten public klasöründen servis ediliyor.
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain", display: "block", ...style }}
      onError={() => setErrored(true)}
    />
  );
}
