import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, BarChart3, TrendingUp, Download } from "lucide-react";
import { format } from "date-fns";
import TrafficChart from "@/components/TrafficChart";
import ProtocolChart from "@/components/ProtocolChart";

export default function TrafficAnalysis() {
  const [timeRange, setTimeRange] = useState("24");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [analysisType, setAnalysisType] = useState("overview");

  const { data: trafficData, isLoading } = useQuery({
    queryKey: ["/api/dashboard/traffic-chart", { hours: parseInt(timeRange) }],
  });

  const { data: protocolData } = useQuery({
    queryKey: ["/api/dashboard/protocol-distribution"],
  });

  const { data: topSources } = useQuery({
    queryKey: ["/api/dashboard/top-sources"],
  });

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('zh-CN').format(num);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Analysis Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <BarChart3 className="w-6 h-6 mr-2" />
              流量分析
            </CardTitle>
            <div className="flex items-center space-x-4">
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">总览分析</SelectItem>
                  <SelectItem value="detail">详细分析</SelectItem>
                  <SelectItem value="comparison">对比分析</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">最近1小时</SelectItem>
                  <SelectItem value="6">最近6小时</SelectItem>
                  <SelectItem value="24">最近24小时</SelectItem>
                  <SelectItem value="168">最近7天</SelectItem>
                  <SelectItem value="720">最近30天</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "yyyy-MM-dd") : "选择日期"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                导出报告
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Traffic Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>流量趋势分析</CardTitle>
            </CardHeader>
            <CardContent>
              <TrafficChart hours={parseInt(timeRange)} />
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>协议分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ProtocolChart />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle>流量来源分析</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSources && topSources.length > 0 ? (
                topSources.map((source: any, index: number) => (
                  <div key={source.sourceIp} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                        index < 3 ? 'bg-primary text-primary-foreground' : 'bg-gray-400 text-white'
                      }`}>
                        <span className="text-sm font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium font-mono text-sm">{source.sourceIp}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {source.deviceType || '未知设备'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatBytes(source.totalBytes)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatNumber(source.totalConnections)} 连接
                      </p>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${Math.min(100, (source.totalBytes / (topSources[0]?.totalBytes || 1)) * 100)}%` }}
                        ></div>
                      </div>
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

        {/* Traffic Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>流量统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {trafficData?.totalInbound ? formatBytes(trafficData.totalInbound) : "0 B"}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">入站流量</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {trafficData?.totalOutbound ? formatBytes(trafficData.totalOutbound) : "0 B"}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">出站流量</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">峰值带宽</span>
                  <Badge variant="outline">
                    {trafficData?.peakBandwidth ? `${trafficData.peakBandwidth} Mbps` : "0 Mbps"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">平均带宽</span>
                  <Badge variant="outline">
                    {trafficData?.avgBandwidth ? `${trafficData.avgBandwidth} Mbps` : "0 Mbps"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">数据包总数</span>
                  <Badge variant="outline">
                    {trafficData?.totalPackets ? formatNumber(trafficData.totalPackets) : "0"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">连接数</span>
                  <Badge variant="outline">
                    {trafficData?.totalConnections ? formatNumber(trafficData.totalConnections) : "0"}
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">带宽利用率</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {trafficData?.utilizationRate || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (trafficData?.utilizationRate || 0) > 80 ? 'bg-red-600' :
                      (trafficData?.utilizationRate || 0) > 60 ? 'bg-yellow-600' :
                      'bg-green-600'
                    }`}
                    style={{ width: `${Math.min(100, trafficData?.utilizationRate || 0)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Protocol Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>协议分析详情</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {protocolData && protocolData.length > 0 ? (
              protocolData.map((protocol: any) => (
                <div key={protocol.name} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {protocol.percentage}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {protocol.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatBytes(protocol.bytes)}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                暂无协议数据
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
