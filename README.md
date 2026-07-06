# 🧑‍💼 企业招聘管理系统

作者：1545238852-cmyk  
仓库：https://github.com/1545238852-cmyk/Enterprise-Recruitment-Management-System

这是一个面向企业招聘流程的全栈项目，集成了岗位管理、候选人管理、知识库检索增强、候选人召回、筛选报告与评估看板等模块。系统支持本地运行、真实大模型接入和 Docker 部署。

## 🏗️ 系统架构

```text
用户 → 前端管理台（Next.js） → 后端服务（FastAPI）
                              ├─ 岗位管理
                              ├─ 候选人管理
                              ├─ 知识库导入 / 检索增强
                              ├─ 候选人召回 / 排序
                              ├─ 筛选报告生成
                              └─ 评估看板

模型接入：Mock / OpenAI / Dify
存储方式：SQLite / PostgreSQL
部署方式：本地运行 / Docker Compose
```

## ✨ 主要功能

- 岗位录入与结构化解析
- 候选人文本录入与文件上传
- 知识库导入与 RAG 检索增强
- 混合召回与候选人排序
- 硬性条件筛选与匹配分析
- 筛选报告与反馈总结
- 检索评估与指标展示
- 前后端分离部署

## 🧠 筛选流程

```text
岗位录入 → 结构化解析 → 候选人召回 → 硬性筛选 → RAG 检索增强 → 匹配分析 → 筛选报告
```

| 节点 | 功能 |
| --- | --- |
| 岗位解析 | 提取岗位名称、必备技能、加分项、经验要求 |
| 简历解析 | 提取候选人技能、项目经历、学历、风险点 |
| 混合召回 | 结合关键词分数和向量相似度进行召回 |
| 硬性筛选 | 校验经验、技能、学历等硬性要求 |
| 检索增强 | 从知识库检索相关规则与面试资料 |
| 匹配分析 | 生成匹配理由、风险提示、面试重点 |
| 报告输出 | 生成筛选报告与反馈总结 |

## 📁 项目结构

```text
Enterprise-Recruitment-Management-System/
├─ ai/
│  ├─ backend/                # FastAPI 后端服务
│  │  ├─ app/                 # 核心业务代码
│  │  ├─ sample_data/         # 示例数据
│  │  ├─ scripts/             # 辅助脚本
│  │  └─ tests/               # 后端测试
│  ├─ frontend/               # Next.js 前端应用
│  ├─ docs/                   # 架构与部署文档
│  ├─ infra/                  # 基础设施相关文件
│  ├─ docker-compose.yml      # Docker 编排文件
│  ├─ .env.example            # 后端环境变量模板
│  └─ README.md               # 项目详细说明
├─ CONTRIBUTING.md
├─ LICENSE
└─ README.md
```

## 🚀 快速开始

### 1. 配置环境变量

复制后端环境变量模板：

```powershell
cd ai
copy .env.example .env
```

前端环境变量模板：

```powershell
cd frontend
copy .env.example .env.local
```

### 2. 启动后端服务

```powershell
cd "C:\Users\Administrator\Desktop\ai agent\ai"
.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --port 8001
```

接口地址：

```text
http://127.0.0.1:8001/docs
```

### 3. 启动前端应用

```powershell
cd "C:\Users\Administrator\Desktop\ai agent\ai\frontend"
npm install
npm run dev
```

访问地址：

```text
http://127.0.0.1:3000
```

## ⚙️ 环境变量说明

| 变量 | 说明 |
| --- | --- |
| LLM_PROVIDER | 模型提供方：mock / openai / dify |
| EMBEDDING_PROVIDER | 向量模型提供方 |
| OPENAI_API_KEY | OpenAI API Key |
| OPENAI_MODEL | OpenAI 模型名称 |
| EMBEDDING_MODEL | 向量模型名称 |
| DIFY_API_BASE | Dify 服务地址 |
| DIFY_API_KEY | Dify 默认 Key |
| CORS_ORIGINS | 允许访问的前端地址 |

## 📊 检索策略

当前候选人排序采用混合召回：

```text
final_score = 0.4 * lexical_score + 0.6 * vector_score
```

设计目标：

- 提高召回率
- 控制误召回
- 结合规则与模型判断
- 用知识库约束输出质量

## 🧪 测试与校验

### 后端测试

```powershell
cd "C:\Users\Administrator\Desktop\ai agent\ai"
.venv\Scripts\python.exe -m pytest backend\tests -q
```

### 前端构建

```powershell
cd "C:\Users\Administrator\Desktop\ai agent\ai\frontend"
npm run build
```

## 🐳 Docker 部署

```powershell
cd "C:\Users\Administrator\Desktop\ai agent\ai"
docker compose up --build
```

## 📚 相关文档

- 项目详细说明：`ai/README.md`
- 架构文档：`ai/docs/architecture.md`
- 部署文档：`ai/docs/deployment.md`

## 🛠️ 技术栈

- FastAPI
- SQLAlchemy
- Next.js
- React
- TypeScript
- Docker
- RAG
- OpenAI / Dify API
