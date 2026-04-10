import { GitHubIcon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
      <DialogContent className="p-0 gap-0 overflow-hidden border-0 bg-transparent shadow-2xl max-w-sm">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 px-8 pt-10 pb-6 text-center">
            {/* Logo */}
            <div className="w-14 h-14 rounded-2xl bg-primary mx-auto mb-4 flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="w-7 h-7 text-white" />
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              登录 Skill 商店
            </h2>
            <p className="text-sm text-gray-500">
              使用 GitHub 账号快速登录
            </p>
          </div>

          {/* Content */}
          <div className="px-8 py-6">
            <Button
              onClick={handleLogin}
              className="w-full h-12 gap-3 text-base font-medium bg-[#24292e] hover:bg-[#1b1f23] text-white rounded-xl transition-colors"
            >
              <GitHubIcon className="w-5 h-5" />
              继续使用 GitHub
            </Button>

            <p className="text-xs text-gray-400 text-center mt-4">
              登录即表示你同意我们的服务条款和隐私政策
            </p>
          </div>
        </div>

        {/* Decorative background blur */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent blur-3xl opacity-50" />
      </DialogContent>
    </Dialog>
  );
}
