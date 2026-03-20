import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import Navbar from "@/components/Navbar";
import { SkillCard } from "@/components/SkillCard";

const CATEGORIES = ["全部", "创意设计", "开发技术", "企业通信", "文档处理", "工具"];

export default function Home() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);
  const [activeCategory, setActiveCategory] = useState(params.get("category") ?? "全部");

  const { data, isLoading } = trpc.skills.list.useQuery({
    category: activeCategory === "全部" ? undefined : activeCategory,
    limit: 60,
    orderBy: "popular",
  });

  const skills = data?.items ?? [];

  // Sync category to URL
  useEffect(() => {
    if (activeCategory === "全部") {
      setLocation("/", { replace: true });
    } else {
      setLocation(`/?category=${encodeURIComponent(activeCategory)}`, { replace: true });
    }
  }, [activeCategory, setLocation]);

  // Scroll to top when category changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeCategory]);

  // Scroll restoration: after data loads, scroll to last visited skill card
  useEffect(() => {
    if (isLoading || skills.length === 0) return;
    const lastId = sessionStorage.getItem("lastVisitedSkillId");
    if (!lastId) return;
    // Clear immediately so it only fires once per navigation
    sessionStorage.removeItem("lastVisitedSkillId");
    // Use requestAnimationFrame to ensure DOM is rendered
    requestAnimationFrame(() => {
      const el = document.getElementById(`skill-card-${lastId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Briefly highlight the card
        el.classList.add("ring-2", "ring-primary/40");
        setTimeout(() => el.classList.remove("ring-2", "ring-primary/40"), 1500);
      }
    });
  }, [isLoading, skills]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-6">
        {/* ── Category Tabs ── */}
        <div className="flex items-center gap-2 pb-1 mb-6 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                activeCategory === cat
                  ? "bg-foreground text-background border-foreground"
                  : "bg-white text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Skill Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-36 sm:h-40 rounded-xl" />
            ))}
          </div>
        ) : skills.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-muted-foreground">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-base font-medium">该分类下暂无技能</p>
            <p className="text-sm mt-1">换个分类试试，或者创建第一个</p>
          </div>
        )}
      </main>
    </div>
  );
}
