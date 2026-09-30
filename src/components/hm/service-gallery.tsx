"use client";

import { CaretLeft, CaretRight, Check } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";

type GalleryImage = {
  src: string;
  alt: string;
};

export function ServiceGallery({
  images,
  highlights
}: {
  images: readonly GalleryImage[];
  highlights: readonly string[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  function showPrevious() {
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  }

  function showNext() {
    setActiveIndex((current) => (current + 1) % images.length);
  }

  return (
    <div className="grid gap-3">
      <div
        className="group relative aspect-[16/10] overflow-hidden border border-border bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        role="region"
        aria-label="Galería del banco de potencia"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            showPrevious();
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            showNext();
          }
        }}
      >
        <Image
          key={activeImage.src}
          src={activeImage.src}
          alt={activeImage.alt}
          fill
          preload={activeIndex === 0}
          fetchPriority={activeIndex === 0 ? "high" : undefined}
          quality={50}
          sizes="(max-width: 1024px) 100vw, 45vw"
          className="object-cover"
        />

        <button
          type="button"
          onClick={showPrevious}
          className="absolute left-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center border border-white/35 bg-black/75 text-white transition hover:border-white/70 hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.96]"
          aria-label="Ver imagen anterior"
        >
          <CaretLeft size={21} weight="bold" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={showNext}
          className="absolute right-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center border border-white/35 bg-black/75 text-white transition hover:border-white/70 hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.96]"
          aria-label="Ver imagen siguiente"
        >
          <CaretRight size={21} weight="bold" aria-hidden="true" />
        </button>

        <p className="sr-only" aria-live="polite">
          Imagen {activeIndex + 1} de {images.length}: {activeImage.alt}
        </p>
      </div>

      <div className="flex snap-x gap-2 overflow-x-auto pb-1" role="group" aria-label="Seleccionar imagen">
        {images.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`relative aspect-[16/10] w-[29%] shrink-0 snap-start overflow-hidden border bg-black/60 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98] sm:w-auto sm:flex-1 ${
              index === activeIndex ? "border-primary" : "border-border hover:border-foreground/55"
            }`}
            aria-label={`Ver imagen ${index + 1}: ${image.alt}`}
            aria-pressed={index === activeIndex}
          >
            <Image src={image.src} alt="" fill quality={50} sizes="(max-width: 640px) 30vw, 12vw" className="object-cover" />
          </button>
        ))}
      </div>

      <div className="grid gap-px bg-border sm:grid-cols-3">
        {highlights.map((item) => (
          <div key={item} className="flex items-center gap-2 bg-card px-4 py-4 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground">
            <Check size={14} className="shrink-0 text-primary" weight="bold" aria-hidden="true" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
