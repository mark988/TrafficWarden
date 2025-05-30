import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TrafficChart from "@/components/TrafficChart";
import ProtocolChart from "@/components/ProtocolChart";
import { 
  TrendingUp, 
  Activity, 
  AlertTriangle, 
  Server, 
  ArrowUp,
  Eye,
  ExternalLink 
} from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState("24");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-alerts"],
  });

  const { data: topSources, isLoading: sourcesLoading } = useQuery({
    queryKey: ["/api/dashboard/top-sources"],
  });

  if (statsLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('zh-CN').format(num);
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      high: "destructive",
      medium: "default",
      low: "secondary"
    };
    const labels = {
      high: "高危",
      medium: "中危", 
      low: "低危"
    };
    return (
      <Badge variant={variants[severity as keyof typeof variants] as any}>
        {labels[severity as keyof typeof labels]}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "destructive",
      processing: "default",
      resolved: "secondary"
    };
    const labels = {
      pending: "未处理",
      processing: "处理中",
      resolved: "已处理"
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">总流量</p>
                <p className="text-3xl font-bold mt-2">
                  {stats ? formatBytes(stats.totalTraffic) : "0 B"}
                </p>
                <p className="text-sm text-accent mt-1 flex items-center">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  {stats ? `+${stats.trafficGrowth}%` : "+0%"} 相比昨日
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">活跃连接</p>
                <p className="text-3xl font-bold mt-2">
                  {stats ? formatNumber(stats.activeConnections) : "0"}
                </p>
                <p className="text-sm text-accent mt-1 flex items-center">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  {stats ? `+${stats.connectionsGrowth}%` : "+0%"} 相比昨日
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">异常事件</p>
                <p className="text-3xl font-bold mt-2">
                  {stats ? formatNumber(stats.anomalies) : "0"}
                </p>
                <p className="text-sm text-destructive mt-1 flex items-center">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  {stats ? `+${stats.anomaliesGrowth}%` : "+0%"} 相比昨日
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">在线设备</p>
                <p className="text-3xl font-bold mt-2">
                  {stats ? formatNumber(stats.onlineDevices) : "0"}
                </p>
                <p className="text-sm text-accent mt-1 flex items-center">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  {stats ? `+${stats.devicesGrowth}%` : "+0%"} 相比昨日
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Server className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>实时流量监控</CardTitle>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">最近1小时</SelectItem>
                  <SelectItem value="6">最近6小时</SelectItem>
                  <SelectItem value="24">最近24小时</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <TrafficChart hours={parseInt(timeRange)} />
          </CardContent>
        </Card>

        {/* Protocol Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>协议分布</CardTitle>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">实时更新</span>
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ProtocolChart />
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts and Top Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>最新告警</CardTitle>
              <Link href="/alerts">
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  查看全部
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alertsLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  </div>
                ))
              ) : recentAlerts && recentAlerts.length > 0 ? (
                recentAlerts.map((alert: any) => (
                  <div 
                    key={alert.id} 
                    className={`p-4 rounded-lg border ${
                      alert.severity === 'high' ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800' :
                      alert.severity === 'medium' ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800' :
                      'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        <div className={`w-3 h-3 rounded-full mt-2 mr-3 ${
                          alert.severity === 'high' ? 'bg-destructive' :
                          alert.severity === 'medium' ? 'bg-warning' :
                          'bg-primary'
                        }`}></div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {alert.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {alert.description}
                          </p>
                          <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>{new Date(alert.createdAt).toLocaleString('zh-CN')}</span>
                            {alert.sourceIp && <span>来源IP: {alert.sourceIp}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {getSeverityBadge(alert.severity)}
                        {getStatusBadge(alert.status)}
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

        {/* Top Traffic Sources */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>流量来源TOP 10</CardTitle>
              <Select defaultValue="traffic">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="traffic">按流量排序</SelectItem>
                  <SelectItem value="connections">按连接数排序</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sourcesLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  </div>
                ))
              ) : topSources && topSources.length > 0 ? (
                topSources.map((source: any, index: number) => (
                  <div key={source.sourceIp} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                        index === 0 ? 'bg-primary text-primary-foreground' : 'bg-gray-400 text-white'
                      }`}>
                        <span className="text-sm font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white font-mono text-sm">
                          {source.sourceIp}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {source.deviceType || '未知设备'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatBytes(source.totalBytes)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatNumber(source.totalConnections)} 连接
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  暂无流量数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
