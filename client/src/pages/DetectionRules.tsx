import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, Plus, Search, Edit, Trash2, Play, Pause, Loader2, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertDetectionRuleSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const ruleFormSchema = insertDetectionRuleSchema.extend({
  name: z.string().min(1, "规则名称不能为空"),
  ruleType: z.string().min(1, "规则类型不能为空"),
  conditions: z.any(),
});

type RuleFormData = z.infer<typeof ruleFormSchema>;

export default function DetectionRules() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [deleteRuleId, setDeleteRuleId] = useState<number | null>(null);
  const [toggleRuleId, setToggleRuleId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: rules, isLoading } = useQuery({
    queryKey: ["/api/detection-rules"],
  });

  const addRuleMutation = useMutation({
    mutationFn: async (data: RuleFormData) => {
      return apiRequest("POST", "/api/detection-rules", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/detection-rules"] });
      setIsAddDialogOpen(false);
      toast({
        title: "规则创建成功",
        description: "检测规则已成功创建",
      });
    },
    onError: (error) => {
      toast({
        title: "创建失败",
        description: error.message || "创建检测规则时发生错误",
        variant: "destructive",
      });
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RuleFormData }) => {
      return apiRequest("PUT", `/api/detection-rules/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/detection-rules"] });
      setEditingRule(null);
      toast({
        title: "规则更新成功",
        description: "检测规则已成功更新",
      });
    },
    onError: (error) => {
      toast({
        title: "更新失败",
        description: error.message || "更新检测规则时发生错误",
        variant: "destructive",
      });
    },
  });

  const toggleRuleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/detection-rules/${id}/toggle`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/detection-rules"] });
      setToggleRuleId(null);
      toast({
        title: "状态更新成功",
        description: "规则状态已成功切换",
      });
    },
    onError: (error) => {
      setToggleRuleId(null);
      toast({
        title: "状态更新失败",
        description: error.message || "切换规则状态时发生错误",
        variant: "destructive",
      });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/detection-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/detection-rules"] });
      setDeleteRuleId(null);
      toast({
        title: "规则删除成功",
        description: "检测规则已成功删除",
      });
    },
    onError: (error) => {
      setDeleteRuleId(null);
      toast({
        title: "删除失败",
        description: error.message || "删除检测规则时发生错误",
        variant: "destructive",
      });
    },
  });

  const form = useForm<RuleFormData>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      ruleType: "threshold",
      conditions: {},
      severity: "medium",
      isActive: true,
    },
  });

  const onSubmit = (data: RuleFormData) => {
    // Convert form data to proper format
    const ruleData = {
      ...data,
      conditions: {
        type: data.ruleType,
        threshold: 80,
        duration: 300,
        ...data.conditions,
      },
    };
    
    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id, data: ruleData });
    } else {
      addRuleMutation.mutate(ruleData);
    }
  };

  // 编辑规则时填充表单
  const handleEditRule = (rule: any) => {
    setEditingRule(rule);
    form.reset({
      name: rule.name,
      description: rule.description || "",
      ruleType: rule.ruleType,
      severity: rule.severity,
      isActive: rule.isActive,
      conditions: rule.conditions || {},
    });
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      high: { className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "高危" },
      medium: { className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", label: "中危" },
      low: { className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", label: "低危" },
    };
    const config = variants[severity as keyof typeof variants] || variants.medium;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        启用
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
        禁用
      </Badge>
    );
  };

  const getRuleTypeLabel = (ruleType: string) => {
    const types = {
      threshold: "阈值检测",
      anomaly: "异常检测",
      pattern: "模式匹配",
      frequency: "频率检测",
      ddos: "DDoS检测",
      scan: "端口扫描",
    };
    return types[ruleType as keyof typeof types] || ruleType;
  };

  const filteredRules = rules?.filter((rule: any) => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && rule.isActive) ||
                         (statusFilter === "inactive" && !rule.isActive);
    return matchesSearch && matchesStatus;
  }) || [];

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
              <Settings className="w-6 h-6 mr-2" />
              检测规则管理
            </CardTitle>
            <Dialog open={isAddDialogOpen || editingRule !== null} onOpenChange={(open) => {
              if (!open) {
                setIsAddDialogOpen(false);
                setEditingRule(null);
                form.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  新建规则
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingRule ? "编辑检测规则" : "新建检测规则"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>规则名称</FormLabel>
                          <FormControl>
                            <Input placeholder="例如: 带宽阈值检测" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="ruleType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>规则类型</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择规则类型" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="threshold">阈值检测</SelectItem>
                              <SelectItem value="anomaly">异常检测</SelectItem>
                              <SelectItem value="pattern">模式匹配</SelectItem>
                              <SelectItem value="frequency">频率检测</SelectItem>
                              <SelectItem value="ddos">DDoS检测</SelectItem>
                              <SelectItem value="scan">端口扫描</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="severity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>严重程度</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择严重程度" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">低危</SelectItem>
                              <SelectItem value="medium">中危</SelectItem>
                              <SelectItem value="high">高危</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>规则描述</FormLabel>
                          <FormControl>
                            <Textarea placeholder="描述此检测规则的用途和触发条件" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">启用规则</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              启用后此规则将开始监控流量
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAddDialogOpen(false);
                          setEditingRule(null);
                          form.reset();
                        }}
                      >
                        取消
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={addRuleMutation.isPending}
                      >
                        {addRuleMutation.isPending ? "保存中..." : 
                         editingRule ? "更新规则" : "创建规则"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-4 flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索规则名称或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="active">已启用</SelectItem>
                <SelectItem value="inactive">已禁用</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>规则名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>严重程度</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>创建者</TableHead>
                  <TableHead className="w-32">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {rules?.length === 0 ? "暂无检测规则，点击新建规则开始" : "没有找到匹配的规则"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRules.map((rule: any) => (
                    <TableRow key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          {rule.description && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {rule.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getRuleTypeLabel(rule.ruleType)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getSeverityBadge(rule.severity)}</TableCell>
                      <TableCell>{getStatusBadge(rule.isActive)}</TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {rule.createdAt ? new Date(rule.createdAt).toLocaleDateString('zh-CN') : '未知'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {rule.createdBy || '系统'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={toggleRuleId === rule.id}
                            onClick={() => {
                              setToggleRuleId(rule.id);
                              toggleRuleStatusMutation.mutate({ 
                                id: rule.id, 
                                isActive: !rule.isActive 
                              });
                            }}
                            className={`${rule.isActive ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'} 
                                       ${toggleRuleId === rule.id ? 'animate-pulse' : ''}`}
                          >
                            {toggleRuleId === rule.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : rule.isActive ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRule(rule)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteRuleId(rule.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteRuleId !== null} onOpenChange={(open) => !open && setDeleteRuleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              确认删除规则
            </AlertDialogTitle>
            <AlertDialogDescription>
              您即将删除检测规则"{deleteRuleId && rules?.find((r: any) => r.id === deleteRuleId)?.name}"。
              <br />
              <span className="text-red-600 font-medium">此操作无法撤销，删除后所有相关的检测历史和配置都将丢失。</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setDeleteRuleId(null)}
              disabled={deleteRuleMutation.isPending}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRuleId && deleteRuleMutation.mutate(deleteRuleId)}
              disabled={deleteRuleMutation.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteRuleMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  删除中...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  确认删除
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
