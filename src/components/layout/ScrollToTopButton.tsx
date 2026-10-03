import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ScrollToTopButton() {
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

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <Button
      type="button"
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-6 md:bottom-8 right-4 md:right-8 z-50 rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 shadow-lg border border-primary/30 bg-primary/90 text-primary-foreground hover:bg-primary hover:scale-110 active:scale-95 transition-all duration-300",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
      )}
      aria-label="Voltar ao topo"
    >
      <ChevronUp className="h-5 w-5 sm:h-6 sm:w-6" />
    </Button>
  );
}
