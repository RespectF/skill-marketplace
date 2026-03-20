import { Eye, Heart, Bookmark } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";

export interface SkillCardData {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  coverUrl?: string | null;
  isOfficial?: boolean;
  isFeatured?: boolean;
  authorName?: string | null;
  viewCount?: number;
  likeCount?: number;
  favoriteCount?: number;
  uiConfig?: string | null;
}

const CATEGORY_ICONS: Record<string, string> = {
  创意设计: "🎨",
  开发技术: "⚡",
  企业通信: "💼",
  文档处理: "📄",
  工具: "🔧",
};

const DEFAULT_SKILL_ICONS: Record<string, string> = {
  "algorithmic-art": "🎨",
  "brand-guidelines": "🏷️",
  "canvas-design": "🖼️",
  "claude-api": "🤖",
  "doc-coauthoring": "✍️",
  docx: "📝",
  "frontend-design": "💻",
  "internal-comms": "📢",
  "mcp-builder": "🔌",
  pdf: "📄",
  pptx: "📊",
  "skill-creator": "✨",
  "slack-gif-creator": "🎬",
  "theme-factory": "🎭",
  "web-artifacts-builder": "🌐",
  "webapp-testing": "🧪",
  xlsx: "📈",
};

function getSkillIcon(skill: SkillCardData): string {
  if (skill.uiConfig) {
    try {
      const config = JSON.parse(skill.uiConfig);
      if (config.icon) return config.icon;
    } catch {}
  }
  if (DEFAULT_SKILL_ICONS[skill.slug]) return DEFAULT_SKILL_ICONS[skill.slug];
  return CATEGORY_ICONS[skill.category] ?? "🤖";
}

function getSkillTheme(skill: SkillCardData): string {
  if (skill.uiConfig) {
    try {
      const config = JSON.parse(skill.uiConfig);
      return config.theme ?? "blue";
    } catch {}
  }
  return "blue";
}

const THEME_GRADIENTS: Record<string, string> = {
  purple: "from-purple-50 to-violet-50",
  blue: "from-blue-50 to-indigo-50",
  green: "from-green-50 to-emerald-50",
  orange: "from-orange-50 to-amber-50",
  pink: "from-pink-50 to-rose-50",
  teal: "from-teal-50 to-cyan-50",
  red: "from-red-50 to-rose-50",
};

const THEME_ICON_BG: Record<string, string> = {
  purple: "bg-purple-100",
  blue: "bg-blue-100",
  green: "bg-green-100",
  orange: "bg-orange-100",
  pink: "bg-pink-100",
  teal: "bg-teal-100",
  red: "bg-red-100",
};

// ─── Like/Favorite Button ─────────────────────────────────────────────────────

function LikeFavoriteButtons({ skill }: { skill: SkillCardData }) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  // Fetch current user's interaction state for this skill
  const { data: interactions } = trpc.interactions.getInteractions.useQuery(
    { skillIds: [skill.id] },
    { enabled: isAuthenticated }
  );

  const liked = interactions?.likes.includes(skill.id) ?? false;
  const favorited = interactions?.favorites.includes(skill.id) ?? false;

  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticFavorited, setOptimisticFavorited] = useState<boolean | null>(null);

  const isLiked = optimisticLiked !== null ? optimisticLiked : liked;
  const isFavorited = optimisticFavorited !== null ? optimisticFavorited : favorited;

  const likeMutation = trpc.interactions.toggleLike.useMutation({
    onMutate: () => {
      // Capture current state before mutation
      setOptimisticLiked(!liked);
    },
    onSuccess: () => {
      setOptimisticLiked(null);
      utils.interactions.getInteractions.invalidate();
      utils.skills.list.invalidate();
      toast.success(!liked ? "已点赞" : "已取消点赞");
    },
    onError: () => {
      setOptimisticLiked(null);
      toast.error("操作失败，请重试");
    },
  });

  const favMutation = trpc.interactions.toggleFavorite.useMutation({
    onMutate: () => {
      // Capture current state before mutation
      setOptimisticFavorited(!favorited);
    },
    onSuccess: () => {
      setOptimisticFavorited(null);
      utils.interactions.getInteractions.invalidate();
      utils.interactions.getFavorites.invalidate();
      utils.skills.list.invalidate();
      toast.success(!favorited ? "已收藏" : "已取消收藏");
    },
    onError: () => {
      setOptimisticFavorited(null);
      toast.error("操作失败，请重试");
    },
  });

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error("请先登录"); return; }
    likeMutation.mutate({ skillId: skill.id });
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error("请先登录"); return; }
    favMutation.mutate({ skillId: skill.id });
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleLike}
        className={`flex items-center gap-0.5 text-[11px] px-2 py-1.5 rounded-full transition-all duration-150 cursor-pointer active:scale-90 sm:px-1.5 sm:py-0.5 ${
          isLiked
            ? "text-red-500 bg-red-50"
            : "text-muted-foreground hover:text-red-400 hover:bg-red-50"
        }`}
        title={isLiked ? "取消点赞" : "点赞"}
      >
        <Heart className={`w-3 h-3 ${isLiked ? "fill-current" : ""}`} />
        <span className="hidden sm:inline">{(skill.likeCount ?? 0) + (optimisticLiked === true ? 1 : optimisticLiked === false ? -1 : 0)}</span>
      </button>
      <button
        onClick={handleFavorite}
        className={`flex items-center gap-0.5 text-[11px] px-2 py-1.5 rounded-full transition-all duration-150 cursor-pointer active:scale-90 sm:px-1.5 sm:py-0.5 ${
          isFavorited
            ? "text-amber-500 bg-amber-50"
            : "text-muted-foreground hover:text-amber-400 hover:bg-amber-50"
        }`}
        title={isFavorited ? "取消收藏" : "收藏"}
      >
        <Bookmark className={`w-3 h-3 ${isFavorited ? "fill-current" : ""}`} />
      </button>
    </div>
  );
}

// ─── Standard Card ────────────────────────────────────────────────────────────

/** 标准卡片（用于编辑精选、搜索结果等网格展示） */
export function SkillCard({ skill }: { skill: SkillCardData }) {
  const icon = getSkillIcon(skill);
  const theme = getSkillTheme(skill);
  const iconBg = THEME_ICON_BG[theme] ?? THEME_ICON_BG.blue;

  const handleClick = () => {
    // Save last visited skill id for scroll restoration
    sessionStorage.setItem("lastVisitedSkillId", String(skill.id));
  };

  return (
    <Link href={`/skill/${skill.slug}`} onClick={handleClick}>
      <div
        id={`skill-card-${skill.id}`}
        className="skill-card bg-white rounded-xl border border-border p-4 cursor-pointer h-full flex flex-col"
      >
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center text-2xl mb-3 shrink-0`}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm text-foreground line-clamp-1">{skill.title}</h3>
            {skill.isOfficial && (
              <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
                官方
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {skill.description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full cat-badge-${skill.category}`}>
            {skill.category}
          </span>
          <div className="flex items-center gap-2">
            <LikeFavoriteButtons skill={skill} />
            {(skill.viewCount ?? 0) > 0 && (
              <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                <Eye className="w-3 h-3" />
                {skill.viewCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/** 大横幅卡片（用于编辑推荐 Banner） */
export function FeaturedSkillCard({ skill }: { skill: SkillCardData }) {
  const icon = getSkillIcon(skill);
  const theme = getSkillTheme(skill);
  const gradient = THEME_GRADIENTS[theme] ?? THEME_GRADIENTS.blue;

  const handleClick = () => {
    sessionStorage.setItem("lastVisitedSkillId", String(skill.id));
  };

  return (
    <Link href={`/skill/${skill.slug}`} onClick={handleClick}>
      <div className={`skill-card bg-gradient-to-br ${gradient} rounded-2xl border border-border p-6 cursor-pointer h-full flex items-center justify-between gap-4 min-h-[160px]`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              ⭐ 编辑推荐
            </span>
            {skill.isOfficial && (
              <span className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                官方
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2 line-clamp-1">{skill.title}</h2>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {skill.description}
          </p>
          {skill.authorName && (
            <p className="text-xs text-muted-foreground mt-3">@{skill.authorName}</p>
          )}
        </div>
        <div className="shrink-0 w-20 h-20 rounded-2xl bg-white/60 flex items-center justify-center text-4xl shadow-sm">
          {icon}
        </div>
      </div>
    </Link>
  );
}

/** 水平列表卡片（用于近期热门横向滚动） */
export function HorizontalSkillCard({ skill }: { skill: SkillCardData }) {
  const icon = getSkillIcon(skill);
  const theme = getSkillTheme(skill);
  const iconBg = THEME_ICON_BG[theme] ?? THEME_ICON_BG.blue;

  const handleClick = () => {
    sessionStorage.setItem("lastVisitedSkillId", String(skill.id));
  };

  return (
    <Link href={`/skill/${skill.slug}`} onClick={handleClick}>
      <div className="skill-card bg-white rounded-xl border border-border p-4 cursor-pointer w-52 shrink-0">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-xl mb-3`}>
          {icon}
        </div>
        <h3 className="font-semibold text-sm text-foreground line-clamp-1 mb-1">{skill.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
          {skill.description}
        </p>
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full cat-badge-${skill.category}`}>
            {skill.category}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Eye className="w-3 h-3" />
            {skill.viewCount ?? 0}
          </span>
        </div>
      </div>
    </Link>
  );
}
