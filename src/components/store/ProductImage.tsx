import { cn } from "@/lib/utils";

type ProductImageProps = {
  category: string;
  title: string;
  imageUrl?: string | null | undefined;
  className?: string | undefined;
  priority?: boolean | undefined;
};

export function ProductImage({ title, imageUrl, className }: ProductImageProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={title}
        loading="lazy"
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950",
        className,
      )}
    >
      <span className="font-display text-sm tracking-widest text-primary/40 uppercase">
        SAMURAI
      </span>
    </div>
  );
}
