import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { FileText, Search, Download, CalendarIcon, Filter, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function LogAudit() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const queryClient = useQueryClient();

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ["/api/audit-logs", { 
      page: currentPage, 
      limit: 50,
      action: actionFilter === "all" ? undefined : actionFilter,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    }],
  });

  const getActionBadge = (action: string) => {
    const actionColors = {
      LOGIN: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      LOGOUT: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      CREATE_DEVICE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      UPDATE_DEVICE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      DELETE_DEVICE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      RESOLVE_ALERT: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      DISMISS_ALERT: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      UPDATE_USER_ROLE: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      UPDATE_USER_STATUS: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      CREATE_DETECTION_RULE: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
      UPDATE_SYSTEM_CONFIG: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    };
    
    const actionLabels = {
      LOGIN: "登录",
      LOGOUT: "登出",
      CREATE_DEVICE: "创建设备",
      UPDATE_DEVICE: "更新设备",
      DELETE_DEVICE: "删除设备",
      RESOLVE_ALERT: "处理告警",
      DISMISS_ALERT: "忽略告警",
      UPDATE_USER_ROLE: "修改用户角色",
      UPDATE_USER_STATUS: "修改用户状态",
      CREATE_DETECTION_RULE: "创建检测规则",
      UPDATE_SYSTEM_CONFIG: "更新系统配置",
    };

    const color = actionColors[action as keyof typeof actionColors] || actionColors.LOGIN;
    const label = actionLabels[action as keyof typeof actionLabels] || action;
    
    return <Badge className={color}>{label}</Badge>;
  };

  const exportLogs = async () => {
    setIsExporting(true);
    setExportProgress(0);

    // 模拟导出进度
    const progressInterval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // 模拟处理时间
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const csvContent = "data:text/csv;charset=utf-8," 
        + "时间,用户,操作,资源,IP地址,详情\n"
        + (auditLogs || []).map((log: any) => 
            `${new Date(log.timestamp).toLocaleString('zh-CN')},${log.userId || '系统'},${log.action},${log.resource},${log.ipAddress || ''},${JSON.stringify(log.details || {})}`
          ).join("\n");

      setExportProgress(100);
      
      // 短暂延迟以显示100%完成
      await new Promise(resolve => setTimeout(resolve, 500));

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `audit_logs_${format(new Date(), "yyyy-MM-dd")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);
    }
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

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="w-6 h-6 mr-2" />
              日志审计
            </CardTitle>
            <Button onClick={exportLogs} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              导出日志
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索用户或资源..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="操作类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有操作</SelectItem>
                <SelectItem value="LOGIN">登录</SelectItem>
                <SelectItem value="LOGOUT">登出</SelectItem>
                <SelectItem value="CREATE_DEVICE">创建设备</SelectItem>
                <SelectItem value="UPDATE_DEVICE">更新设备</SelectItem>
                <SelectItem value="DELETE_DEVICE">删除设备</SelectItem>
                <SelectItem value="RESOLVE_ALERT">处理告警</SelectItem>
                <SelectItem value="UPDATE_USER_ROLE">修改角色</SelectItem>
                <SelectItem value="CREATE_DETECTION_RULE">创建规则</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "yyyy-MM-dd") : "开始日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "yyyy-MM-dd") : "结束日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setActionFilter("all");
              setStartDate(undefined);
              setEndDate(undefined);
            }}>
              <Filter className="w-4 h-4 mr-2" />
              清除筛选
            </Button>
          </div>

          {/* Logs Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>时间</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>操作</TableHead>
                  <TableHead>资源</TableHead>
                  <TableHead>IP地址</TableHead>
                  <TableHead>详情</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs && auditLogs.length > 0 ? (
                  auditLogs.map((log: any) => (
                    <TableRow key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell className="text-sm">
                        {new Date(log.timestamp).toLocaleString('zh-CN')}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{log.userId || '系统'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getActionBadge(log.action)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{log.resource}</div>
                          {log.resourceId && (
                            <div className="text-gray-500">ID: {log.resourceId}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {log.ipAddress || '未记录'}
                      </TableCell>
                      <TableCell>
                        {log.details && Object.keys(log.details).length > 0 ? (
                          <div className="text-sm">
                            {Object.entries(log.details).map(([key, value]) => (
                              <div key={key} className="text-gray-600 dark:text-gray-400">
                                {key}: {String(value)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">无</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      暂无审计日志
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {auditLogs && auditLogs.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                显示第 {((currentPage - 1) * 50) + 1} - {Math.min(currentPage * 50, auditLogs.length)} 条记录
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={auditLogs.length < 50}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
