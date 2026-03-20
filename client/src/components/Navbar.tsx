import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Search, Plus, Zap, LogOut, BookOpen, Settings } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { Link, useLocation } from "wouter";

interface NavbarProps {
  onSearch?: (query: string) => void;
}

export default function Navbar({ onSearch }: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setLocation(`/explore?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="container">
        <div className="flex items-center h-14 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base text-foreground hidden sm:block">
              Skill 商店
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1 ml-2">
            <NavLink href="/">广场</NavLink>
            {isAuthenticated && <NavLink href="/my-skills">我的技能</NavLink>}
          </nav>

          {/* Search — desktop inline form */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-auto hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="搜索技能..."
                className="pl-9 h-9 bg-muted/50 border-transparent focus:border-border focus:bg-white text-sm"
              />
            </div>
          </form>

          {/* Search — mobile icon button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/explore")}
                className="sm:hidden shrink-0"
                aria-label="搜索技能"
              >
                <Search className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>搜索技能</TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-2 ml-auto">
            {/* Create Skill */}
            {isAuthenticated ? (
              <>
                <Button
                  size="sm"
                  onClick={() => setLocation("/create")}
                  className="gap-1.5 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">创建技能</span>
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full hover:bg-muted/60 p-1 transition-colors">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={(user as any)?.avatarUrl ?? undefined} alt={user?.name ?? "U"} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                          {user?.name?.[0]?.toUpperCase() ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-3 py-2 min-w-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm font-medium truncate">{user?.name ?? "用户"}</p>
                        </TooltipTrigger>
                        <TooltipContent>{user?.name ?? "用户"}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </TooltipTrigger>
                        <TooltipContent>{user?.email}</TooltipContent>
                      </Tooltip>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setLocation("/my-skills")}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      我的技能
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/profile")}>
                      <Settings className="w-4 h-4 mr-2" />
                      用户中心
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      退出登录
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button size="sm" asChild>
                <a href={getLoginUrl()}>登录</a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const [location] = useLocation();
  const isActive = location === href || (href !== "/" && location.startsWith(href));

  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      }`}
    >
      {children}
    </Link>
  );
}
