"use client";

import { useState } from "react";

/** Imagem do celular: public/images/image_login.png (ou "image login.png") — cobre toda a metade direita */
const IMAGE_SOURCES = [
  "/images/image_login.png",
  "/images/image%20login.png",
  "/images/image_login.jpg",
  "/images/image_login.webp",
];

export function LoginImageRight() {
  const [src, setSrc] = useState<string | null>(IMAGE_SOURCES[0]);
  const [tried, setTried] = useState(0);

  const handleError = () => {
    if (tried < IMAGE_SOURCES.length - 1) {
      setTried((t) => t + 1);
      setSrc(IMAGE_SOURCES[tried + 1]);
    } else {
      setSrc(null);
    }
  };

  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#FFF0F5] text-center text-text-secondary">
        <p className="max-w-[240px] text-sm">
          Coloque a imagem em <code className="rounded bg-white/60 px-1">public/images/image_login.png</code>
        </p>
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Tela do app Tôro Médicos"
        className="h-full w-full object-cover object-center"
        onError={handleError}
      />
    </>
  );
}
