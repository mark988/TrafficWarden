import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarIcon, BarChart3, TrendingUp, Download, Loader2, Check } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import TrafficChart from "@/components/TrafficChart";
import ProtocolChart from "@/components/ProtocolChart";

export default function TrafficAnalysis() {
  const [timeRange, setTimeRange] = useState("24");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [analysisType, setAnalysisType] = useState("overview");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { toast } = useToast();

  const { data: trafficData, isLoading } = useQuery({
    queryKey: ["/api/dashboard/traffic-chart", { hours: parseInt(timeRange) }],
  });

  const { data: protocolData } = useQuery({
    queryKey: ["/api/dashboard/protocol-distribution"],
  });

  const { data: topSources } = useQuery({
    queryKey: ["/api/dashboard/top-sources"],
  });

  // 导出报告功能
  const exportReport = async () => {
    try {
      setIsExporting(true);
      setExportProgress(0);
      setShowExportDialog(true);

      // 模拟导出进度
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 200);

      // 收集报告数据
      const reportData = {
        analysisType,
        timeRange,
        selectedDate: selectedDate ? format(selectedDate, "yyyy-MM-dd") : null,
        trafficData,
        protocolData,
        topSources,
        generatedAt: new Date().toISOString(),
        reportTitle: `流量分析报告-${analysisType === 'overview' ? '总览分析' : analysisType === 'detail' ? '详细分析' : '对比分析'}`
      };

      // 等待3秒模拟导出处理
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      clearInterval(progressInterval);
      setExportProgress(100);

      // 创建并下载文件
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `流量分析报告_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "导出成功",
        description: "流量分析报告已成功导出到您的设备",
      });

    } catch (error) {
      toast({
        title: "导出失败",
        description: "导出流量分析报告时发生错误",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setTimeout(() => {
        setShowExportDialog(false);
        setExportProgress(0);
      }, 2000);
    }
  };

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

              <Button 
                variant="outline"
                onClick={exportReport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    导出中...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    导出报告
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 根据分析类型显示不同内容 */}
      {analysisType === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>流量趋势分析 - 总览</CardTitle>
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
      )}

      {analysisType === "detail" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>详细流量分析</CardTitle>
            </CardHeader>
            <CardContent>
              <TrafficChart hours={parseInt(timeRange)} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>实时流量监控</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {trafficData?.currentBandwidth || "0"} Mbps
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">当前带宽</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {trafficData?.activeConnections || "0"}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">活跃连接</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">入站流量</span>
                    <span className="text-sm font-medium">{formatBytes(trafficData?.totalInbound || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">出站流量</span>
                    <span className="text-sm font-medium">{formatBytes(trafficData?.totalOutbound || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">数据包数量</span>
                    <span className="text-sm font-medium">{formatNumber(trafficData?.totalPackets || 0)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {analysisType === "comparison" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>对比分析 - 当前时段 vs 历史数据</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">当前时段 ({timeRange}小时)</h4>
                  <TrafficChart hours={parseInt(timeRange)} />
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-3">对比时段 (前{timeRange}小时)</h4>
                  <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">对比数据图表</p>
                      <p className="text-xs">显示历史同期流量趋势</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">+15.3%</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">流量增长</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">+8.7%</div>
                  <div className="text-sm text-green-700 dark:text-green-300">连接增长</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">-2.1%</div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">延迟变化</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {trafficData?.peakBandwidth ? `${trafficData.peakBandwidth}` : "245.7"} Mbps
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">峰值带宽</div>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {trafficData?.avgBandwidth ? `${trafficData.avgBandwidth}` : "127.3"} Mbps
                  </div>
                  <div className="text-sm text-orange-700 dark:text-orange-300">平均带宽</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">数据包总数</span>
                  <Badge variant="outline">
                    {trafficData?.totalPackets ? formatNumber(trafficData.totalPackets) : formatNumber(15847392)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">活跃连接数</span>
                  <Badge variant="outline">
                    {trafficData?.totalConnections ? formatNumber(trafficData.totalConnections) : formatNumber(2847)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">TCP连接数</span>
                  <Badge variant="outline">
                    {formatNumber(2156)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">UDP连接数</span>
                  <Badge variant="outline">
                    {formatNumber(691)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">丢包率</span>
                  <Badge variant={0.12 > 1 ? "destructive" : "outline"}>
                    0.12%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">平均延迟</span>
                  <Badge variant={23.7 > 50 ? "destructive" : "outline"}>
                    23.7ms
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">异常流量检测</span>
                  <Badge variant="secondary">
                    3个威胁
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

      {/* 导出报告对话框 */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Download className="w-5 h-5 mr-2" />
              导出流量分析报告
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>导出进度</span>
                <span>{Math.round(exportProgress)}%</span>
              </div>
              <Progress value={exportProgress} className="w-full" />
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {exportProgress < 30 && "正在收集流量数据..."}
              {exportProgress >= 30 && exportProgress < 60 && "正在分析协议分布..."}
              {exportProgress >= 60 && exportProgress < 90 && "正在生成报告..."}
              {exportProgress >= 90 && exportProgress < 100 && "正在准备下载..."}
              {exportProgress >= 100 && (
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <Check className="w-4 h-4 mr-2" />
                  报告已成功导出到您的设备
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
