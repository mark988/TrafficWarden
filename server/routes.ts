import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { setupAuth } from "./replitAuth";

// Simple session-based authentication middleware
const isAuthenticated = (req: any, res: any, next: any) => {
  const session = req.session as any;
  if (!session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
import { insertDeviceSchema, insertAlertSchema, insertDetectionRuleSchema, insertSystemConfigSchema } from "@shared/schema";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Local authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "用户名和密码不能为空" });
      }

      // 查找用户
      const user = await storage.getUserByUsername(username);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "用户名或密码错误" });
      }

      // 验证密码
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "用户名或密码错误" });
      }

      // 设置session
      (req.session as any).userId = user.id;
      (req.session as any).username = user.username;
      (req.session as any).role = user.role;

      res.json({ 
        message: "登录成功",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "登录过程中发生错误" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "登出失败" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "登出成功" });
    });
  });

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // 检查session中的用户信息
      const session = req.session as any;
      if (!session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(session.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/traffic-chart", isAuthenticated, async (req, res) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const data = await storage.getTrafficChartData(hours);
      res.json(data);
    } catch (error) {
      console.error("Error fetching traffic chart data:", error);
      res.status(500).json({ message: "Failed to fetch traffic chart data" });
    }
  });

  app.get("/api/dashboard/protocol-distribution", isAuthenticated, async (req, res) => {
    try {
      const data = await storage.getProtocolDistribution();
      res.json(data);
    } catch (error) {
      console.error("Error fetching protocol distribution:", error);
      res.status(500).json({ message: "Failed to fetch protocol distribution" });
    }
  });

  app.get("/api/dashboard/recent-alerts", isAuthenticated, async (req, res) => {
    try {
      const alerts = await storage.getRecentAlerts(10);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching recent alerts:", error);
      res.status(500).json({ message: "Failed to fetch recent alerts" });
    }
  });

  app.get("/api/dashboard/top-sources", isAuthenticated, async (req, res) => {
    try {
      const sources = await storage.getTopTrafficSources(10);
      res.json(sources);
    } catch (error) {
      console.error("Error fetching top sources:", error);
      res.status(500).json({ message: "Failed to fetch top sources" });
    }
  });

  // Device management routes
  app.get("/api/devices", isAuthenticated, async (req, res) => {
    try {
      const devices = await storage.getAllDevices();
      res.json(devices);
    } catch (error) {
      console.error("Error fetching devices:", error);
      res.status(500).json({ message: "Failed to fetch devices" });
    }
  });

  app.post("/api/devices", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertDeviceSchema.parse(req.body);
      const device = await storage.createDevice(validatedData);
      
      // Log the action
      await storage.createAuditLog({
        userId: req.user?.claims?.sub,
        action: "CREATE_DEVICE",
        resource: "device",
        resourceId: device.id.toString(),
        details: { deviceName: device.name, ipAddress: device.ipAddress },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.status(201).json(device);
    } catch (error) {
      console.error("Error creating device:", error);
      res.status(500).json({ message: "Failed to create device" });
    }
  });

  app.put("/api/devices/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDeviceSchema.parse(req.body);
      const device = await storage.updateDevice(id, validatedData);
      
      await storage.createAuditLog({
        userId: req.user?.claims?.sub,
        action: "UPDATE_DEVICE",
        resource: "device",
        resourceId: id.toString(),
        details: validatedData,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(device);
    } catch (error) {
      console.error("Error updating device:", error);
      res.status(500).json({ message: "Failed to update device" });
    }
  });

  app.delete("/api/devices/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDevice(id);
      
      await storage.createAuditLog({
        userId: req.user?.claims?.sub,
        action: "DELETE_DEVICE",
        resource: "device",
        resourceId: id.toString(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting device:", error);
      res.status(500).json({ message: "Failed to delete device" });
    }
  });

  // Alert management routes
  app.get("/api/alerts", isAuthenticated, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const severity = req.query.severity as string;
      const status = req.query.status as string;
      
      const alerts = await storage.getAlerts({ page, limit, severity, status });
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.get("/api/alerts/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getAlertStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching alert stats:", error);
      res.status(500).json({ message: "Failed to fetch alert stats" });
    }
  });

  app.put("/api/alerts/:id/resolve", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.claims?.sub;
      
      const alert = await storage.resolveAlert(id, userId);
      
      await storage.createAuditLog({
        userId,
        action: "RESOLVE_ALERT",
        resource: "alert",
        resourceId: id.toString(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(alert);
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ message: "Failed to resolve alert" });
    }
  });

  app.put("/api/alerts/:id/dismiss", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.claims?.sub;
      
      const alert = await storage.dismissAlert(id, userId);
      
      await storage.createAuditLog({
        userId,
        action: "DISMISS_ALERT",
        resource: "alert",
        resourceId: id.toString(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(alert);
    } catch (error) {
      console.error("Error dismissing alert:", error);
      res.status(500).json({ message: "Failed to dismiss alert" });
    }
  });

  // User management routes (admin only)
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user?.claims?.sub);
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put("/api/users/:id/role", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user?.claims?.sub);
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const userId = req.params.id;
      const { role } = req.body;
      
      const user = await storage.updateUserRole(userId, role);
      
      await storage.createAuditLog({
        userId: req.user?.claims?.sub,
        action: "UPDATE_USER_ROLE",
        resource: "user",
        resourceId: userId,
        details: { newRole: role },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.put("/api/users/:id/status", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user?.claims?.sub);
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const userId = req.params.id;
      const { isActive } = req.body;
      
      const user = await storage.updateUserStatus(userId, isActive);
      
      await storage.createAuditLog({
        userId: req.user?.claims?.sub,
        action: "UPDATE_USER_STATUS",
        resource: "user",
        resourceId: userId,
        details: { isActive },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Detection rules routes
  app.get("/api/detection-rules", isAuthenticated, async (req, res) => {
    try {
      const rules = await storage.getAllDetectionRules();
      res.json(rules);
    } catch (error) {
      console.error("Error fetching detection rules:", error);
      res.status(500).json({ message: "Failed to fetch detection rules" });
    }
  });

  app.post("/api/detection-rules", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertDetectionRuleSchema.parse({
        ...req.body,
        createdBy: req.user?.claims?.sub,
      });
      
      const rule = await storage.createDetectionRule(validatedData);
      
      await storage.createAuditLog({
        userId: req.user?.claims?.sub,
        action: "CREATE_DETECTION_RULE",
        resource: "detection_rule",
        resourceId: rule.id.toString(),
        details: { ruleName: rule.name },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.status(201).json(rule);
    } catch (error) {
      console.error("Error creating detection rule:", error);
      res.status(500).json({ message: "Failed to create detection rule" });
    }
  });

  // Audit logs routes
  app.get("/api/audit-logs", isAuthenticated, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const userId = req.query.userId as string;
      const action = req.query.action as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      const logs = await storage.getAuditLogs({ 
        page, 
        limit, 
        userId, 
        action, 
        startDate, 
        endDate 
      });
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // System configuration routes
  app.get("/api/system-config", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user?.claims?.sub);
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const config = await storage.getAllSystemConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching system config:", error);
      res.status(500).json({ message: "Failed to fetch system config" });
    }
  });

  app.put("/api/system-config/:key", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user?.claims?.sub);
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { key } = req.params;
      const { value, description } = req.body;
      
      const config = await storage.updateSystemConfig(key, {
        value,
        description,
        updatedBy: req.user?.claims?.sub,
      });
      
      await storage.createAuditLog({
        userId: req.user?.claims?.sub,
        action: "UPDATE_SYSTEM_CONFIG",
        resource: "system_config",
        resourceId: key,
        details: { value, description },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(config);
    } catch (error) {
      console.error("Error updating system config:", error);
      res.status(500).json({ message: "Failed to update system config" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
