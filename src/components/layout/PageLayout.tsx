import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

type PageLayoutProps = {
  children: ReactNode;
  fullWidth?: boolean;
  noNav?: boolean;
  className?: string;
};

export const pageGutter = "px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20";
export const navHeight = "h-[4.25rem]";
export const navOffset = "pt-[4.25rem]";
export const navPull = "-mt-[4.25rem]";
export const navStickyTop = "top-[4.25rem]";

export function PageLayout({ children, fullWidth, noNav, className }: PageLayoutProps) {
  return (
    <div className="min-h-screen">
      {!noNav && <Navbar />}
      <main className={cn(noNav ? "" : navOffset, className)}>
        {fullWidth ? (
          children
        ) : (
          <div className={cn("mx-auto max-w-7xl py-8", pageGutter)}>{children}</div>
        )}
      </main>
    </div>
  );
}
