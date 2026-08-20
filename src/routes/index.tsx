import { createFileRoute } from "@tanstack/react-router";
import { Hero3D } from "@/components/home/Hero3D";
import { Navbar } from "@/components/layout/Navbar";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="h-screen overflow-hidden">
      <Navbar />
      <Hero3D />
    </div>
  );
}
