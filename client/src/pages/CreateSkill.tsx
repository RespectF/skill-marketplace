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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Github,
  Upload,
  FileText,
  Sparkles,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Tag,
} from "lucide-react";
import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

const CATEGORIES = ["创意设计", "开发技术", "企业通信", "文档处理", "工具"] as const;

type FieldErrors = Partial<Record<keyof SkillFormData, string>>;

// ─── Form State ───────────────────────────────────────────────────────────────

interface SkillFormData {
  title: string;
  description: string;
  category: string;
  skillMd: string;
  githubUrl: string;
}

const EMPTY_FORM: SkillFormData = {
  title: "",
  description: "",
  category: "",
  skillMd: "",
  githubUrl: "",
};

// ─── Progress Steps ───────────────────────────────────────────────────────────

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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CreateSkill() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-24 text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">请先登录</h2>
          <p className="text-muted-foreground mb-6">登录后即可创建和分享你的 Skill</p>
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
      {/* Extra bottom padding so content isn't hidden behind fixed footer */}
      <div className="container py-8 max-w-3xl pb-28">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回广场
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-1">创建技能</h1>
          <p className="text-muted-foreground text-sm">
            支持三种方式导入：GitHub 仓库链接、在线填写配置、上传本地文件
          </p>
        </div>

        {/* Import Method Tabs */}
        <Tabs defaultValue="github" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="github" className="gap-1.5 text-sm">
              <Github className="w-4 h-4" />
              GitHub 导入
            </TabsTrigger>
            <TabsTrigger value="form" className="gap-1.5 text-sm">
              <FileText className="w-4 h-4" />
              在线填写
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-1.5 text-sm">
              <Upload className="w-4 h-4" />
              上传文件
            </TabsTrigger>
          </TabsList>

          {/* GitHub Import */}
          <TabsContent value="github">
            <GitHubImportForm key="github" onSuccess={(slug) => setLocation(`/skill/${slug}`)} />
          </TabsContent>

          {/* Manual Form */}
          <TabsContent value="form">
            <ManualForm key="form" onSuccess={(slug) => setLocation(`/skill/${slug}`)} />
          </TabsContent>

          {/* File Upload */}
          <TabsContent value="upload">
            <FileUploadForm key="upload" onSuccess={(slug) => setLocation(`/skill/${slug}`)} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── GitHub Import Form ───────────────────────────────────────────────────────

function GitHubImportForm({ onSuccess }: { onSuccess: (slug: string) => void }) {
  const [githubUrl, setGithubUrl] = useState("");
  const [form, setForm] = useState<Omit<SkillFormData, "githubUrl">>({
    title: "",
    description: "",
    category: "",
    skillMd: "",
  });
  const [parsed, setParsed] = useState(false);
  const [parseStep, setParseStep] = useState<ParseStep>("idle");
  const [parseError, setParseError] = useState("");
  const inferTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parseGitHub = trpc.skills.parseGitHub.useMutation();
  const importMutation = trpc.skills.importFromGitHub.useMutation();

  const handleParse = async () => {
    if (!githubUrl.trim() || parseGitHub.isPending) return;
    // Cancel any pending infer timer from previous request
    if (inferTimerRef.current) {
      clearTimeout(inferTimerRef.current);
      inferTimerRef.current = null;
    }
    setParseError("");
    setParsed(false);
    setParseStep("fetching");
    try {
      // Step 1: fetching (the mutation handles both fetch + LLM inference)
      // We show "fetching" first, then switch to "inferring" after a short delay
      // to give visual feedback of the two-step process
      inferTimerRef.current = setTimeout(() => setParseStep("inferring"), 2000);
      const result = await parseGitHub.mutateAsync({ githubUrl });
      if (inferTimerRef.current) {
        clearTimeout(inferTimerRef.current);
        inferTimerRef.current = null;
      }

      setForm((p) => ({
        ...p,
        skillMd: result.skillMd,
        title: result.name || p.title,
        description: result.description || p.description,
        // Auto-fill category if LLM suggested one
        category: result.suggestedCategory || p.category,
      }));
      setParsed(true);
      setParseStep("done");
      toast.success(
        result.suggestedCategory
          ? `解析成功，已自动推断分类：${result.suggestedCategory}`
          : "成功解析 SKILL.md 文件"
      );
    } catch (e: any) {
      setParseError(e.message ?? "解析失败，请检查仓库链接");
      setParseStep("error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.category || !form.skillMd) {
      toast.error("请填写所有必填字段");
      return;
    }
    try {
      const result = await importMutation.mutateAsync({
        githubUrl,
        title: form.title,
        description: form.description,
        category: form.category,
      });
      toast.success("技能创建成功！");
      if (result?.slug) onSuccess(result.slug);
    } catch (e: any) {
      toast.error(e.message ?? "创建失败");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-medium mb-1.5">📌 支持的链接格式</p>
        <ul className="text-blue-600 leading-relaxed space-y-1">
          <li>✅ 具体 Skill 子目录：<code className="bg-blue-100 px-1 rounded text-xs">https://github.com/anthropics/skills/tree/main/skills/xlsx</code></li>
          <li>✅ 包含 SKILL.md 的仓库根：<code className="bg-blue-100 px-1 rounded text-xs">https://github.com/owner/my-skill-repo</code></li>
          <li>⚠️ 如果仓库包含多个 Skill，建议直接链接到具体 Skill 子目录</li>
        </ul>
      </div>

      {/* GitHub URL */}
      <div>
        <Label className="text-sm font-medium mb-1.5 block">
          GitHub 仓库链接 <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="https://github.com/anthropics/skills/tree/main/skills/xlsx"
            value={githubUrl}
            onChange={(e) => { setGithubUrl(e.target.value); setParseStep("idle"); }}
            className="flex-1 text-sm"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleParse}
            disabled={parseGitHub.isPending || !githubUrl.trim()}
            className="shrink-0"
          >
            {parseGitHub.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "解析"
            )}
          </Button>
        </div>
      </div>

      {/* Progress indicator */}
      <ParseProgress step={parseStep} error={parseError} />

      {/* Common Fields — shown after parse */}
      {(parsed || parseStep === "error") && (
        <CommonFields form={form} setForm={setForm} />
      )}

      {/* SKILL.md Preview */}
      {form.skillMd && (
        <div>
          <Label className="text-sm font-medium mb-1.5 block">SKILL.md 内容预览</Label>
          <Textarea
            value={form.skillMd}
            onChange={(e) => setForm((p) => ({ ...p, skillMd: e.target.value }))}
            className="min-h-[200px] font-mono text-xs"
          />
        </div>
      )}

      <FixedSubmitButton
        isLoading={importMutation.isPending}
        disabled={!parsed || !form.title || !form.category}
        label="导入并创建技能"
      />
    </form>
  );
}

// ─── Manual Form ──────────────────────────────────────────────────────────────

function ManualForm({ onSuccess }: { onSuccess: (slug: string) => void }) {
  const [form, setForm] = useState<SkillFormData>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const createMutation = trpc.skills.create.useMutation();

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
    try {
      const result = await createMutation.mutateAsync({
        title: form.title,
        description: form.description,
        category: form.category,
        skillMd: form.skillMd,
        githubUrl: form.githubUrl || undefined,
      });
      toast.success("技能创建成功！AI 正在生成个性化界面...");
      if (result?.slug) onSuccess(result.slug);
    } catch (e: any) {
      toast.error(e.message ?? "创建失败");
    }
  };

  const SKILL_MD_TEMPLATE = `---
name: my-skill-name
description: A clear description of what this skill does and when to use it
---

# My Skill Name

[Add your instructions here that Claude will follow when this skill is active]

## Examples
- Example usage 1
- Example usage 2

## Guidelines
- Guideline 1
- Guideline 2`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <CommonFields form={form} setForm={setForm} fieldErrors={fieldErrors} />

      {/* SKILL.md Content */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label className="text-sm font-medium">
            SKILL.md 内容 <span className="text-destructive">*</span>
          </Label>
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, skillMd: SKILL_MD_TEMPLATE }))}
            className="text-xs text-primary hover:underline"
          >
            使用模板
          </button>
        </div>
        <Textarea
          placeholder={SKILL_MD_TEMPLATE}
          value={form.skillMd}
          onChange={(e) => setForm((p) => ({ ...p, skillMd: e.target.value }))}
          className={`min-h-[240px] font-mono text-xs ${fieldErrors?.skillMd ? "border-destructive" : ""}`}
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

      {/* GitHub URL (optional) */}
      <div>
        <Label className="text-sm font-medium mb-1.5 block">GitHub 链接（可选）</Label>
        <Input
          placeholder="https://github.com/your/repo"
          value={form.githubUrl}
          onChange={(e) => setForm((p) => ({ ...p, githubUrl: e.target.value }))}
          className="text-sm"
          maxLength={300}
        />
      </div>

      <FixedSubmitButton
        isLoading={createMutation.isPending}
        disabled={!form.title || !form.category || !form.skillMd}
        label="创建技能"
      />
    </form>
  );
}

// ─── File Upload Form ─────────────────────────────────────────────────────────

function FileUploadForm({ onSuccess }: { onSuccess: (slug: string) => void }) {
  const [form, setForm] = useState<SkillFormData>(EMPTY_FORM);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createMutation = trpc.skills.create.useMutation();

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".md")) {
      toast.error("请上传 .md 格式的文件");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setForm((p) => ({ ...p, skillMd: content }));

      // Auto-parse name and description from frontmatter
      const nameMatch = content.match(/^name:\s*(.+)$/m);
      const descMatch = content.match(/^description:\s*([\s\S]+?)(?=\n\w|---|\n#|$)/m);
      if (nameMatch?.[1]) {
        setForm((p) => ({
          ...p,
          skillMd: content,
          title: p.title || nameMatch[1].trim(),
          description: p.description || (descMatch?.[1]?.trim().replace(/\n/g, " ") ?? ""),
        }));
      }
      toast.success(`已加载 ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.category || !form.skillMd) {
      toast.error("请填写所有必填字段");
      return;
    }
    try {
      const result = await createMutation.mutateAsync({
        title: form.title,
        description: form.description,
        category: form.category,
        skillMd: form.skillMd,
      });
      toast.success("技能创建成功！AI 正在生成个性化界面...");
      if (result?.slug) onSuccess(result.slug);
    } catch (e: any) {
      toast.error(e.message ?? "创建失败");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-primary bg-primary/5"
            : fileName
            ? "border-green-400 bg-green-50"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".md"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {fileName ? (
          <div className="space-y-2">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
            <p className="font-medium text-foreground">{fileName}</p>
            <p className="text-xs text-muted-foreground">点击重新选择文件</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="font-medium text-foreground">拖拽或点击上传 SKILL.md</p>
            <p className="text-xs text-muted-foreground">支持 .md 格式文件</p>
          </div>
        )}
      </div>

      {/* Common Fields */}
      <CommonFields form={form} setForm={setForm} />

      {/* Preview */}
      {form.skillMd && (
        <div>
          <Label className="text-sm font-medium mb-1.5 block">文件内容预览</Label>
          <Textarea
            value={form.skillMd}
            onChange={(e) => setForm((p) => ({ ...p, skillMd: e.target.value }))}
            className="min-h-[160px] font-mono text-xs"
          />
        </div>
      )}

      <FixedSubmitButton
        isLoading={createMutation.isPending}
        disabled={!form.skillMd || !form.title || !form.category}
        label="上传并创建技能"
      />
    </form>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────

function CommonFields({
  form,
  setForm,
  fieldErrors,
}: {
  form: Omit<SkillFormData, "skillMd" | "githubUrl"> & Partial<SkillFormData>;
  setForm: (fn: (p: any) => any) => void;
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
          onChange={(e) => setForm((p: any) => ({ ...p, title: e.target.value }))}
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
          onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))}
          className={`min-h-[80px] resize-none text-sm ${fieldErrors?.description ? "border-destructive aria-invalid:bg-destructive/5" : ""}`}
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
          onValueChange={(v) => setForm((p: any) => ({ ...p, category: v }))}
        >
          <SelectTrigger className={`text-sm ${fieldErrors?.category ? "border-destructive" : ""}`} aria-invalid={!!fieldErrors?.category}>
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

/** Fixed bottom submit button — stays visible while scrolling */
function FixedSubmitButton({
  isLoading,
  disabled,
  label,
}: {
  isLoading: boolean;
  disabled: boolean;
  label: string;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-border">
      <div className="container max-w-3xl py-4 flex items-center gap-4">
        <Button
          type="submit"
          disabled={isLoading || disabled}
          className="flex-1 gap-2"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              AI 正在生成个性化界面...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {label}
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground hidden sm:block shrink-0">
          AI 将自动分析 SKILL.md<br />并生成个性化可视化界面
        </p>
      </div>
    </div>
  );
}
