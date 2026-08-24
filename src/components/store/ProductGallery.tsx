import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/store/ProductImage";

type ProductGalleryProps = {
  category: string;
  title: string;
  images: string[];
  className?: string;
  autoPlayMs?: number;
};

export function ProductGallery({
  category,
  title,
  images,
  className,
  autoPlayMs = 4500,
}: ProductGalleryProps) {
  const slides = images.filter(Boolean);
  const slidesKey = slides.join("|");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = slides.length;
  const active = count ? index % count : 0;

  const go = useCallback(
    (delta: number) => {
      if (count <= 1) return;
      setIndex((i) => (i + delta + count) % count);
    },
    [count],
  );

  useEffect(() => {
    setIndex(0);
  }, [slidesKey]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = window.setInterval(() => go(1), autoPlayMs);
    return () => window.clearInterval(id);
  }, [count, paused, autoPlayMs, go]);

  if (!count) {
    return (
      <ProductImage
        category={category}
        title={title}
        imageUrl={null}
        className={className}
        priority
      />
    );
  }

  if (count === 1) {
    return (
      <ProductImage
        category={category}
        title={title}
        imageUrl={slides[0] ?? null}
        className={className}
        priority
      />
    );
  }

  return (
    <div
      className={cn("group relative overflow-hidden bg-zinc-950", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((url, i) => (
        <img
          key={url}
          src={url}
          alt={`${title} — ${i + 1}`}
          loading={i === 0 ? "eager" : "lazy"}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
            i === active ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        />
      ))}

      <button
        type="button"
        aria-label="Previous image"
        onClick={() => go(-1)}
        className="absolute inset-y-0 start-2 z-10 flex items-center opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70">
          <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
        </span>
      </button>

      <button
        type="button"
        aria-label="Next image"
        onClick={() => go(1)}
        className="absolute inset-y-0 end-2 z-10 flex items-center opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70">
          <ChevronRight className="h-5 w-5 rtl:rotate-180" />
        </span>
      </button>

      <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center gap-1.5 bg-gradient-to-t from-black/60 to-transparent px-3 pb-3 pt-8">
        {slides.map((url, i) => (
          <button
            key={url}
            type="button"
            aria-label={`Image ${i + 1}`}
            aria-current={i === active}
            onClick={() => setIndex(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === active ? "w-6 bg-primary" : "w-1.5 bg-white/50 hover:bg-white/80",
            )}
          />
        ))}
      </div>

      <div className="absolute end-3 top-3 z-10 rounded-full bg-black/45 px-2 py-0.5 text-xs text-white/90 backdrop-blur-sm">
        {active + 1} / {count}
      </div>
    </div>
  );
}
