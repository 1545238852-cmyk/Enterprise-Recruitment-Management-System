# 企业招聘管理系统

基于 **FastAPI + Next.js** 的企业招聘管理系统，支持岗位录入、候选人简历解析、知识库导入、混合召回、筛选报告和评估看板。

## 仓库结构

```text
.
├─ ai/                  # 项目源码
│  ├─ backend/          # FastAPI 后端服务
│  ├─ frontend/         # Next.js 前端应用
│  ├─ docs/             # 架构与部署文档
│  ├─ infra/            # 基础设施相关文件
│  ├─ docker-compose.yml
│  └─ README.md         # 项目运行与功能说明
└─ .gitignore
```

## 项目特点

- 前后端分层清晰
- 支持岗位管理与候选人管理
- 支持知识库导入与检索增强
- 支持混合召回与筛选报告
- 支持本地运行与 Docker 部署
- 提供后端测试与前端构建能力

## 快速开始

```powershell
cd "ai"
copy .env.example .env
```

### 启动后端

```powershell
.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --port 8001
```

### 启动前端

```powershell
cd frontend
npm install
npm run dev
```

访问地址：
- 前端：`http://127.0.0.1:3000`
- 接口文档：`http://127.0.0.1:8001/docs`

## 文档

- 项目说明：`ai/README.md`
- 架构文档：`ai/docs/architecture.md`
- 部署文档：`ai/docs/deployment.md`

## 技术栈

- FastAPI
- SQLAlchemy
- Next.js
- React
- TypeScript
- Docker
- RAG
- LLM API
