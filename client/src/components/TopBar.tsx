import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useState, useEffect } from "react";

export default function TopBar() {
  const [location] = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getPageInfo = (path: string) => {
    const pages = {
      "/": { title: "实时监控仪表盘", subtitle: "Network Traffic Monitoring Dashboard" },
      "/devices": { title: "网络设备管理", subtitle: "Network Device Management" },
      "/alerts": { title: "告警管理", subtitle: "Alert Management System" },
      "/traffic": { title: "流量分析", subtitle: "Traffic Analysis" },
      "/rules": { title: "检测规则", subtitle: "Detection Rules Configuration" },
      "/logs": { title: "日志审计", subtitle: "Log Management & Audit" },
      "/users": { title: "用户管理", subtitle: "User Management System" },
      "/settings": { title: "系统配置", subtitle: "System Configuration" },
    };
    return pages[path as keyof typeof pages] || { title: "未知页面", subtitle: "Unknown Page" };
  };

  const pageInfo = getPageInfo(location);

  return (
    <header className="bg-card border-b border-border px-6 py-4 h-16">
      <div className="flex items-center justify-between h-full">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{pageInfo.title}</h2>
          <p className="text-muted-foreground mt-1 text-sm">{pageInfo.subtitle}</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">系统状态:</span>
            <div className="flex items-center text-accent">
              <div className="w-2 h-2 bg-accent rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm">运行正常</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
            </Button>

            <div className="text-sm text-muted-foreground">
              {currentTime.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
