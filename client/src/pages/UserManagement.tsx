import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Search, Edit, Lock, UserPlus, Loader2, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const userFormSchema = z.object({
  username: z.string().min(3, "用户名至少3个字符").max(50, "用户名不能超过50个字符"),
  email: z.string().email("请输入有效的邮箱地址"),
  firstName: z.string().min(1, "请输入名字"),
  lastName: z.string().min(1, "请输入姓氏"),
  role: z.enum(["admin", "operator", "readonly"], {
    required_error: "请选择用户角色",
  }),
  password: z.string().min(6, "密码至少6个字符"),
});

type UserFormData = z.infer<typeof userFormSchema>;

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      role: "readonly",
      password: "",
    },
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      return apiRequest("POST", "/api/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsAddUserDialogOpen(false);
      form.reset();
      toast({
        title: "用户创建成功",
        description: "新用户已成功添加到系统中",
      });
    },
    onError: (error) => {
      toast({
        title: "创建失败",
        description: error.message || "创建用户时发生错误",
        variant: "destructive",
      });
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return apiRequest("PUT", `/api/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditingUser(null);
      toast({
        title: "角色更新成功",
        description: "用户角色已成功更新",
      });
    },
    onError: (error) => {
      toast({
        title: "更新失败",
        description: error.message || "更新用户角色时发生错误",
        variant: "destructive",
      });
    },
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      return apiRequest("PUT", `/api/users/${userId}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "状态更新成功",
        description: "用户状态已成功更新",
      });
    },
    onError: (error) => {
      toast({
        title: "更新失败",
        description: error.message || "更新用户状态时发生错误",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserFormData) => {
    createUserMutation.mutate(data);
  };

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "用户删除成功",
        description: "用户已从系统中删除",
      });
    },
    onError: (error) => {
      toast({
        title: "删除失败",
        description: error.message || "删除用户时发生错误",
        variant: "destructive",
      });
    },
  });

  const handleDeleteUser = (userId: string, username: string) => {
    if (userId === currentUser?.id) {
      toast({
        title: "操作被拒绝",
        description: "您不能删除自己的账户",
        variant: "destructive",
      });
      return;
    }
    deleteUserMutation.mutate(userId);
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: { className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", label: "系统管理员" },
      operator: { className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", label: "运维人员" },
      readonly: { className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200", label: "只读用户" },
    };
    const config = variants[role as keyof typeof variants] || variants.readonly;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <div className="flex items-center text-green-600 dark:text-green-400">
        <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full mr-2"></div>
        活跃
      </div>
    ) : (
      <div className="flex items-center text-gray-400">
        <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
        禁用
      </div>
    );
  };

  const getUserInitials = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return user.id[0].toUpperCase();
  };

  const getUserDisplayName = (user: any) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email || user.id;
  };

  const handleToggleUserStatus = (userId: string, currentStatus: boolean) => {
    if (userId === currentUser?.id) {
      toast({
        title: "操作被拒绝",
        description: "您不能修改自己的账户状态",
        variant: "destructive",
      });
      return;
    }
    
    const action = currentStatus ? "禁用" : "启用";
    if (confirm(`确定要${action}这个用户吗？`)) {
      updateUserStatusMutation.mutate({ userId, isActive: !currentStatus });
    }
  };

  const handleUpdateRole = (userId: string, newRole: string) => {
    if (userId === currentUser?.id) {
      toast({
        title: "操作被拒绝",
        description: "您不能修改自己的角色",
        variant: "destructive",
      });
      return;
    }
    
    updateUserRoleMutation.mutate({ userId, role: newRole });
  };

  const filteredUsers = users?.filter((user: any) => {
    const displayName = getUserDisplayName(user);
    const matchesSearch = displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
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

  // Check if current user has admin privileges
  if (currentUser?.role !== "admin") {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                访问受限
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                您没有权限访问用户管理功能。只有系统管理员可以管理用户。
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
              <Users className="w-6 h-6 mr-2" />
              用户管理
            </CardTitle>
            <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={currentUser?.role !== "admin"}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  添加用户
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>添加新用户</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>用户名</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入用户名" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>邮箱</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="请输入邮箱地址" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>名字</FormLabel>
                            <FormControl>
                              <Input placeholder="请输入名字" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>姓氏</FormLabel>
                            <FormControl>
                              <Input placeholder="请输入姓氏" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>用户角色</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择用户角色" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">系统管理员</SelectItem>
                              <SelectItem value="operator">运维人员</SelectItem>
                              <SelectItem value="readonly">只读用户</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>密码</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="请输入密码" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddUserDialogOpen(false)}
                      >
                        取消
                      </Button>
                      <Button type="submit" disabled={createUserMutation.isPending}>
                        {createUserMutation.isPending && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        创建用户
                      </Button>
                    </DialogFooter>
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
                placeholder="搜索用户..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有角色</SelectItem>
                <SelectItem value="admin">系统管理员</SelectItem>
                <SelectItem value="operator">运维人员</SelectItem>
                <SelectItem value="readonly">只读用户</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>最后更新</TableHead>
                  <TableHead className="w-32">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {users?.length === 0 ? "暂无用户数据" : "没有找到匹配的用户"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user: any) => (
                    <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.profileImageUrl} alt={getUserDisplayName(user)} />
                            <AvatarFallback className="text-xs">
                              {getUserInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{getUserDisplayName(user)}</div>
                            <div className="text-sm text-gray-500">ID: {user.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email || "未设置"}</TableCell>
                      <TableCell>
                        <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => {
                          if (!open) setEditingUser(null);
                        }}>
                          <DialogTrigger asChild>
                            <div 
                              className="cursor-pointer" 
                              onClick={() => setEditingUser(user)}
                            >
                              {getRoleBadge(user.role)}
                            </div>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[400px]">
                            <DialogHeader>
                              <DialogTitle>修改用户角色</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">用户</label>
                                <div className="mt-1 flex items-center space-x-2">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={user.profileImageUrl} alt={getUserDisplayName(user)} />
                                    <AvatarFallback className="text-xs">
                                      {getUserInitials(user)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{getUserDisplayName(user)}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">新角色</label>
                                <Select 
                                  defaultValue={user.role}
                                  onValueChange={(value) => handleUpdateRole(user.id, value)}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">系统管理员</SelectItem>
                                    <SelectItem value="operator">运维人员</SelectItem>
                                    <SelectItem value="readonly">只读用户</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '未知'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('zh-CN') : '未知'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingUser(user)}
                            disabled={user.id === currentUser?.id}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                            disabled={user.id === currentUser?.id || updateUserStatusMutation.isPending}
                          >
                            <Lock className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={user.id === currentUser?.id || currentUser?.role !== "admin"}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认删除用户</AlertDialogTitle>
                                <AlertDialogDescription>
                                  您确定要删除用户 "{getUserDisplayName(user)}" 吗？此操作无法撤销。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.id, user.username)}
                                  disabled={deleteUserMutation.isPending}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {deleteUserMutation.isPending && (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  )}
                                  删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
