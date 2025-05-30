import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  BarChart3,
  Network,
  AlertTriangle,
  TrendingUp,
  Settings,
  FileText,
  Users,
  LogOut,
} from "lucide-react";

const navigation = [
  { name: "仪表盘", href: "/", icon: BarChart3 },
  { name: "设备管理", href: "/devices", icon: Network },
  { name: "告警管理", href: "/alerts", icon: AlertTriangle, badge: 12 },
  { name: "流量分析", href: "/traffic", icon: TrendingUp },
  { name: "检测规则", href: "/rules", icon: Settings },
  { name: "日志审计", href: "/logs", icon: FileText },
  { name: "用户管理", href: "/users", icon: Users },
  { name: "系统配置", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = () => {
    if (user?.firstName || user?.lastName) {
      return `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    }
    return user?.email || "用户";
  };

  const getRoleName = (role: string) => {
    const roleNames = {
      admin: "系统管理员",
      operator: "运维人员",
      readonly: "只读用户",
    };
    return roleNames[role as keyof typeof roleNames] || "用户";
  };

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center px-6 py-4 border-b border-sidebar-border">
          <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div className="ml-3">
            <h1 className="text-sidebar-foreground font-semibold text-lg">流量监控</h1>
            <p className="text-sidebar-foreground/70 text-sm">TADS v2.1</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={`nav-item ${
                    isActive 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="ml-3">{item.name}</span>
                  {item.badge && (
                    <Badge 
                      variant="destructive" 
                      className="ml-auto text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="flex items-center">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.profileImageUrl} alt={getUserDisplayName()} />
              <AvatarFallback className="text-sm bg-sidebar-accent text-sidebar-accent-foreground">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3 flex-1">
              <p className="text-sidebar-foreground font-medium text-sm">
                {getUserDisplayName()}
              </p>
              <p className="text-sidebar-foreground/70 text-xs">
                {getRoleName(user?.role || "readonly")}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
