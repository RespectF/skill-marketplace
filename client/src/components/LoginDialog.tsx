import { GitHubIcon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getLoginUrl } from "@/const";
import { Zap } from "lucide-react";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>登录</DialogTitle>
          <DialogDescription>登录到 Skill 商店</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 p-6">
          {/* Logo */}
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
            <Zap className="w-7 h-7 text-white" />
          </div>

          {/* Title */}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-semibold text-foreground">
              登录到 Skill 商店
            </h2>
            <p className="text-sm text-muted-foreground">
              通过 GitHub 账号安全登录
            </p>
          </div>

          {/* Description */}
          <div className="bg-muted/50 rounded-xl p-4 text-left w-full">
            <p className="text-sm text-muted-foreground leading-relaxed">
              点击下方按钮，你将被重定向到 GitHub 进行授权。授权成功后，即可创建和分享你的技能。
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 w-full text-left">
            <FeatureItem title="安全便捷" description="使用 GitHub 账号一键登录" />
            <FeatureItem title="创建技能" description="发布和管理你的作品" />
            <FeatureItem title="收藏管理" description="保存你喜欢的技能" />
            <FeatureItem title="社区互动" description="与开发者交流分享" />
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-muted/30">
          <Button onClick={handleLogin} className="w-full gap-2" size="lg">
            <GitHubIcon className="w-5 h-5" />
            使用 GitHub 登录
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FeatureItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-sm font-medium text-foreground leading-none">{title}</p>
      <p className="text-xs text-muted-foreground leading-tight">{description}</p>
    </div>
  );
}
