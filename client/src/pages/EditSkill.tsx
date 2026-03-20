import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useRef } from "react";
import { Link, useLocation, useRoute } from "wouter";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

const CATEGORIES = ["创意设计", "开发技术", "企业通信", "文档处理", "工具"] as const;

type FieldErrors = Partial<Record<keyof SkillFormData, string>>;

interface SkillFormData {
  title: string;
  description: string;
  category: string;
  skillMd: string;
  githubUrl: string;
}

type ParseStep = "idle" | "fetching" | "inferring" | "done" | "error";

const STEP_LABELS: Record<ParseStep, string> = {
  idle: "",
  fetching: "正在获取 SKILL.md...",
  inferring: "AI 正在推断分类...",
  done: "解析完成",
  error: "解析失败",
};

function ParseProgress({ step, error }: { step: ParseStep; error: string }) {
  if (step === "idle") return null;

  const steps: Array<{ key: ParseStep; label: string }> = [
    { key: "fetching", label: "获取 SKILL.md" },
    { key: "inferring", label: "AI 推断分类" },
    { key: "done", label: "完成" },
  ];

  const stepIndex = steps.findIndex((s) => s.key === step);
  const doneIndex = step === "done" ? steps.length : stepIndex;

  if (step === "error") {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{error || "解析失败，请检查仓库链接"}</span>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
      <div className="flex items-center gap-3 mb-2">
        {step !== "done" && <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />}
        {step === "done" && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
        <span className="text-sm font-medium text-blue-800">{STEP_LABELS[step]}</span>
      </div>
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 text-xs ${
              i < doneIndex
                ? "text-green-700"
                : i === stepIndex
                ? "text-blue-700 font-medium"
                : "text-blue-300"
            }`}>
              {i < doneIndex ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <div className={`w-3 h-3 rounded-full border ${
                  i === stepIndex ? "border-blue-600 bg-blue-600" : "border-blue-300"
                }`} />
              )}
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-4 h-px ${i < doneIndex ? "bg-green-400" : "bg-blue-200"}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function EditSkill() {
  const [routeMatch, routeParams] = useRoute("/edit/:id");
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();

  const id = routeParams?.id ? Number(routeParams.id) : NaN;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-24 text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">请先登录</h2>
          <p className="text-muted-foreground mb-6">登录后即可编辑你的 Skill</p>
          <Button asChild>
            <a href={getLoginUrl()}>立即登录</a>
          </Button>
        </div>
      </div>
    );
  }

  if (!routeMatch || Number.isNaN(id)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-24 text-center">
          <div className="text-5xl mb-4">404</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Skill 不存在</h2>
          <p className="text-muted-foreground mb-6">该技能可能已被删除</p>
          <Button onClick={() => setLocation("/my-skills")}>返回我的技能</Button>
        </div>
      </div>
    );
  }

  return <EditSkillContent id={id} user={user} setLocation={setLocation} />;
}

function EditSkillContent({
  id,
  user,
  setLocation,
}: {
  id: number;
  user: { id: number; role: string } | null;
  setLocation: (path: string) => void;
}) {
  const { data: skill, isLoading, error } = trpc.skills.getById.useQuery({ id });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-muted-foreground mt-3 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-24 text-center">
          <div className="text-5xl mb-4">404</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Skill 不存在</h2>
          <p className="text-muted-foreground mb-6">该技能可能已被删除</p>
          <Button onClick={() => setLocation("/my-skills")}>返回我的技能</Button>
        </div>
      </div>
    );
  }

  if (user && skill.authorId !== user.id && user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-24 text-center">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">无权访问</h2>
          <p className="text-muted-foreground mb-6">只有作者或管理员可以编辑此技能</p>
          <Button onClick={() => setLocation("/my-skills")}>返回我的技能</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 max-w-3xl pb-28">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/my-skills"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回我的技能
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-1">编辑技能</h1>
          <p className="text-muted-foreground text-sm">
            修改技能信息后，AI 将自动重新生成个性化界面
          </p>
        </div>

        <EditForm skill={skill} setLocation={setLocation} />
      </div>
    </div>
  );
}

// ─── Edit Form ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EditForm({ skill, setLocation }: { skill: any; setLocation: (path: string) => void }) {
  const originalSkillMd = skill.skillMd ?? "";
  const [skillMdChanged, setSkillMdChanged] = useState(false);
  const [form, setForm] = useState<SkillFormData>({
    title: skill.title,
    description: skill.description,
    category: skill.category,
    skillMd: originalSkillMd,
    githubUrl: skill.githubUrl ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [parseStep, setParseStep] = useState<ParseStep>("idle");
  const [parseError, setParseError] = useState("");
  const inferTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parseGitHub = trpc.skills.parseGitHub.useMutation();
  const updateMutation = trpc.skills.update.useMutation({
    onSuccess: (updated) => {
      toast.success("技能更新成功！");
      if (updated?.slug) setLocation(`/skill/${updated.slug}`);
    },
    onError: (e) => {
      toast.error(e.message ?? "更新失败");
    },
  });

  const handleParse = async () => {
    if (!form.githubUrl.trim() || parseGitHub.isPending) return;
    if (inferTimerRef.current) clearTimeout(inferTimerRef.current);
    setParseError("");
    setParseStep("fetching");
    try {
      const timer = setTimeout(() => setParseStep("inferring"), 2000);
      inferTimerRef.current = timer;
      const result = await parseGitHub.mutateAsync({ githubUrl: form.githubUrl });
      clearTimeout(timer);
      inferTimerRef.current = null;
      setForm((p) => ({
        ...p,
        skillMd: result.skillMd,
        title: result.name || p.title,
        description: result.description || p.description,
        category: result.suggestedCategory || p.category,
      }));
      setParseStep("done");
      toast.success(
        result.suggestedCategory
          ? `解析成功，已自动推断分类：${result.suggestedCategory}`
          : "成功解析 SKILL.md"
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "解析失败，请检查仓库链接";
      setParseError(msg);
      setParseStep("error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: FieldErrors = {};
    if (!form.title) errors.title = "请输入技能名称";
    if (!form.description) errors.description = "请输入技能描述";
    if (!form.category) errors.category = "请选择技能分类";
    if (!form.skillMd) errors.skillMd = "请填写 SKILL.md 内容";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    const changed = form.skillMd !== originalSkillMd;
    setSkillMdChanged(changed);
    updateMutation.mutate({
      id: skill.id,
      title: form.title,
      description: form.description,
      category: form.category as typeof CATEGORIES[number],
      skillMd: form.skillMd,
      githubUrl: form.githubUrl || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* GitHub URL (optional — for re-parsing) */}
      <div>
        <Label className="text-sm font-medium mb-1.5 block">
          GitHub 仓库链接（可选，修改后将重新解析）
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="https://github.com/owner/repo"
            value={form.githubUrl}
            onChange={(e) => {
              setForm((p) => ({ ...p, githubUrl: e.target.value }));
              setParseStep("idle");
            }}
            className="flex-1 text-sm"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleParse}
            disabled={parseGitHub.isPending || !form.githubUrl.trim()}
            className="shrink-0"
          >
            {parseGitHub.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "重新解析"
            )}
          </Button>
        </div>
      </div>

      {/* Progress indicator */}
      <ParseProgress step={parseStep} error={parseError} />

      {/* Common Fields */}
      <EditCommonFields form={form} setForm={setForm} fieldErrors={fieldErrors} />

      {/* SKILL.md Content */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label className="text-sm font-medium">
            SKILL.md 内容 <span className="text-destructive">*</span>
          </Label>
          <button
            type="button"
            onClick={() =>
              setForm((p) => ({
                ...p,
                skillMd: `---
name: ${p.title.toLowerCase().replace(/\s+/g, "-")}
description: ${p.description}
---

# ${p.title}

[Add your instructions here]

## Examples
- Example 1
- Example 2`,
              }))
            }
            className="text-xs text-primary hover:underline"
          >
            使用模板
          </button>
        </div>
        <Textarea
          value={form.skillMd}
          onChange={(e) => setForm((p) => ({ ...p, skillMd: e.target.value }))}
          className={`min-h-[240px] font-mono text-xs ${
            fieldErrors?.skillMd ? "border-destructive aria-invalid:bg-destructive/5" : ""
          }`}
          aria-invalid={!!fieldErrors?.skillMd}
        />
        {fieldErrors?.skillMd ? (
          <p className="text-xs text-destructive mt-1">{fieldErrors.skillMd}</p>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">
            遵循 YAML frontmatter 格式，包含 name 和 description 字段
          </p>
        )}
      </div>

      {/* Fixed Submit */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-border">
        <div className="container max-w-3xl py-4 flex items-center gap-4">
          <Button
            type="submit"
            disabled={updateMutation.isPending || !form.title || !form.category || !form.skillMd}
            className="flex-1 gap-2"
            size="lg"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {skillMdChanged ? "AI 正在更新界面..." : "保存中..."}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                保存修改
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground hidden sm:block shrink-0">
            {skillMdChanged ? "AI 将重新生成界面" : "直接更新字段"}
          </p>
        </div>
      </div>
    </form>
  );
}

// ─── Shared Edit Fields ──────────────────────────────────────────────────────

function EditCommonFields({
  form,
  setForm,
  fieldErrors,
}: {
  form: SkillFormData;
  setForm: (fn: (p: SkillFormData) => SkillFormData) => void;
  fieldErrors?: FieldErrors;
}) {
  return (
    <>
      <div>
        <Label className="text-sm font-medium mb-1.5 block">
          技能名称 <span className="text-destructive">*</span>
        </Label>
        <Input
          placeholder="例如：AI 代码审查助手"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          className={`text-sm ${fieldErrors?.title ? "border-destructive aria-invalid:bg-destructive/5" : ""}`}
          maxLength={128}
          aria-invalid={!!fieldErrors?.title}
        />
        {fieldErrors?.title && (
          <p className="text-xs text-destructive mt-1">{fieldErrors.title}</p>
        )}
      </div>

      <div>
        <Label className="text-sm font-medium mb-1.5 block">
          技能描述 <span className="text-destructive">*</span>
        </Label>
        <Textarea
          placeholder="简要描述这个技能的功能和使用场景..."
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          className={`min-h-[80px] resize-none text-sm ${
            fieldErrors?.description ? "border-destructive aria-invalid:bg-destructive/5" : ""
          }`}
          aria-invalid={!!fieldErrors?.description}
          maxLength={500}
        />
        {fieldErrors?.description && (
          <p className="text-xs text-destructive mt-1">{fieldErrors.description}</p>
        )}
      </div>

      <div>
        <Label className="text-sm font-medium mb-1.5 block">
          技能分类 <span className="text-destructive">*</span>
        </Label>
        <Select
          value={form.category}
          onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
        >
          <SelectTrigger
            className={`text-sm ${fieldErrors?.category ? "border-destructive" : ""}`}
            aria-invalid={!!fieldErrors?.category}
          >
            <SelectValue placeholder="选择分类" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors?.category && (
          <p className="text-xs text-destructive mt-1">{fieldErrors.category}</p>
        )}
      </div>
    </>
  );
}
