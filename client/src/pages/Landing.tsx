import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Activity, Users, AlertTriangle } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            异常流量监控系统
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
            Traffic Anomaly Detection System
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            企业级网络安全监控平台，实时检测异常流量，保护网络安全
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-8 pb-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">实时监控</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                24/7 实时流量监控，智能异常检测，第一时间发现安全威胁
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-8 pb-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">智能告警</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                多级告警机制，自动化响应，确保安全事件及时处理
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-8 pb-6">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">权限管理</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                基于角色的访问控制，完整的操作审计，确保系统安全
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Login Section */}
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  登录系统
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  使用您的账户登录监控系统
                </p>
              </div>

              <Button 
                onClick={handleLogin} 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3"
                size="lg"
              >
                <Shield className="w-5 h-5 mr-2" />
                登录系统
              </Button>

              <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>系统状态: <span className="text-green-600 dark:text-green-400">正常运行</span></p>
                <p className="mt-1">版本: TADS v2.1</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
