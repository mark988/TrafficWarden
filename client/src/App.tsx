import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import DeviceManagement from "@/pages/DeviceManagement";
import AlertManagement from "@/pages/AlertManagement";
import UserManagement from "@/pages/UserManagement";
import TrafficAnalysis from "@/pages/TrafficAnalysis";
import DetectionRules from "@/pages/DetectionRules";
import LogAudit from "@/pages/LogAudit";
import SystemConfig from "@/pages/SystemConfig";
import Layout from "@/components/Layout";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <Layout>
          <Route path="/" component={Dashboard} />
          <Route path="/devices" component={DeviceManagement} />
          <Route path="/alerts" component={AlertManagement} />
          <Route path="/traffic" component={TrafficAnalysis} />
          <Route path="/rules" component={DetectionRules} />
          <Route path="/logs" component={LogAudit} />
          <Route path="/users" component={UserManagement} />
          <Route path="/settings" component={SystemConfig} />
        </Layout>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
