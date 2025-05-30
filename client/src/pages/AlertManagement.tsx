import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Search, Eye, Check, X, Plus, Download, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AlertManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { toast } = useToast();

  const { data: alertStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/alerts/stats"],
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["/api/alerts", { 
      page: currentPage, 
      limit: 50, 
      severity: severityFilter === "all" ? undefined : severityFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
      search: searchTerm || undefined 
    }],
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PUT", `/api/alerts/${id}/resolve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/stats"] });
      toast({
        title: "告警已处理",
        description: "告警状态已更新为已处理",
      });
    },
    onError: (error) => {
      toast({
        title: "处理失败",
        description: error.message || "处理告警时发生错误",
        variant: "destructive",
      });
    },
  });

  const dismissAlertMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PUT", `/api/alerts/${id}/dismiss`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/stats"] });
      toast({
        title: "告警已忽略",
        description: "告警已标记为忽略",
      });
    },
    onError: (error) => {
      toast({
        title: "操作失败",
        description: error.message || "忽略告警时发生错误",
        variant: "destructive",
      });
    },
  });

  // 导出功能
  const exportAlerts = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setShowExportDialog(true);

    try {
      // 模拟导出进度
      const steps = [
        { progress: 20, message: "正在获取告警数据..." },
        { progress: 40, message: "正在处理数据格式..." },
        { progress: 60, message: "正在生成CSV文件..." },
        { progress: 80, message: "正在准备下载..." },
        { progress: 100, message: "导出完成！" }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setExportProgress(step.progress);
      }

      // 获取当前筛选的告警数据用于导出
      const currentAlerts = alerts || [];
      
      // 创建CSV内容
      const csvContent = [
        // CSV表头
        ['ID', '标题', '描述', '严重程度', '状态', '来源IP', '创建时间', '处理时间'].join(','),
        // CSV数据行
        ...currentAlerts.map((alert: any) => [
          alert.id,
          `"${alert.title}"`,
          `"${alert.description}"`,
          alert.severity === 'high' ? '高危' : alert.severity === 'medium' ? '中危' : '低危',
          alert.status === 'pending' ? '未处理' : alert.status === 'processing' ? '处理中' : alert.status === 'resolved' ? '已处理' : '已忽略',
          alert.sourceIp || '',
          new Date(alert.createdAt).toLocaleString('zh-CN'),
          alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString('zh-CN') : ''
        ].join(','))
      ].join('\n');

      // 创建下载链接
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `告警数据_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "导出成功",
        description: `已成功导出 ${currentAlerts.length} 条告警数据到CSV文件`,
      });

      // 延迟关闭对话框，让用户看到完成状态
      setTimeout(() => {
        setShowExportDialog(false);
        setIsExporting(false);
        setExportProgress(0);
      }, 1500);

    } catch (error: any) {
      setIsExporting(false);
      setShowExportDialog(false);
      setExportProgress(0);
      toast({
        title: "导出失败",
        description: error.message || "导出告警数据时发生错误",
        variant: "destructive",
      });
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      high: { className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "高危" },
      medium: { className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", label: "中危" },
      low: { className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", label: "低危" },
    };
    const config = variants[severity as keyof typeof variants] || variants.low;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "未处理" },
      processing: { className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", label: "处理中" },
      resolved: { className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", label: "已处理" },
      dismissed: { className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200", label: "已忽略" },
    };
    const config = variants[status as keyof typeof variants] || variants.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getAlertBorderColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "border-red-200 dark:border-red-800";
      case "medium":
        return "border-yellow-200 dark:border-yellow-800";
      case "low":
        return "border-blue-200 dark:border-blue-800";
      default:
        return "border-gray-200 dark:border-gray-800";
    }
  };

  const getAlertBackgroundColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-50 dark:bg-red-950";
      case "medium":
        return "bg-yellow-50 dark:bg-yellow-950";
      case "low":
        return "bg-blue-50 dark:bg-blue-950";
      default:
        return "bg-gray-50 dark:bg-gray-950";
    }
  };

  if (statsLoading || alertsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2" />
              告警管理
            </CardTitle>
            <div className="flex items-center space-x-4">
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                新建规则
              </Button>
              <Button 
                variant="outline" 
                onClick={exportAlerts}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {isExporting ? "导出中..." : "导出"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Alert Statistics */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {alertStats?.high || 0}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">高危告警</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {alertStats?.medium || 0}
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">中危告警</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {alertStats?.low || 0}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">低危告警</div>
            </div>
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {alertStats?.resolved || 0}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">已处理</div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-4 flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索告警..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有等级</SelectItem>
                <SelectItem value="high">高危</SelectItem>
                <SelectItem value="medium">中危</SelectItem>
                <SelectItem value="low">低危</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="pending">未处理</SelectItem>
                <SelectItem value="processing">处理中</SelectItem>
                <SelectItem value="resolved">已处理</SelectItem>
                <SelectItem value="dismissed">已忽略</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alerts List */}
          <div className="space-y-4">
            {alerts && alerts.length > 0 ? (
              alerts.map((alert: any) => (
                <div 
                  key={alert.id} 
                  className={`border rounded-lg p-4 ${getAlertBorderColor(alert.severity)} ${getAlertBackgroundColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <div className={`w-3 h-3 rounded-full mt-2 mr-4 ${
                        alert.severity === 'high' ? 'bg-red-600' :
                        alert.severity === 'medium' ? 'bg-yellow-600' :
                        'bg-blue-600'
                      }`}></div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {alert.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {alert.description}
                        </p>
                        <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>触发时间: {new Date(alert.createdAt).toLocaleString('zh-CN')}</span>
                          {alert.sourceIp && <span>来源IP: {alert.sourceIp}</span>}
                          {alert.ruleId && <span>规则ID: {alert.ruleId}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {getSeverityBadge(alert.severity)}
                      {getStatusBadge(alert.status)}
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {alert.status === 'pending' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => resolveAlertMutation.mutate(alert.id)}
                              disabled={resolveAlertMutation.isPending}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => dismissAlertMutation.mutate(alert.id)}
                              disabled={dismissAlertMutation.isPending}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                暂无告警信息
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 导出进度对话框 */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Download className="w-5 h-5 mr-2" />
              导出告警数据
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {exportProgress === 100 ? "导出完成！" : 
                 exportProgress >= 80 ? "正在准备下载..." :
                 exportProgress >= 60 ? "正在生成CSV文件..." :
                 exportProgress >= 40 ? "正在处理数据格式..." :
                 exportProgress >= 20 ? "正在获取告警数据..." : "准备导出..."}
              </span>
              <span>{exportProgress}%</span>
            </div>
            <Progress value={exportProgress} className="w-full" />
            {exportProgress === 100 && (
              <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                <Check className="w-4 h-4 mr-2" />
                文件已成功下载到您的设备
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
