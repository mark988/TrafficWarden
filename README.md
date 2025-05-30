# 异常流量监控系统 (Traffic Anomaly Detection System)

企业级网络安全监控平台，提供实时流量分析、异常检测和安全预警功能。

## 系统特性

### 核心功能
- **实时流量监控** - 24/7 持续监控网络流量，支持多种协议分析
- **智能异常检测** - 基于机器学习的异常流量识别和威胁检测
- **多级告警系统** - 可配置的告警规则和自动化响应机制
- **权限管理** - 基于角色的访问控制，支持多用户协作
- **完整审计** - 详细的操作日志和审计追踪

### 技术架构
- **前端**: React + TypeScript + Tailwind CSS
- **后端**: Node.js + Express.js
- **数据库**: PostgreSQL + Drizzle ORM
- **认证**: 基于会话的身份验证
- **实时通信**: WebSocket 支持

## 快速开始

### 环境要求
- Node.js 18+ 
- PostgreSQL 数据库
- 现代浏览器支持

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd traffic-anomaly-detection
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
# 数据库连接
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# 会话密钥
SESSION_SECRET=your-secure-session-secret

# 其他配置
PGHOST=localhost
PGPORT=5432
PGUSER=username
PGPASSWORD=password
PGDATABASE=database_name
```

4. **初始化数据库**
```bash
npm run db:push
```

5. **启动应用**
```bash
npm run dev
```

应用将在 `http://localhost:5000` 启动。

## 用户角色与权限

### 管理员 (Admin)
- 完整系统访问权限
- 用户管理和权限分配
- 系统配置和规则管理
- 所有数据的查看和操作权限

### 运维人员 (Operator)
- 告警管理和处理
- 流量分析和监控
- 检测规则配置
- 设备管理

### 只读用户 (Readonly)
- 仪表板查看
- 流量数据浏览
- 告警状态查看
- 报告生成

## 功能模块

### 仪表板
- 实时流量统计
- 告警概览
- 系统状态监控
- 关键指标展示

### 用户管理
- 用户账户创建和编辑
- 角色权限分配
- 账户状态管理
- 批量操作支持

### 告警管理
- 告警事件列表
- 告警处理和响应
- 告警统计分析
- 告警规则配置

### 流量分析
- 实时流量监控
- 协议分布分析
- 流量来源统计
- 异常流量识别

### 检测规则
- 自定义检测规则
- 规则优先级设置
- 条件逻辑配置
- 规则测试验证

### 设备管理
- 网络设备注册
- 设备状态监控
- 设备配置管理
- 设备组织架构

### 日志审计
- 操作日志记录
- 用户行为追踪
- 系统事件审计
- 合规性报告

### 系统配置
- 全局参数设置
- 告警阈值配置
- 系统维护模式
- 性能优化设置

## API 接口

### 认证接口
```
POST /api/auth/login     # 用户登录
GET  /api/auth/user      # 获取当前用户信息
GET  /api/logout         # 用户登出
```

### 用户管理
```
GET    /api/users           # 获取用户列表
POST   /api/users           # 创建用户
PUT    /api/users/:id/role  # 更新用户角色
PUT    /api/users/:id/status # 更新用户状态
DELETE /api/users/:id       # 删除用户
```

### 告警管理
```
GET  /api/alerts            # 获取告警列表
GET  /api/alerts/stats      # 获取告警统计
POST /api/alerts/:id/resolve # 处理告警
POST /api/alerts/:id/dismiss # 忽略告警
```

### 更多接口文档请参考 `/docs/api.md`

## 开发指南

### 项目结构
```
├── client/                 # 前端应用
│   ├── src/
│   │   ├── components/     # 通用组件
│   │   ├── pages/         # 页面组件
│   │   ├── hooks/         # React Hooks
│   │   └── lib/           # 工具库
├── server/                # 后端应用
│   ├── routes.ts          # API 路由
│   ├── storage.ts         # 数据访问层
│   ├── db.ts             # 数据库配置
│   └── index.ts          # 服务器入口
├── shared/               # 共享类型定义
│   └── schema.ts         # 数据库模式
└── README.md
```

### 开发命令
```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run db:push      # 推送数据库模式更改
npm run db:studio    # 打开数据库管理界面
```

### 代码规范
- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 配置
- 组件采用函数式编程风格
- API 接口统一使用 RESTful 设计

## 部署说明

### 生产环境部署
1. 构建应用: `npm run build`
2. 配置环境变量
3. 启动服务: `npm start`
4. 配置反向代理 (Nginx/Apache)
5. 设置 SSL 证书

### Docker 部署
```dockerfile
# 可选: 使用 Docker 容器化部署
# 详细配置请参考 docker-compose.yml
```

## 安全考虑

- 所有 API 接口都需要身份验证
- 密码采用 bcrypt 加密存储
- 会话管理使用安全的 cookie 配置
- 输入验证和 SQL 注入防护
- XSS 和 CSRF 攻击防护

## 监控与日志

- 系统操作全程审计记录
- 错误日志自动收集
- 性能指标监控
- 告警事件追踪

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 技术支持

如需技术支持或报告问题，请通过以下方式联系:

- 项目问题: 请在 GitHub Issues 中提交
- 功能建议: 欢迎提交 Pull Request
- 安全问题: 请通过私有渠道报告

## 更新日志

### v2.1.0 (当前版本)
- ✅ 完整的用户管理系统
- ✅ 角色权限控制
- ✅ 实时流量监控
- ✅ 智能告警系统
- ✅ 审计日志功能
- ✅ 响应式界面设计

### 计划功能
- 📋 更高级的异常检测算法
- 📋 自定义报告生成
- 📋 API 密钥管理
- 📋 多租户支持
- 📋 移动端应用

---

**异常流量监控系统 v2.1** - 为企业网络安全保驾护航