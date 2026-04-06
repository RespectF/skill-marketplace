import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Eye,
  Github,
  Send,
  Copy,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  StopCircle,
  AlertCircle,
  User,
  Bot,
  Trash2,
  Key,
  Loader2,
  MessageSquare,
  Plus,
  Clock,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Link, useRoute } from "wouter";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SkillUiConfig {
  theme: string;
  icon: string;
  heroTitle: string;
  heroSubtitle: string;
  features: Array<{ icon: string; title: string; desc: string }>;
  useCases: string[];
  inputFields: Array<{
    id: string;
    label: string;
    type: "text" | "textarea" | "file" | "select";
    placeholder: string;
    options?: string[];
  }>;
  outputType: string;
  steps: string[];
  tags: string[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

interface Conversation {
  id: number;
  title: string | null;
  messageCount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  skillId: number;
}

// ─── Theme config ─────────────────────────────────────────────────────────────

const THEME_CONFIG: Record<
  string,
  {
    gradient: string;
    accent: string;
    badge: string;
    iconBg: string;
    heroBg: string;
  }
> = {
  purple: {
    gradient: "from-purple-600 to-violet-600",
    accent: "text-purple-600",
    badge: "bg-purple-100 text-purple-700",
    iconBg: "bg-purple-100",
    heroBg: "from-purple-50 via-violet-50 to-white",
  },
  blue: {
    gradient: "from-blue-600 to-indigo-600",
    accent: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
    iconBg: "bg-blue-100",
    heroBg: "from-blue-50 via-indigo-50 to-white",
  },
  green: {
    gradient: "from-green-600 to-emerald-600",
    accent: "text-green-600",
    badge: "bg-green-100 text-green-700",
    iconBg: "bg-green-100",
    heroBg: "from-green-50 via-emerald-50 to-white",
  },
  orange: {
    gradient: "from-orange-500 to-amber-500",
    accent: "text-orange-600",
    badge: "bg-orange-100 text-orange-700",
    iconBg: "bg-orange-100",
    heroBg: "from-orange-50 via-amber-50 to-white",
  },
  pink: {
    gradient: "from-pink-500 to-rose-500",
    accent: "text-pink-600",
    badge: "bg-pink-100 text-pink-700",
    iconBg: "bg-pink-100",
    heroBg: "from-pink-50 via-rose-50 to-white",
  },
  teal: {
    gradient: "from-teal-500 to-cyan-500",
    accent: "text-teal-600",
    badge: "bg-teal-100 text-teal-700",
    iconBg: "bg-teal-100",
    heroBg: "from-teal-50 via-cyan-50 to-white",
  },
  red: {
    gradient: "from-red-500 to-rose-600",
    accent: "text-red-600",
    badge: "bg-red-100 text-red-700",
    iconBg: "bg-red-100",
    heroBg: "from-red-50 via-rose-50 to-white",
  },
};

function getTheme(name: string) {
  return THEME_CONFIG[name] ?? THEME_CONFIG.blue;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SkillDetail() {
  const [, params] = useRoute("/skill/:slug");
  const slug = params?.slug ?? "";

  const { data: skill, isLoading } = trpc.skills.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  // Conversation state for this skill
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  // Track the conversation ID that should be displayed (for immediate clearing on delete)
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  // Key to force clear messages when deleting conversation
  const [clearMessagesKey, setClearMessagesKey] = useState(0);

  const { data: conversations, isLoading: loadingConversations } =
    trpc.conversations.listBySkill.useQuery(
      { skillId: skill?.id ?? 0 },
      { enabled: !!skill?.id && isAuthenticated }
    );

  const deleteConvMutation = trpc.conversations.delete.useMutation({
    onSuccess: () => {
      toast.success("对话已删除");
      // Refresh conversation list immediately
      utils.conversations.listBySkill.invalidate({ skillId: skill?.id ?? 0 });
    },
    onError: e => toast.error(e.message ?? "删除失败"),
  });

  const handleNewConversation = () => {
    setSelectedConvId(null);
    setActiveConvId(null);
  };

  const handleSelectConversation = (convId: number) => {
    setSelectedConvId(convId);
    setActiveConvId(convId);
  };

  const handleDeleteConversation = (convId: number) => {
    // Immediately clear messages if deleting the currently viewed conversation
    if (activeConvId === convId) {
      setActiveConvId(null);
      setClearMessagesKey(k => k + 1);
    }
    deleteConvMutation.mutate({ conversationId: convId });
  };

  if (isLoading) return <LoadingSkeleton />;
  if (!skill) return <NotFoundState />;

  let uiConfig: SkillUiConfig | null = null;
  try {
    if (skill.uiConfig) uiConfig = JSON.parse(skill.uiConfig);
  } catch {}

  const theme = getTheme(uiConfig?.theme ?? "blue");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero ── */}
      <div
        className={`bg-gradient-to-b ${theme.heroBg} border-b border-border`}
      >
        <div className="container py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5 min-w-0">
            <Link
              href="/"
              className="hover:text-foreground transition-colors shrink-0"
            >
              广场
            </Link>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span
              className={`font-medium cat-badge-${skill.category} px-2 py-0.5 rounded-full text-xs shrink-0`}
            >
              {skill.category}
            </span>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-foreground font-medium truncate min-w-0">
                  {skill.title}
                </span>
              </TooltipTrigger>
              <TooltipContent>{skill.title}</TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-5">
            <div
              className={`w-16 h-16 rounded-2xl ${theme.iconBg} flex items-center justify-center text-3xl shrink-0 shadow-sm`}
            >
              {uiConfig?.icon ?? "🤖"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap min-w-0">
                <h1
                  className="text-xl font-bold text-foreground truncate min-w-0"
                  title={skill.title}
                >
                  {skill.title}
                </h1>
                {skill.isOfficial && (
                  <span className="text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                    ✓ 官方
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 min-w-0">
                {skill.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 flex-wrap min-w-0">
                {skill.authorName && (
                  <span className="truncate min-w-0" title={skill.authorName}>
                    @{skill.authorName}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {skill.viewCount}
                </span>
                {skill.githubUrl && (
                  <a
                    href={skill.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <Github className="w-3 h-3" />
                    GitHub
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Conversation List */}
          <div className="lg:col-span-1">
            <ConversationListPanel
              skill={skill}
              conversations={conversations ?? []}
              isLoading={loadingConversations}
              selectedConvId={selectedConvId}
              onNewConversation={handleNewConversation}
              onSelectConversation={handleSelectConversation}
              onDeleteConversation={handleDeleteConversation}
              theme={theme}
            />
          </div>

          {/* Middle: Chat Panel */}
          <div className="lg:col-span-2">
            <SkillChatPanel
              skill={skill}
              uiConfig={uiConfig}
              theme={theme}
              conversationId={activeConvId}
              clearMessagesTrigger={clearMessagesKey}
              onConversationCreated={id => {
                setActiveConvId(id);
                setSelectedConvId(id);
              }}
            />
          </div>

          {/* Right: Compact Sidebar */}
          <div className="space-y-4">
            {/* Skill Overview — merged features + use cases + steps */}
            <SkillOverviewCard uiConfig={uiConfig} theme={theme} />

            {/* Skill Meta */}
            <div className="bg-white rounded-xl border border-border p-4">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground">分类</dt>
                  <dd>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full cat-badge-${skill.category}`}
                    >
                      {skill.category}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between min-w-0">
                  <dt className="text-muted-foreground shrink-0">作者</dt>
                  <dd
                    className="font-medium truncate min-w-0"
                    title={skill.authorName ?? "官方"}
                  >
                    @{skill.authorName ?? "官方"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">发布时间</dt>
                  <dd className="text-muted-foreground">
                    {new Date(skill.createdAt).toLocaleDateString("zh-CN")}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">查看次数</dt>
                  <dd className="font-medium">{skill.viewCount}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Compact Overview Card ────────────────────────────────────────────────────

function SkillOverviewCard({
  uiConfig,
  theme,
}: {
  uiConfig: SkillUiConfig | null;
  theme: ReturnType<typeof getTheme>;
}) {
  if (!uiConfig) return null;

  const hasFeatures = uiConfig.features?.length > 0;
  const hasUseCases = uiConfig.useCases?.length > 0;
  const hasSteps = uiConfig.steps?.length > 0;

  if (!hasFeatures && !hasUseCases && !hasSteps) return null;

  return (
    <div className="bg-white rounded-xl border border-border p-4 space-y-4">
      <h3 className="font-semibold text-foreground text-sm">技能介绍</h3>

      {/* Features as compact chips */}
      {hasFeatures && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">核心能力</p>
          <div className="flex flex-wrap gap-1.5">
            {uiConfig.features.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-muted/50 text-foreground max-w-[200px] shrink-0"
                title={f.title}
              >
                <span className="shrink-0">{f.icon}</span>
                <span className="truncate">{f.title}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Use cases as simple list */}
      {hasUseCases && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">适用场景</p>
          <ul className="space-y-1">
            {uiConfig.useCases.slice(0, 4).map((uc, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-xs text-muted-foreground min-w-0"
              >
                <CheckCircle2
                  className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${theme.accent}`}
                />
                <span className="min-w-0 break-words">{uc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Steps as numbered inline */}
      {hasSteps && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">执行流程</p>
          <ol className="space-y-1.5">
            {uiConfig.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 bg-gradient-to-br ${theme.gradient} text-white`}
                >
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

// ─── API Key Config Dialog ────────────────────────────────────────────────────

/**
 * Detect if a SKILL.md requires an API key by scanning for common keywords.
 */
function skillNeedsApiKey(skillMd: string): boolean {
  const lower = skillMd.toLowerCase();
  const keywords = [
    "api_key",
    "api key",
    "apikey",
    "api-key",
    "openai_api_key",
    "anthropic_api_key",
    "gemini_api_key",
    "access_token",
    "secret_key",
    "bearer token",
    "set your api",
    "your api key",
    "configure your",
  ];
  return keywords.some(kw => lower.includes(kw));
}

function ApiKeyDialog({
  open,
  onClose,
  onSave,
  skill,
  isSaving,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  skill: any;
  isSaving: boolean;
}) {
  const [keyValue, setKeyValue] = useState("");

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-500" />
            配置 API Key
          </DialogTitle>
          <DialogDescription>
            「{skill.title}」需要外部 API Key 才能运行。请输入你的 API
            Key，它将被安全保存，仅用于执行此技能。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Input
            type="password"
            placeholder="sk-... 或其他格式的 API Key"
            value={keyValue}
            onChange={e => setKeyValue(e.target.value)}
            onKeyDown={e =>
              e.key === "Enter" && keyValue.trim() && onSave(keyValue.trim())
            }
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            💡 你的 API Key
            独立保存，其他用户无法看到。可随时在技能详情页重新配置。
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            跳过
          </Button>
          <Button
            onClick={() => keyValue.trim() && onSave(keyValue.trim())}
            disabled={!keyValue.trim() || isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : null}
            保存并继续
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Conversation List Panel ──────────────────────────────────────────────────

function ConversationListPanel({
  skill,
  conversations,
  isLoading,
  selectedConvId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  theme,
}: {
  skill: any;
  conversations: Conversation[];
  isLoading: boolean;
  selectedConvId: number | null;
  onNewConversation: () => void;
  onSelectConversation: (id: number) => void;
  onDeleteConversation: (id: number) => void;
  theme: ReturnType<typeof getTheme>;
}) {
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden flex flex-col h-[560px] max-h-[560px]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">对话列表</span>
          {conversations.length > 0 && (
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
              {conversations.length}
            </span>
          )}
        </div>
        <button
          onClick={onNewConversation}
          className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center bg-gradient-to-br ${theme.gradient} text-white hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer`}
          title="新建对话"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div
            role="status"
            className="flex flex-col items-center justify-center h-full text-center px-4 py-8"
          >
            <MessageSquare className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">暂无对话记录</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              点击右上角 + 开始新对话
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map(conv => (
              <div
                key={conv.id}
                className={`group relative rounded-lg p-3 cursor-pointer transition-all ${
                  selectedConvId === conv.id
                    ? "bg-gradient-to-br " +
                      theme.heroBg +
                      " border border-" +
                      theme.accent.replace("text-", "") +
                      "/30"
                    : "hover:bg-muted/50 border border-transparent"
                }`}
                onClick={() => onSelectConversation(conv.id)}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg ${theme.iconBg} flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    <Bot className={`w-4 h-4 ${theme.accent}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium text-foreground truncate leading-snug min-w-0"
                      title={conv.title || "新对话"}
                    >
                      {conv.title || "新对话"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {conv.messageCount}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(conv.updatedAt).toLocaleDateString("zh-CN", {
                          month: "numeric",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      onClick={e => e.stopPropagation()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive active:scale-95 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>删除对话</AlertDialogTitle>
                      <AlertDialogDescription>
                        确定要删除「{conv.title || "新对话"}
                        」吗？此操作不可撤销。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDeleteConversation(conv.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        删除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Multi-turn Chat Panel ────────────────────────────────────────────────────

function SkillChatPanel({
  skill,
  uiConfig,
  theme,
  conversationId: externalConvId,
  clearMessagesTrigger,
  onConversationCreated,
}: {
  skill: any;
  uiConfig: SkillUiConfig | null;
  theme: ReturnType<typeof getTheme>;
  conversationId?: number | null;
  clearMessagesTrigger?: number;
  onConversationCreated?: (id: number) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(
    externalConvId ?? null
  );
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [pendingInput, setPendingInput] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevClearTriggerRef = useRef<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  // Track the current conversation ID for deletion checking
  const currentConvIdRef = useRef<number | null>(null);

  // Persist messages to sessionStorage for page refresh recovery
  // Use skill.id and externalConvId to distinguish different conversations
  const storageKey = `skill-chat-${skill.id}-${externalConvId ?? "new"}`;

  // Restore messages from sessionStorage when switching to an existing conversation
  useEffect(() => {
    if (externalConvId === null) {
      // New conversation mode - don't restore from sessionStorage
      return;
    }

    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [externalConvId, storageKey]);

  // Save messages to sessionStorage on change (only for existing conversations)
  useEffect(() => {
    if (messages.length > 0 && externalConvId !== null) {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(messages));
      } catch {
        // Ignore storage errors (e.g., quota exceeded))
      }
    }
  }, [messages, externalConvId, storageKey]);

  // tRPC mutations for conversation persistence
  const createConversation = trpc.conversations.create.useMutation();
  const saveRound = trpc.conversations.saveRound.useMutation();
  const saveApiKey = trpc.interactions.saveApiKey.useMutation();

  // Track if we're in the middle of creating a new conversation
  const isCreatingConversationRef = useRef(false);

  // Load messages when switching to an existing conversation
  const { data: loadedMessages } = trpc.conversations.messages.useQuery(
    { conversationId: externalConvId ?? 0 },
    { enabled: !!externalConvId }
  );

  // Sync external conversation ID changes and load history
  useEffect(() => {
    // Always sync conversationId with externalConvId
    setConversationId(externalConvId ?? null);
  }, [externalConvId]);

  // Clear messages when switching to new conversation (detected by externalConvId becoming null)
  useEffect(() => {
    // When externalConvId becomes null, immediately clear messages
    if (externalConvId === null) {
      setMessages([]);
      setIsStreaming(false);
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    }
  }, [externalConvId]);

  // Clear messages when clearMessagesTrigger changes (delete conversation)
  useEffect(() => {
    if (
      clearMessagesTrigger !== undefined &&
      clearMessagesTrigger !== prevClearTriggerRef.current
    ) {
      setMessages([]);
      setIsStreaming(false);
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      prevClearTriggerRef.current = clearMessagesTrigger;
    }
  }, [clearMessagesTrigger]);

  // Handle conversation switch - abort any ongoing request and reset streaming state
  const prevExternalConvIdForAbortRef = useRef<number | null | undefined>(
    undefined
  );
  useEffect(() => {
    // Don't abort if:
    // 1. First render (prevExternalConvIdForAbortRef.current is undefined)
    // 2. We're in the middle of creating a new conversation
    // 3. We're switching FROM null TO a new conversation (creation scenario)
    const prevValue = prevExternalConvIdForAbortRef.current;
    prevExternalConvIdForAbortRef.current = externalConvId;

    if (
      prevExternalConvIdForAbortRef.current === undefined ||
      isCreatingConversationRef.current ||
      (prevValue === null && externalConvId !== null)
    ) {
      // Don't abort - it's either first render, or creating new conversation, or just created
      return;
    }

    // Abort if switching to a different existing conversation
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = null;
    setIsStreaming(false);
  }, [externalConvId]);

  // When loadedMessages changes (switching to existing conversation), update messages
  // Only update if loadedMessages has content - otherwise keep sessionStorage messages or empty state
  useEffect(() => {
    if (loadedMessages && loadedMessages.length > 0) {
      const chatMessages: ChatMessage[] = loadedMessages.map((m, i) => ({
        id: `db-${m.id}-${i}`,
        role: m.role as "user" | "assistant",
        content: m.content,
        streaming: false,
      }));
      setMessages(chatMessages);
    }
    // If loadedMessages is empty or undefined, don't clear messages here
    // Let sessionStorage effect or empty state handle it
  }, [loadedMessages]);

  // Check if this skill needs an API key
  const needsApiKey = useMemo(
    () => skillNeedsApiKey(skill.skillMd ?? ""),
    [skill.skillMd]
  );

  // Check if user has already configured an API key for this skill
  const { data: apiKeyStatus } = trpc.interactions.getApiKey.useQuery(
    { skillId: skill.id },
    { enabled: isAuthenticated && needsApiKey }
  );

  // Build history for multi-turn: alternate user/assistant messages
  const buildHistory = (msgs: ChatMessage[]) =>
    msgs.map(m => ({ role: m.role, content: m.content }));

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim();
      if (!text || isStreaming) return;

      if (!isAuthenticated) {
        toast.error("请先登录后再使用技能");
        return;
      }

      // If skill needs API key and user hasn't configured one yet, show dialog
      if (
        needsApiKey &&
        apiKeyStatus &&
        !apiKeyStatus.configured &&
        messages.length === 0
      ) {
        setPendingInput(text);
        setShowApiKeyDialog(true);
        return;
      }

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
      };

      const assistantMsgId = `assistant-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        streaming: true,
      };

      setMessages(prev => [...prev, userMsg, assistantMsg]);
      setInput("");
      setIsStreaming(true);

      // Abort any previous
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      let finalContent = "";
      let currentConvId = conversationId;

      try {
        // Create conversation on first message
        if (!currentConvId) {
          isCreatingConversationRef.current = true;
          try {
            const result = await createConversation.mutateAsync({
              skillId: skill.id,
              firstMessage: text,
            });
            currentConvId = result.conversationId;
            setConversationId(currentConvId);
            isCreatingConversationRef.current = false;
            if (onConversationCreated) {
              onConversationCreated(currentConvId);
            }
            // Optimistically update conversation list cache
            utils.conversations.listBySkill.setData(
              { skillId: skill.id },
              oldData => {
                if (!oldData) return oldData;
                const newConv = {
                  id: result.conversationId,
                  title: text.slice(0, 30) || "新对话",
                  messageCount: 0,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  skillId: skill.id,
                };
                return [newConv, ...oldData];
              }
            );
          } catch {
            // Non-fatal: continue without persistence
          }
        }

        const history = buildHistory([...messages, userMsg]);

        const response = await fetch(`/api/skills/${skill.id}/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inputs: { task: text },
            history,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error ?? `HTTP ${response.status}`);
        }

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;

            const jsonStr = trimmed.slice(5).trim();
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.text !== undefined) {
                finalContent += parsed.text;
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantMsgId
                      ? { ...m, content: finalContent }
                      : m
                  )
                );
              } else if (parsed.message !== undefined) {
                throw new Error(parsed.message);
              }
            } catch (parseErr: any) {
              if (parseErr?.message && !parseErr.message.includes("JSON"))
                throw parseErr;
            }
          }
        }

        // Mark done
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId ? { ...m, streaming: false } : m
          )
        );

        // Persist this round to DB
        if (currentConvId && finalContent) {
          try {
            await saveRound.mutateAsync({
              conversationId: currentConvId,
              userMessage: text,
              assistantMessage: finalContent,
            });
            // Invalidate conversation list cache
            utils.conversations.listBySkill.invalidate({ skillId: skill.id });
          } catch {
            // Non-fatal: UI already shows content
          }
        }
      } catch (err: any) {
        if (err?.name === "AbortError") {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMsgId
                ? { ...m, content: m.content || "（已停止）", streaming: false }
                : m
            )
          );
          return;
        }
        const errorMsg = err?.message ?? "执行失败，请稍后重试";
        toast.error(errorMsg);
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId
              ? { ...m, content: `❌ ${errorMsg}`, streaming: false }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [
      input,
      isStreaming,
      messages,
      skill.id,
      isAuthenticated,
      conversationId,
      externalConvId,
      needsApiKey,
      apiKeyStatus,
      onConversationCreated,
    ]
  );

  const handleApiKeySave = async (key: string) => {
    try {
      await saveApiKey.mutateAsync({ skillId: skill.id, apiKey: key });
      toast.success("API Key 已保存");
      utils.interactions.getApiKey.invalidate({ skillId: skill.id });
    } catch {
      toast.error("保存失败，请重试");
    } finally {
      setShowApiKeyDialog(false);
      // Continue with the pending input
      if (pendingInput) {
        const text = pendingInput;
        setPendingInput(null);
        handleSend(text);
      }
    }
  };

  const handleApiKeySkip = () => {
    setShowApiKeyDialog(false);
    if (pendingInput) {
      const text = pendingInput;
      setPendingInput(null);
      handleSend(text);
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const handleClear = () => {
    if (isStreaming) return;
    setMessages([]);
    setConversationId(null);
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Ignore storage errors
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const placeholder =
    uiConfig?.inputFields?.[0]?.placeholder ??
    `告诉我你想用「${skill.title}」完成什么任务...（Enter 发送，Shift+Enter 换行）`;

  return (
    <>
      <ApiKeyDialog
        open={showApiKeyDialog}
        onClose={handleApiKeySkip}
        onSave={handleApiKeySave}
        skill={skill}
        isSaving={saveApiKey.isPending}
      />
      <div className="bg-white rounded-xl border border-border flex flex-col overflow-hidden h-[560px] max-h-[560px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.length === 0 ? (
            <EmptyChatState
              skill={skill}
              uiConfig={uiConfig}
              theme={theme}
              onSuggest={s => setInput(s)}
            />
          ) : (
            messages.map(msg => (
              <ChatBubble key={msg.id} message={msg} theme={theme} />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="shrink-0 border-t border-border p-3">
          {!isAuthenticated && (
            <div className="mb-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />请
              <a href={getLoginUrl()} className="font-semibold underline">
                登录
              </a>
              后使用技能
            </div>
          )}
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isStreaming || !isAuthenticated}
              className="resize-none text-sm min-h-[40px] max-h-[120px] flex-1"
              rows={1}
            />
            {isStreaming ? (
              <Button
                onClick={handleStop}
                variant="outline"
                size="icon"
                className="shrink-0 border-red-200 text-red-500 hover:bg-red-50"
              >
                <StopCircle className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || !isAuthenticated || isStreaming}
                size="icon"
                className={`shrink-0 bg-gradient-to-br ${theme.gradient} text-white border-0 hover:opacity-90 disabled:opacity-40`}
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
          {/* API Key status indicator */}
          {needsApiKey && apiKeyStatus?.configured && (
            <div className="px-3 pb-1 flex items-center justify-between">
              <span className="text-[10px] text-green-600 flex items-center gap-1">
                <Key className="w-3 h-3" />
                API Key 已配置（{apiKeyStatus.maskedKey}）
              </span>
              <button
                onClick={() => setShowApiKeyDialog(true)}
                className="text-[10px] text-muted-foreground hover:text-foreground underline"
              >
                重新配置
              </button>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center pb-2">
            Enter 发送 · Shift+Enter 换行 · 支持多轮对话
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────

function ChatBubble({
  message,
  theme,
}: {
  message: ChatMessage;
  theme: ReturnType<typeof getTheme>;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="flex items-start gap-2 max-w-[80%]">
          <div className="bg-foreground text-background rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed break-words overflow-hidden max-w-full">
            {message.content}
          </div>
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-2 max-w-[90%]">
        <div
          className={`w-7 h-7 rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center shrink-0 mt-0.5`}
        >
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-muted/40 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed overflow-hidden">
            {message.content ? (
              <div className="prose prose-sm max-w-none text-foreground break-words">
                <Streamdown>{message.content}</Streamdown>
              </div>
            ) : (
              <span className="inline-flex gap-1 items-center text-muted-foreground">
                <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            )}
          </div>
          {!message.streaming && message.content && (
            <button
              onClick={handleCopy}
              className="mt-1 ml-1 text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              {copied ? (
                <CheckCircle2 className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {copied ? "已复制" : "复制"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ──// ─── Empty Chat State ────────────────────────────────────────────────────

function EmptyChatState({
  skill,
  uiConfig,
  theme,
  onSuggest,
}: {
  skill: any;
  uiConfig: SkillUiConfig | null;
  theme: ReturnType<typeof getTheme>;
  onSuggest: (s: string) => void;
}) {
  // Fetch LLM-generated example prompts (cached in uiConfig after first call)
  const { data: examplePrompts, isLoading: loadingPrompts } =
    trpc.skills.getExamplePrompts.useQuery(
      { skillId: skill.id },
      { staleTime: 1000 * 60 * 60 } // Cache for 1 hour
    );

  // Defensive filter: remove any strings containing XSS vectors
  const starters = (examplePrompts ?? []).filter((s): s is string => {
    if (typeof s !== "string" || s.length < 4) return false;
    // Block HTML-like tags
    if (/<[a-zA-Z][\s\S]*>/.test(s)) return false;
    // Block HTML entities (encoded tags)
    if (/&lt;[a-zA-Z][^&]*&gt;/.test(s)) return false;
    // Block javascript: URLs
    if (/javascript:/i.test(s)) return false;
    // Block SVG/XML-based XSS
    if (/<\/?svg/i.test(s)) return false;
    return true;
  });

  return (
    <div className="flex flex-col items-center justify-center h-full py-8 text-center">
      <div
        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-2xl mb-4 shadow-sm`}
      >
        {uiConfig?.icon ?? "🤖"}
      </div>
      <p className="text-sm font-medium text-foreground mb-1">
        {skill.title ?? "开始对话"}
      </p>
      <p className="text-xs text-muted-foreground mb-5 max-w-xs">
        直接描述你的需求，AI 会根据技能说明引导你完成任务
      </p>
      {loadingPrompts ? (
        <div className="flex flex-col gap-2 w-full max-w-sm">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : starters.length > 0 ? (
        <div className="flex flex-col gap-2 w-full max-w-sm">
          <p className="text-[10px] text-muted-foreground mb-1">
            试试这些示例提示词
          </p>
          {starters.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggest(s)}
              title={s}
              className="text-xs text-left px-3 py-2.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/50 hover:border-foreground/20 transition-all text-muted-foreground hover:text-foreground group truncate min-w-0"
            >
              <span className="mr-1.5 opacity-60 group-hover:opacity-100 shrink-0">
                💬
              </span>
              <span className="truncate">{s}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ─── Loading & Not Found ──────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="bg-muted/30 border-b border-border py-6">
        <div className="container flex items-center gap-5">
          <Skeleton className="w-16 h-16 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </div>
        </div>
      </div>
      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-[480px] sm:h-[560px] rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 sm:h-48 rounded-xl" />
            <Skeleton className="h-28 sm:h-32 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-24 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-foreground mb-2">技能不存在</h2>
        <p className="text-muted-foreground mb-6">
          该技能可能已被删除或链接有误
        </p>
        <Button asChild>
          <Link href="/">返回广场</Link>
        </Button>
      </div>
    </div>
  );
}
