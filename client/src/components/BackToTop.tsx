import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Button
        onClick={scrollToTop}
        size="icon"
        className="shadow-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-90 transition-all"
        aria-label="回到顶部"
      >
        <ChevronUp className="w-5 h-5" />
      </Button>
    </div>
  );
}
