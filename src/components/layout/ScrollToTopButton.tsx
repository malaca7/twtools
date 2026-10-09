import { useState, useEffect } from "react";
import { useLocation } from "@tanstack/react-router";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollToTopButton() {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // Não exibe o botão flutuante de topo padrão da plataforma na página permissões dev (/dev/permissoes)
  const isDevPermissoes =
    location.pathname === "/dev/permissoes" ||
    location.pathname.startsWith("/dev/permissoes") ||
    (typeof window !== "undefined" && window.location.pathname.includes("/dev/permissoes"));

  if (isDevPermissoes) {
    return null;
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-6 md:bottom-8 right-4 md:right-8 z-50 rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 flex items-center justify-center cursor-pointer shadow-lg border border-primary/40 bg-gradient-brand text-primary-foreground hover:scale-110 active:scale-95 transition-all duration-300 floating-btn glow-primary",
        isVisible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-10 pointer-events-none"
      )}
      aria-label="Voltar ao topo"
    >
      <ChevronUp className="h-5 w-5 sm:h-6 sm:w-6" />
    </button>
  );
}
