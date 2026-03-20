import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import Navbar from "@/components/Navbar";
import { SkillCard } from "@/components/SkillCard";

const CATEGORIES = ["全部", "创意设计", "开发技术", "企业通信", "文档处理", "工具"];
const ORDER_OPTIONS = [
  { value: "latest", label: "最新发布" },
  { value: "popular", label: "最受欢迎" },
];

export default function Explore() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [orderBy, setOrderBy] = useState<"latest" | "popular">(
    (params.get("order") as "latest" | "popular") ?? "latest"
  );
  const [page, setPage] = useState(0);
  const LIMIT = 12;

  // Reset page on filter change
  useEffect(() => { setPage(0); }, [query, category, orderBy]);

  const { data, isLoading, isFetching } = trpc.skills.list.useQuery({
    search: query || undefined,
    category: category || undefined,
    orderBy,
    limit: LIMIT,
    offset: page * LIMIT,
    isEditorsPick: params.get("editors") === "1" ? true : undefined,
  });

  const skills = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const clearFilters = () => {
    setQuery("");
    setCategory("");
    setOrderBy("latest");
    setPage(0);
  };

  const hasFilters = query || category || orderBy !== "latest";

  // Sync state to URL
  const syncToUrl = useCallback(() => {
    const newParams = new URLSearchParams();
    if (query) newParams.set("q", query);
    if (category) newParams.set("category", category);
    if (orderBy !== "latest") newParams.set("order", orderBy);
    if (params.get("editors") === "1") newParams.set("editors", "1");
    const newSearch = newParams.toString();
    setLocation(newSearch ? `/explore?${newSearch}` : "/explore", { replace: true });
  }, [query, category, orderBy, params, setLocation]);

  useEffect(() => {
    syncToUrl();
  }, [syncToUrl]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">探索技能</h1>
          <p className="text-muted-foreground text-sm">
            发现 {total} 个 Claude Code Skills，提升你的工作效率
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-border p-4 mb-6 space-y-3">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索技能名称或描述..."
              className="pl-9 text-sm"
            />
          </form>

          {/* Category Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              分类
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat === "全部" ? "" : cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  (cat === "全部" && !category) || cat === category
                    ? "bg-primary text-white border-primary"
                    : "border-border bg-white text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Order */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">排序</span>
            {ORDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setOrderBy(opt.value as "latest" | "popular")}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  orderBy === opt.value
                    ? "bg-primary text-white border-primary"
                    : "border-border bg-white text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                清除筛选
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {(isLoading || (isFetching && skills.length === 0)) ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-36 sm:h-48 rounded-xl" />
            ))}
          </div>
        ) : skills.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {skills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  上一页
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  下一页
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-border">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">未找到相关技能</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {query ? `没有找到包含"${query}"的技能` : "当前分类暂无技能"}
            </p>
            <Button variant="outline" onClick={clearFilters}>
              清除筛选条件
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
