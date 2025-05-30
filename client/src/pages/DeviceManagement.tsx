import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertDeviceSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const deviceFormSchema = insertDeviceSchema.extend({
  name: z.string().min(1, "设备名称不能为空"),
  ipAddress: z.string().ip("请输入有效的IP地址"),
  deviceType: z.string().min(1, "设备类型不能为空"),
});

type DeviceFormData = z.infer<typeof deviceFormSchema>;

export default function DeviceManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const { toast } = useToast();

  const { data: devices, isLoading } = useQuery({
    queryKey: ["/api/devices"],
  });

  const addDeviceMutation = useMutation({
    mutationFn: async (data: DeviceFormData) => {
      return apiRequest("POST", "/api/devices", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      setIsAddDialogOpen(false);
      toast({
        title: "设备添加成功",
        description: "网络设备已成功添加到系统中",
      });
    },
    onError: (error) => {
      toast({
        title: "添加失败",
        description: error.message || "添加设备时发生错误",
        variant: "destructive",
      });
    },
  });

  const updateDeviceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: DeviceFormData }) => {
      return apiRequest("PUT", `/api/devices/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      setEditingDevice(null);
      toast({
        title: "设备更新成功",
        description: "设备信息已成功更新",
      });
    },
    onError: (error) => {
      toast({
        title: "更新失败",
        description: error.message || "更新设备时发生错误",
        variant: "destructive",
      });
    },
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/devices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      toast({
        title: "设备删除成功",
        description: "设备已从系统中移除",
      });
    },
    onError: (error) => {
      toast({
        title: "删除失败",
        description: error.message || "删除设备时发生错误",
        variant: "destructive",
      });
    },
  });

  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      name: "",
      ipAddress: "",
      deviceType: "",
      protocol: "netflow",
      status: "offline",
      description: "",
    },
  });

  const onSubmit = (data: DeviceFormData) => {
    if (editingDevice) {
      updateDeviceMutation.mutate({ id: editingDevice.id, data });
    } else {
      addDeviceMutation.mutate(data);
    }
  };

  const handleEdit = (device: any) => {
    setEditingDevice(device);
    form.reset({
      name: device.name,
      ipAddress: device.ipAddress,
      deviceType: device.deviceType,
      protocol: device.protocol,
      status: device.status,
      description: device.description || "",
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除这个设备吗？此操作不可撤销。")) {
      deleteDeviceMutation.mutate(id);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <Wifi className="w-4 h-4 text-green-600" />;
      case "offline":
        return <WifiOff className="w-4 h-4 text-gray-400" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      online: { variant: "default" as const, label: "在线", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      offline: { variant: "secondary" as const, label: "离线", className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
      error: { variant: "destructive" as const, label: "异常", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
    };
    const config = variants[status as keyof typeof variants] || variants.offline;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getProtocolBadge = (protocol: string) => {
    const colors = {
      netflow: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      sflow: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      snmp: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      pcap: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    };
    const color = colors[protocol as keyof typeof colors] || colors.netflow;
    return <Badge className={color}>{protocol.toUpperCase()}</Badge>;
  };

  const filteredDevices = devices?.filter((device: any) => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.ipAddress.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || device.status === statusFilter;
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
              <Wifi className="w-6 h-6 mr-2" />
              网络设备管理
            </CardTitle>
            <Dialog open={isAddDialogOpen || editingDevice !== null} onOpenChange={(open) => {
              if (!open) {
                setIsAddDialogOpen(false);
                setEditingDevice(null);
                form.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  添加设备
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingDevice ? "编辑设备" : "添加网络设备"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>设备名称</FormLabel>
                          <FormControl>
                            <Input placeholder="例如: Core-Switch-01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="ipAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IP地址</FormLabel>
                          <FormControl>
                            <Input placeholder="例如: 192.168.1.1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="deviceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>设备类型</FormLabel>
                          <FormControl>
                            <Input placeholder="例如: 核心交换机" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="protocol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>协议类型</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择协议类型" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="netflow">NetFlow</SelectItem>
                              <SelectItem value="sflow">sFlow</SelectItem>
                              <SelectItem value="snmp">SNMP</SelectItem>
                              <SelectItem value="pcap">PCAP</SelectItem>
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
                          <FormLabel>描述</FormLabel>
                          <FormControl>
                            <Textarea placeholder="设备描述信息（可选）" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAddDialogOpen(false);
                          setEditingDevice(null);
                          form.reset();
                        }}
                      >
                        取消
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={addDeviceMutation.isPending || updateDeviceMutation.isPending}
                      >
                        {addDeviceMutation.isPending || updateDeviceMutation.isPending ? "保存中..." : 
                         editingDevice ? "更新设备" : "添加设备"}
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
                placeholder="搜索设备名称或IP地址..."
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
                <SelectItem value="online">在线</SelectItem>
                <SelectItem value="offline">离线</SelectItem>
                <SelectItem value="error">异常</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>设备名称</TableHead>
                  <TableHead>IP地址</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>协议</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>最后更新</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {devices?.length === 0 ? "暂无设备，点击添加设备开始" : "没有找到匹配的设备"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDevices.map((device: any) => (
                    <TableRow key={device.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell className="font-medium">{device.name}</TableCell>
                      <TableCell className="font-mono text-sm">{device.ipAddress}</TableCell>
                      <TableCell>{device.deviceType}</TableCell>
                      <TableCell>{getProtocolBadge(device.protocol)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(device.status)}
                          {getStatusBadge(device.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {device.lastSeen ? new Date(device.lastSeen).toLocaleString('zh-CN') : '从未连接'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(device)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(device.id)}
                            disabled={deleteDeviceMutation.isPending}
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
    </div>
  );
}
