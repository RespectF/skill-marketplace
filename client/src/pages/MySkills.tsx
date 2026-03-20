import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus, Pencil, Trash2, Eye, Github, RefreshCw, MessageSquare, ChevronRight, Clock, User, Bot, X, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useRef, useEffect } from "react";
import { Streamdown } from "streamdown";

// ─── Types ───────────────────────────────────────────────────────────────────

type Conversation = {
  id: number;
  title: string | null;
  messageCount: number;
  updatedAt: Date;
  skillTitle?: string | null;
  skillSlug?: string | null;
};

// ─── Conversation Detail Sheet ────────────────────────────────────────────────

function ConversationDetailSheet({
  conversation,
  open,
  onClose,
}: {
  conversation: Conversation | null;
  open: boolean;
  onClose: () => void;
}) {
  // Track current conversation ID to ignore stale responses
  const currentConvIdRef = useRef<number | null>(null);

  const { data: messages, isLoading } = trpc.conversations.messages.useQuery(
    { conversationId: conversation?.id ?? 0 },
    { enabled: open && !!conversation?.id }
  );

  // Update current conversation ID when conversation changes
  useEffect(() => {
    if (conversation?.id) {
      currentConvIdRef.current = conversation.id;
    }
  }, [conversation?.id]);

  // Filter messages to only show data for current conversation
  // This prevents stale responses from overwriting newer ones
  const isStaleResponse = conversation?.id !== currentConvIdRef.current;
  const displayMessages = isStaleResponse ? [] : (messages ?? []);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <SheetHeader className="px-5 py-4 border-b border-border shrink-0">
          <SheetTitle className="text-base font-semibold text-foreground leading-snug truncate mb-2">
            {conversation?.title ?? "对话详情"}
          </SheetTitle>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            {conversation?.skillTitle && (
              <span className="flex items-center gap-1">
                <Bot className="w-3 h-3" />
                {conversation.skillTitle}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {conversation?.messageCount ?? 0} 条消息
            </span>
            {conversation?.updatedAt && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(conversation.updatedAt).toLocaleString("zh-CN", {
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
          {conversation?.skillSlug && (
            <Button variant="outline" size="sm" asChild className="mt-3 h-8 text-xs gap-1 w-fit">
              <Link href={`/skill/${conversation.skillSlug}`} onClick={onClose}>
                <ChevronRight className="w-3.5 h-3.5" />
                继续对话
              </Link>
            </Button>
          )}
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-5 py-4">
          {isLoading || isStaleResponse ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}>
                  <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                  <Skeleton className={`h-16 rounded-xl ${i % 2 === 0 ? "w-2/3" : "w-3/4"}`} />
                </div>
              ))}
            </div>
          ) : displayMessages && displayMessages.length > 0 ? (
            <div className="space-y-4 pb-4">
              {displayMessages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">暂无消息记录</p>
              <p className="text-xs text-muted-foreground/60 mt-1">在左侧输入框发送消息开始对话</p>
            </div>
          )}
        </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: { id: number; role: string; content: string; createdAt: Date } }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col gap-1 max-w-[82%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted/60 text-foreground rounded-tl-sm border border-border/50"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-pre:my-2 prose-ul:my-1 prose-li:my-0.5">
              <Streamdown>{message.content}</Streamdown>
            </div>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">
          {new Date(message.createdAt).toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MySkills() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // Conversation detail sheet state
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, isLoading } = trpc.skills.list.useQuery(
    { authorId: user?.id, limit: 50, orderBy: "latest" },
    { enabled: !!user?.id }
  );

  const { data: conversations, isLoading: loadingConversations } = trpc.conversations.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const deleteMutation = trpc.skills.delete.useMutation({
    onSuccess: () => {
      toast.success("技能已删除");
      utils.skills.list.invalidate();
      utils.conversations.list.invalidate();
    },
    onError: (e) => toast.error(e.message ?? "删除失败"),
  });

  const deleteConvMutation = trpc.conversations.delete.useMutation({
    onSuccess: () => {
      toast.success("对话已删除");
      utils.conversations.list.invalidate();
    },
    onError: (e) => toast.error(e.message ?? "删除失败"),
  });

  const regenerateMutation = trpc.skills.regenerateUiConfig.useMutation({
    onSuccess: () => {
      toast.success("界面配置已重新生成");
      utils.skills.list.invalidate();
    },
    onError: (e) => toast.error(e.message ?? "生成失败"),
  });

  const handleOpenConv = (conv: Conversation) => {
    setSelectedConv(conv);
    setSheetOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-24 text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">请先登录</h2>
          <p className="text-muted-foreground mb-6">登录后查看你创建的技能</p>
          <Button asChild>
            <a href={getLoginUrl()}>立即登录</a>
          </Button>
        </div>
      </div>
    );
  }

  const skills = data?.items ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">我的技能</h1>
          <p className="text-muted-foreground text-sm">
            {skills.length} 个技能 · {conversations?.length ?? 0} 条对话记录
          </p>
        </div>

        <Tabs defaultValue="skills">
          <TabsList className="mb-5">
            <TabsTrigger value="skills" className="gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              我的技能
              {skills.length > 0 && (
                <span className="ml-1 text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
                  {skills.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              对话历史
              {(conversations?.length ?? 0) > 0 && (
                <span className="ml-1 text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
                  {conversations?.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ─── 我的技能 Tab ─── */}
          <TabsContent value="skills">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 sm:h-24 rounded-xl" />
                ))}
              </div>
            ) : skills.length > 0 ? (
              <div className="space-y-3">
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="bg-white rounded-xl border border-border p-4 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                      {getSkillIcon(skill.uiConfig)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-sm text-foreground truncate">
                          {skill.title}
                        </h3>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full cat-badge-${skill.category} shrink-0`}
                        >
                          {skill.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {skill.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Eye className="w-3 h-3" />
                          {skill.viewCount} 次查看
                        </span>
                        {skill.githubUrl && (
                          <a
                            href={skill.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-0.5 hover:text-foreground"
                          >
                            <Github className="w-3 h-3" />
                            GitHub
                          </a>
                        )}
                        <span>{new Date(skill.createdAt).toLocaleDateString("zh-CN")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs">
                        <Link href={`/skill/${skill.slug}`}>
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => regenerateMutation.mutate({ id: skill.id })}
                        disabled={regenerateMutation.isPending}
                        className="h-8 px-2 text-xs"
                        title="重新生成 UI 配置"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${regenerateMutation.isPending ? "animate-spin" : ""}`}
                        />
                      </Button>
                      <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs">
                        <Link href={`/edit/${skill.id}`}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除技能「{skill.title}」吗？此操作不可撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate({ id: skill.id })}
                              disabled={deleteMutation.isPending}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deleteMutation.isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  删除中...
                                </>
                              ) : (
                                "删除"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-border">
                <div className="text-5xl mb-4">✨</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">还没有创建技能</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  创建你的第一个 Skill，分享给社区
                </p>
                <Button onClick={() => setLocation("/create")}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  创建技能
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ─── 对话历史 Tab ─── */}
          <TabsContent value="history">
            {loadingConversations ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 sm:h-16 rounded-xl" />
                ))}
              </div>
            ) : (conversations?.length ?? 0) > 0 ? (
              <div className="space-y-2">
                {conversations!.map((conv) => (
                  <div
                    key={conv.id}
                    className="bg-white rounded-xl border border-border p-4 flex items-center gap-4 group hover:border-primary/30 hover:bg-primary/[0.02] transition-all cursor-pointer"
                    onClick={() => handleOpenConv(conv as Conversation)}
                  >
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4 text-primary" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-foreground truncate">
                          {conv.title ?? "对话"}
                        </p>
                        {conv.skillTitle && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                            {conv.skillTitle}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <MessageSquare className="w-3 h-3" />
                          {conv.messageCount} 条消息
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(conv.updatedAt).toLocaleString("zh-CN", {
                            month: "numeric",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* View detail hint — clickable, stops propagation so delete dialog isn't triggered */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenConv(conv as Conversation); }}
                        className="text-[11px] text-muted-foreground/60 group-hover:text-primary/60 transition-colors hidden sm:block cursor-pointer"
                      >
                        点击查看详情
                      </button>
                      <ChevronRight
                        onClick={(e) => { e.stopPropagation(); handleOpenConv(conv as Conversation); }}
                        className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors cursor-pointer shrink-0"
                      />

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 px-2 text-xs text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除这条对话记录吗？此操作不可撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                deleteConvMutation.mutate({ conversationId: conv.id })
                              }
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-border">
                <div className="text-5xl mb-4">💬</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">还没有对话记录</h3>
                <p className="text-muted-foreground text-sm">
                  使用技能对话后，历史记录会保存在这里
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── Conversation Detail Sheet ─── */}
      <ConversationDetailSheet
        conversation={selectedConv}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSkillIcon(uiConfig: string | null | undefined): string {
  if (!uiConfig) return "🤖";
  try {
    const config = JSON.parse(uiConfig);
    return config.icon ?? "🤖";
  } catch {
    return "🤖";
  }
}
