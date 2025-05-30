import {
  users,
  devices,
  alerts,
  detectionRules,
  auditLogs,
  systemConfig,
  trafficData,
  type User,
  type UpsertUser,
  type Device,
  type InsertDevice,
  type Alert,
  type InsertAlert,
  type DetectionRule,
  type InsertDetectionRule,
  type AuditLog,
  type InsertAuditLog,
  type SystemConfig,
  type InsertSystemConfig,
  type TrafficData,
  type InsertTrafficData,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte, lte, count, sum, avg, max } from "drizzle-orm";

export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User>;
  updateUserStatus(userId: string, isActive: boolean): Promise<User>;

  // Device operations
  getAllDevices(): Promise<Device[]>;
  createDevice(device: InsertDevice): Promise<Device>;
  updateDevice(id: number, device: InsertDevice): Promise<Device>;
  deleteDevice(id: number): Promise<void>;

  // Alert operations
  getAlerts(filters: {
    page: number;
    limit: number;
    severity?: string;
    status?: string;
  }): Promise<Alert[]>;
  getAlertStats(): Promise<any>;
  getRecentAlerts(limit: number): Promise<Alert[]>;
  resolveAlert(id: number, userId: string): Promise<Alert>;
  dismissAlert(id: number, userId: string): Promise<Alert>;
  createAlert(alert: InsertAlert): Promise<Alert>;

  // Detection rule operations
  getAllDetectionRules(): Promise<DetectionRule[]>;
  createDetectionRule(rule: InsertDetectionRule): Promise<DetectionRule>;
  updateDetectionRule(id: number, rule: InsertDetectionRule): Promise<DetectionRule>;
  deleteDetectionRule(id: number): Promise<void>;

  // Audit log operations
  getAuditLogs(filters: {
    page: number;
    limit: number;
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  // System config operations
  getAllSystemConfig(): Promise<SystemConfig[]>;
  updateSystemConfig(key: string, config: Partial<InsertSystemConfig>): Promise<SystemConfig>;

  // Dashboard operations
  getDashboardStats(): Promise<any>;
  getTrafficChartData(hours: number): Promise<any>;
  getProtocolDistribution(): Promise<any>;
  getTopTrafficSources(limit: number): Promise<any>;

  // Traffic data operations
  createTrafficData(data: InsertTrafficData): Promise<TrafficData>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role: role as any, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Device operations
  async getAllDevices(): Promise<Device[]> {
    return await db.select().from(devices).orderBy(desc(devices.createdAt));
  }

  async createDevice(device: InsertDevice): Promise<Device> {
    const [newDevice] = await db
      .insert(devices)
      .values(device)
      .returning();
    return newDevice;
  }

  async updateDevice(id: number, device: InsertDevice): Promise<Device> {
    const [updatedDevice] = await db
      .update(devices)
      .set({ ...device, updatedAt: new Date() })
      .where(eq(devices.id, id))
      .returning();
    return updatedDevice;
  }

  async deleteDevice(id: number): Promise<void> {
    await db.delete(devices).where(eq(devices.id, id));
  }

  // Alert operations
  async getAlerts(filters: {
    page: number;
    limit: number;
    severity?: string;
    status?: string;
  }): Promise<Alert[]> {
    const offset = (filters.page - 1) * filters.limit;
    let query = db.select().from(alerts);
    
    const conditions = [];
    if (filters.severity) {
      conditions.push(eq(alerts.severity, filters.severity as any));
    }
    if (filters.status) {
      conditions.push(eq(alerts.status, filters.status as any));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query
      .orderBy(desc(alerts.createdAt))
      .limit(filters.limit)
      .offset(offset);
  }

  async getAlertStats(): Promise<any> {
    const stats = await db
      .select({
        severity: alerts.severity,
        count: count(),
      })
      .from(alerts)
      .where(eq(alerts.status, 'pending'))
      .groupBy(alerts.severity);

    const resolved = await db
      .select({ count: count() })
      .from(alerts)
      .where(eq(alerts.status, 'resolved'));

    const result: any = { resolved: resolved[0]?.count || 0 };
    stats.forEach(stat => {
      result[stat.severity] = stat.count;
    });

    return result;
  }

  async getRecentAlerts(limit: number): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .orderBy(desc(alerts.createdAt))
      .limit(limit);
  }

  async resolveAlert(id: number, userId: string): Promise<Alert> {
    const [alert] = await db
      .update(alerts)
      .set({
        status: 'resolved',
        resolvedBy: userId,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(alerts.id, id))
      .returning();
    return alert;
  }

  async dismissAlert(id: number, userId: string): Promise<Alert> {
    const [alert] = await db
      .update(alerts)
      .set({
        status: 'dismissed',
        resolvedBy: userId,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(alerts.id, id))
      .returning();
    return alert;
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db
      .insert(alerts)
      .values(alert)
      .returning();
    return newAlert;
  }

  // Detection rule operations
  async getAllDetectionRules(): Promise<DetectionRule[]> {
    return await db.select().from(detectionRules).orderBy(desc(detectionRules.createdAt));
  }

  async createDetectionRule(rule: InsertDetectionRule): Promise<DetectionRule> {
    const [newRule] = await db
      .insert(detectionRules)
      .values(rule)
      .returning();
    return newRule;
  }

  async updateDetectionRule(id: number, rule: InsertDetectionRule): Promise<DetectionRule> {
    const [updatedRule] = await db
      .update(detectionRules)
      .set({ ...rule, updatedAt: new Date() })
      .where(eq(detectionRules.id, id))
      .returning();
    return updatedRule;
  }

  async deleteDetectionRule(id: number): Promise<void> {
    await db.delete(detectionRules).where(eq(detectionRules.id, id));
  }

  // Audit log operations
  async getAuditLogs(filters: {
    page: number;
    limit: number;
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AuditLog[]> {
    const offset = (filters.page - 1) * filters.limit;
    let query = db.select().from(auditLogs);
    
    const conditions = [];
    if (filters.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }
    if (filters.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }
    if (filters.startDate) {
      conditions.push(gte(auditLogs.timestamp, new Date(filters.startDate)));
    }
    if (filters.endDate) {
      conditions.push(lte(auditLogs.timestamp, new Date(filters.endDate)));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query
      .orderBy(desc(auditLogs.timestamp))
      .limit(filters.limit)
      .offset(offset);
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db
      .insert(auditLogs)
      .values(log)
      .returning();
    return newLog;
  }

  // System config operations
  async getAllSystemConfig(): Promise<SystemConfig[]> {
    return await db.select().from(systemConfig).orderBy(systemConfig.key);
  }

  async updateSystemConfig(key: string, config: Partial<InsertSystemConfig>): Promise<SystemConfig> {
    const [updatedConfig] = await db
      .insert(systemConfig)
      .values({ key, ...config } as any)
      .onConflictDoUpdate({
        target: systemConfig.key,
        set: { ...config, updatedAt: new Date() },
      })
      .returning();
    return updatedConfig;
  }

  // Dashboard operations
  async getDashboardStats(): Promise<any> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get basic counts
    const deviceCount = await db.select({ count: count() }).from(devices).where(eq(devices.status, 'online'));
    const alertCount = await db.select({ count: count() }).from(alerts).where(eq(alerts.status, 'pending'));
    
    // Get traffic stats (mock data since we don't have real traffic yet)
    const totalTraffic = 2.34 * 1024 * 1024 * 1024 * 1024; // 2.34 TB in bytes
    const activeConnections = 1247;
    const anomalies = 23;

    return {
      totalTraffic,
      trafficGrowth: 12.5,
      activeConnections,
      connectionsGrowth: 8.2,
      anomalies,
      anomaliesGrowth: 15.6,
      onlineDevices: deviceCount[0]?.count || 0,
      devicesGrowth: 2.1,
    };
  }

  async getTrafficChartData(hours: number): Promise<any> {
    // Return mock traffic chart data
    const labels = [];
    const inboundData = [];
    const outboundData = [];
    
    for (let i = hours; i >= 0; i--) {
      const time = new Date(Date.now() - i * 60 * 60 * 1000);
      labels.push(time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
      inboundData.push(Math.random() * 500 + 100);
      outboundData.push(Math.random() * 400 + 80);
    }

    return {
      labels,
      datasets: [
        {
          label: '入站流量 (Mbps)',
          data: inboundData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
        },
        {
          label: '出站流量 (Mbps)',
          data: outboundData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
        },
      ],
    };
  }

  async getProtocolDistribution(): Promise<any> {
    return [
      { name: 'HTTP/HTTPS', percentage: 45, bytes: 1024 * 1024 * 1024 * 1.2 },
      { name: 'FTP', percentage: 15, bytes: 1024 * 1024 * 1024 * 0.4 },
      { name: 'SSH', percentage: 12, bytes: 1024 * 1024 * 1024 * 0.32 },
      { name: 'DNS', percentage: 10, bytes: 1024 * 1024 * 1024 * 0.27 },
      { name: 'SMTP', percentage: 8, bytes: 1024 * 1024 * 1024 * 0.21 },
      { name: 'Other', percentage: 10, bytes: 1024 * 1024 * 1024 * 0.27 },
    ];
  }

  async getTopTrafficSources(limit: number): Promise<any> {
    return [
      {
        sourceIp: '192.168.1.10',
        deviceType: '内网服务器',
        totalBytes: 234.5 * 1024 * 1024,
        totalConnections: 1247,
      },
      {
        sourceIp: '10.0.1.25',
        deviceType: 'Web服务器',
        totalBytes: 156.8 * 1024 * 1024,
        totalConnections: 892,
      },
      {
        sourceIp: '172.16.0.100',
        deviceType: '数据库服务器',
        totalBytes: 98.3 * 1024 * 1024,
        totalConnections: 445,
      },
    ];
  }

  // Traffic data operations
  async createTrafficData(data: InsertTrafficData): Promise<TrafficData> {
    const [newData] = await db
      .insert(trafficData)
      .values(data)
      .returning();
    return newData;
  }
}

export const storage = new DatabaseStorage();
