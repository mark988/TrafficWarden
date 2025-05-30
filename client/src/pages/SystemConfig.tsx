import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, Database, Mail, Shield, Bell, Save, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function SystemConfig() {
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: systemConfig, isLoading } = useQuery({
    queryKey: ["/api/system-config"],
  });

  const updateConfigMutation = useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: any; description?: string }) => {
      return apiRequest("PUT", `/api/system-config/${key}`, { value, description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-config"] });
      toast({
        title: "配置更新成功",
        description: "系统配置已成功更新",
      });
    },
    onError: (error) => {
      toast({
        title: "更新失败",
        description: error.message || "更新系统配置时发生错误",
        variant: "destructive",
      });
    },
  });

  const getConfigValue = (key: string, defaultValue: any = "") => {
    const config = systemConfig?.find((c: any) => c.key === key);
    return config?.value || defaultValue;
  };

  const updateConfig = (key: string, value: any, description?: string) => {
    updateConfigMutation.mutate({ key, value, description });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Check if current user has admin privileges
  if (user?.role !== "admin") {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                访问受限
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                您没有权限访问系统配置功能。只有系统管理员可以修改系统配置。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Settings className="w-6 h-6 mr-2" />
              系统配置
            </CardTitle>
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
              系统运行正常
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">通用设置</TabsTrigger>
              <TabsTrigger value="database">数据库</TabsTrigger>
              <TabsTrigger value="notifications">通知</TabsTrigger>
              <TabsTrigger value="security">安全</TabsTrigger>
              <TabsTrigger value="monitoring">监控</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">基本配置</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="system-name">系统名称</Label>
                    <Input
                      id="system-name"
                      defaultValue={getConfigValue("system.name", "异常流量监控系统")}
                      onBlur={(e) => updateConfig("system.name", e.target.value, "系统显示名称")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="system-version">系统版本</Label>
                    <Input
                      id="system-version"
                      defaultValue={getConfigValue("system.version", "v2.1.0")}
                      onBlur={(e) => updateConfig("system.version", e.target.value, "系统版本号")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">会话超时 (分钟)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      defaultValue={getConfigValue("session.timeout", 30)}
                      onBlur={(e) => updateConfig("session.timeout", parseInt(e.target.value), "用户会话超时时间")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="log-retention">日志保留天数</Label>
                    <Input
                      id="log-retention"
                      type="number"
                      defaultValue={getConfigValue("log.retention", 365)}
                      onBlur={(e) => updateConfig("log.retention", parseInt(e.target.value), "审计日志保留天数")}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-md font-medium">系统功能开关</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>自动备份</Label>
                        <p className="text-sm text-muted-foreground">每日自动备份系统数据</p>
                      </div>
                      <Switch
                        defaultChecked={getConfigValue("backup.enabled", true)}
                        onCheckedChange={(checked) => updateConfig("backup.enabled", checked, "是否启用自动备份")}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>邮件通知</Label>
                        <p className="text-sm text-muted-foreground">启用邮件告警通知</p>
                      </div>
                      <Switch
                        defaultChecked={getConfigValue("notification.email.enabled", true)}
                        onCheckedChange={(checked) => updateConfig("notification.email.enabled", checked, "是否启用邮件通知")}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>API访问</Label>
                        <p className="text-sm text-muted-foreground">允许外部API访问</p>
                      </div>
                      <Switch
                        defaultChecked={getConfigValue("api.enabled", true)}
                        onCheckedChange={(checked) => updateConfig("api.enabled", checked, "是否启用API访问")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="database" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Database className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">数据库配置</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="db-backup-interval">备份间隔 (小时)</Label>
                    <Input
                      id="db-backup-interval"
                      type="number"
                      defaultValue={getConfigValue("database.backup.interval", 24)}
                      onBlur={(e) => updateConfig("database.backup.interval", parseInt(e.target.value), "数据库备份间隔")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="db-retention">数据保留天数</Label>
                    <Input
                      id="db-retention"
                      type="number"
                      defaultValue={getConfigValue("database.retention", 90)}
                      onBlur={(e) => updateConfig("database.retention", parseInt(e.target.value), "流量数据保留天数")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="db-max-connections">最大连接数</Label>
                    <Input
                      id="db-max-connections"
                      type="number"
                      defaultValue={getConfigValue("database.max_connections", 100)}
                      onBlur={(e) => updateConfig("database.max_connections", parseInt(e.target.value), "数据库最大连接数")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="db-query-timeout">查询超时 (秒)</Label>
                    <Input
                      id="db-query-timeout"
                      type="number"
                      defaultValue={getConfigValue("database.query_timeout", 30)}
                      onBlur={(e) => updateConfig("database.query_timeout", parseInt(e.target.value), "数据库查询超时时间")}
                    />
                  </div>
                </div>

                <Separator />

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">数据库状态</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700 dark:text-blue-300">连接状态</p>
                      <p className="font-medium text-green-600 dark:text-green-400">正常</p>
                    </div>
                    <div>
                      <p className="text-blue-700 dark:text-blue-300">活跃连接</p>
                      <p className="font-medium">12/100</p>
                    </div>
                    <div>
                      <p className="text-blue-700 dark:text-blue-300">数据库大小</p>
                      <p className="font-medium">2.4 GB</p>
                    </div>
                    <div>
                      <p className="text-blue-700 dark:text-blue-300">最后备份</p>
                      <p className="font-medium">2小时前</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">通知配置</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-server">SMTP服务器</Label>
                    <Input
                      id="smtp-server"
                      defaultValue={getConfigValue("smtp.server", "smtp.example.com")}
                      onBlur={(e) => updateConfig("smtp.server", e.target.value, "SMTP服务器地址")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">SMTP端口</Label>
                    <Input
                      id="smtp-port"
                      type="number"
                      defaultValue={getConfigValue("smtp.port", 587)}
                      onBlur={(e) => updateConfig("smtp.port", parseInt(e.target.value), "SMTP服务器端口")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="smtp-username">SMTP用户名</Label>
                    <Input
                      id="smtp-username"
                      defaultValue={getConfigValue("smtp.username", "")}
                      onBlur={(e) => updateConfig("smtp.username", e.target.value, "SMTP认证用户名")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="smtp-from">发件人地址</Label>
                    <Input
                      id="smtp-from"
                      type="email"
                      defaultValue={getConfigValue("smtp.from", "noreply@system.com")}
                      onBlur={(e) => updateConfig("smtp.from", e.target.value, "邮件发件人地址")}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-md font-medium">通知规则</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>高危告警通知</Label>
                        <p className="text-sm text-muted-foreground">立即发送高危级别告警</p>
                      </div>
                      <Switch
                        defaultChecked={getConfigValue("notification.high_priority", true)}
                        onCheckedChange={(checked) => updateConfig("notification.high_priority", checked, "是否发送高危告警通知")}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>每日报告</Label>
                        <p className="text-sm text-muted-foreground">每日发送系统状态报告</p>
                      </div>
                      <Switch
                        defaultChecked={getConfigValue("notification.daily_report", true)}
                        onCheckedChange={(checked) => updateConfig("notification.daily_report", checked, "是否发送每日报告")}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>系统维护通知</Label>
                        <p className="text-sm text-muted-foreground">系统维护时发送通知</p>
                      </div>
                      <Switch
                        defaultChecked={getConfigValue("notification.maintenance", true)}
                        onCheckedChange={(checked) => updateConfig("notification.maintenance", checked, "是否发送维护通知")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">安全配置</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-attempts">最大登录尝试次数</Label>
                    <Input
                      id="login-attempts"
                      type="number"
                      defaultValue={getConfigValue("security.max_login_attempts", 5)}
                      onBlur={(e) => updateConfig("security.max_login_attempts", parseInt(e.target.value), "最大登录尝试次数")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lockout-duration">账户锁定时间 (分钟)</Label>
                    <Input
                      id="lockout-duration"
                      type="number"
                      defaultValue={getConfigValue("security.lockout_duration", 30)}
                      onBlur={(e) => updateConfig("security.lockout_duration", parseInt(e.target.value), "账户锁定持续时间")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password-min-length">密码最小长度</Label>
                    <Input
                      id="password-min-length"
                      type="number"
                      defaultValue={getConfigValue("security.password_min_length", 8)}
                      onBlur={(e) => updateConfig("security.password_min_length", parseInt(e.target.value), "密码最小长度要求")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="api-rate-limit">API访问限制 (次/分钟)</Label>
                    <Input
                      id="api-rate-limit"
                      type="number"
                      defaultValue={getConfigValue("security.api_rate_limit", 100)}
                      onBlur={(e) => updateConfig("security.api_rate_limit", parseInt(e.target.value), "API访问频率限制")}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-md font-medium">安全功能</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>强制HTTPS</Label>
                        <p className="text-sm text-muted-foreground">要求所有连接使用HTTPS</p>
                      </div>
                      <Switch
                        defaultChecked={getConfigValue("security.force_https", true)}
                        onCheckedChange={(checked) => updateConfig("security.force_https", checked, "是否强制使用HTTPS")}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>IP白名单</Label>
                        <p className="text-sm text-muted-foreground">启用IP地址白名单验证</p>
                      </div>
                      <Switch
                        defaultChecked={getConfigValue("security.ip_whitelist", false)}
                        onCheckedChange={(checked) => updateConfig("security.ip_whitelist", checked, "是否启用IP白名单")}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>双因素认证</Label>
                        <p className="text-sm text-muted-foreground">要求用户启用2FA</p>
                      </div>
                      <Switch
                        defaultChecked={getConfigValue("security.require_2fa", false)}
                        onCheckedChange={(checked) => updateConfig("security.require_2fa", checked, "是否要求双因素认证")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <RefreshCw className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">监控配置</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="collection-interval">数据采集间隔 (秒)</Label>
                    <Input
                      id="collection-interval"
                      type="number"
                      defaultValue={getConfigValue("monitoring.collection_interval", 60)}
                      onBlur={(e) => updateConfig("monitoring.collection_interval", parseInt(e.target.value), "流量数据采集间隔")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="alert-threshold">告警阈值 (%)</Label>
                    <Input
                      id="alert-threshold"
                      type="number"
                      defaultValue={getConfigValue("monitoring.alert_threshold", 80)}
                      onBlur={(e) => updateConfig("monitoring.alert_threshold", parseInt(e.target.value), "带宽使用告警阈值")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="anomaly-sensitivity">异常检测敏感度</Label>
                    <Input
                      id="anomaly-sensitivity"
                      type="number"
                      min="1"
                      max="10"
                      defaultValue={getConfigValue("monitoring.anomaly_sensitivity", 7)}
                      onBlur={(e) => updateConfig("monitoring.anomaly_sensitivity", parseInt(e.target.value), "异常检测敏感度等级")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max-devices">最大监控设备数</Label>
                    <Input
                      id="max-devices"
                      type="number"
                      defaultValue={getConfigValue("monitoring.max_devices", 1000)}
                      onBlur={(e) => updateConfig("monitoring.max_devices", parseInt(e.target.value), "最大监控设备数量")}
                    />
                  </div>
                </div>

                <Separator />

                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">监控状态</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-green-700 dark:text-green-300">采集状态</p>
                      <p className="font-medium text-green-600 dark:text-green-400">正常</p>
                    </div>
                    <div>
                      <p className="text-green-700 dark:text-green-300">在线设备</p>
                      <p className="font-medium">156/1000</p>
                    </div>
                    <div>
                      <p className="text-green-700 dark:text-green-300">数据处理率</p>
                      <p className="font-medium">99.8%</p>
                    </div>
                    <div>
                      <p className="text-green-700 dark:text-green-300">告警规则</p>
                      <p className="font-medium">23个活跃</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
