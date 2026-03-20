import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bookmark,
  Settings,
  Camera,
  Save,
  ArrowLeft,
  Heart,
  Eye,
  Loader2,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

// ─── Profile Edit Section ─────────────────────────────────────────────────────

function ProfileEditSection() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [name, setName] = useState(user?.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState((user as any)?.avatarUrl ?? "");
  const [isDirty, setIsDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setAvatarUrl((user as any).avatarUrl ?? "");
    }
  }, [user]);

  const updateProfile = trpc.interactions.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("个人信息已更新");
      utils.auth.me.invalidate();
      setIsDirty(false);
    },
    onError: (e) => toast.error(e.message ?? "更新失败"),
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("名称不能为空");
      return;
    }
    updateProfile.mutate({ name: name.trim(), avatarUrl: avatarUrl.trim() });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("图片大小不能超过 2MB");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setAvatarUrl(base64);
        setIsDirty(true);
        setUploading(false);
      };
      reader.onerror = () => {
        toast.error("图片上传失败");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("图片上传失败");
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-border p-6 space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <Avatar
            className="w-20 h-20 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleAvatarClick}
          >
            <AvatarImage src={avatarUrl || undefined} alt={name} />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              {name?.charAt(0)?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          {uploading ? (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
              <Loader2 className="w-3 h-3 animate-spin" />
            </div>
          ) : (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-foreground flex items-center justify-center">
              <Camera className="w-3 h-3 text-background" />
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        <div className="min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="font-semibold text-foreground truncate">{user?.name}</p>
            </TooltipTrigger>
            <TooltipContent>{user?.name ?? "-"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            </TooltipTrigger>
            <TooltipContent>{user?.email ?? "-"}</TooltipContent>
          </Tooltip>
          <p className="text-xs text-muted-foreground mt-0.5">
            加入时间：{user?.createdAt ? new Date(user.createdAt).toLocaleDateString("zh-CN") : "-"}
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium mb-1.5 block">
            显示名称 <span className="text-destructive">*</span>
          </Label>
          <Input
            value={name}
            onChange={(e) => { setName(e.target.value); setIsDirty(true); }}
            placeholder="你的名称"
            maxLength={64}
          />
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={!isDirty || updateProfile.isPending}
        className="w-full"
      >
        {updateProfile.isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-2" />保存中...</>
        ) : (
          <><Save className="w-4 h-4 mr-2" />保存修改</>
        )}
      </Button>
    </div>
  );
}

// ─── My Favorites Section ─────────────────────────────────────────────────────

function MyFavoritesSection() {
  const [, setLocation] = useLocation();
  const { data: favorites, isLoading } = trpc.interactions.getFavorites.useQuery();
  const utils = trpc.useUtils();

  const toggleFavorite = trpc.interactions.toggleFavorite.useMutation({
    onSuccess: (data) => {
      toast.success(data.favorited ? "已收藏" : "已取消收藏");
      utils.interactions.getFavorites.invalidate();
    },
    onError: (e) => toast.error(e.message ?? "操作失败"),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 sm:h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🔖</div>
        <p className="text-foreground font-medium mb-1">还没有收藏的技能</p>
        <p className="text-muted-foreground text-sm mb-4">在技能广场发现喜欢的技能，点击收藏按钮即可保存</p>
        <Button asChild variant="outline">
          <Link href="/">去广场逛逛</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {favorites.map((skill: any) => (
        <div
          key={skill.id}
          className="bg-white rounded-xl border border-border p-4 hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => setLocation(`/skill/${skill.slug}`)}
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center text-2xl shrink-0">
              {skill.icon ?? "🤖"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-blue-600 transition-colors">
                  {skill.title}
                </h3>
                {skill.isOfficial && (
                  <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full shrink-0">官方</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {skill.description}
              </p>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{skill.viewCount}</span>
                <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{skill.likeCount ?? 0}</span>
                <span className={`px-1.5 py-0.5 rounded-full cat-badge-${skill.category} text-[10px]`}>{skill.category}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">@{skill.authorName ?? "官方"}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite.mutate({ skillId: skill.id });
              }}
              className="text-xs text-amber-500 hover:text-amber-600 flex items-center gap-1 transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              取消收藏
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Profile Page ───────────────────────────────────────────────────────

export default function Profile() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8 max-w-3xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-36 sm:h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-24 text-center">
          <div className="text-5xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">请先登录</h2>
          <p className="text-muted-foreground mb-6">登录后查看个人信息和收藏的技能</p>
          <Button asChild>
            <a href={getLoginUrl()}>立即登录</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回广场
          </Link>
          <h1 className="text-2xl font-bold text-foreground">用户中心</h1>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="gap-1.5">
              <Settings className="w-4 h-4" />
              个人信息
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-1.5">
              <Bookmark className="w-4 h-4" />
              我的收藏
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileEditSection />
          </TabsContent>

          <TabsContent value="favorites">
            <MyFavoritesSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
