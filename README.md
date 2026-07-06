# 🧑‍💼 企业招聘管理系统

作者：1545238852-cmyk  
仓库地址：https://github.com/1545238852-cmyk/Enterprise-Recruitment-Management-System

> 面向企业招聘流程的全栈 ATS 项目，覆盖岗位管理、候选人管理、检索增强、候选人召回、筛选报告与评估看板。

---

## 📌 项目概览

这是一个基于 **FastAPI + Next.js + RAG + LLM API** 的企业招聘管理系统。项目以真实招聘流程为核心，支持岗位录入、候选人简历解析、知识库导入、混合召回、筛选报告生成和检索评估展示。

### 适用场景

- 企业内部招聘管理
- 招聘流程演示与作品集展示
- RAG / Agent / 检索增强类项目实践
- 全栈项目简历展示

### 项目目标

- 用结构化方式管理岗位与候选人
- 用检索增强提高筛选质量
- 用规则 + 检索 + 大模型组合实现候选人分析
- 用前后端完整页面承载业务流程

---

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
数据存储：SQLite / PostgreSQL
部署方式：本地运行 / Docker Compose
```

---

## ✨ 核心功能

- 岗位录入与结构化解析
- 候选人文本录入与文件上传
- 知识库导入与 RAG 检索增强
- 混合召回与候选人排序
- 硬性条件筛选与匹配分析
- 筛选报告与反馈总结
- 检索评估与指标展示
- 前后端分离部署

### 功能模块说明

| 模块 | 说明 |
| --- | --- |
| 岗位管理 | 新增岗位、解析岗位要求、展示岗位详情 |
| 候选人管理 | 文本录入、文件上传、候选人详情查看、删除 |
| 资料库 | 导入岗位标准、面试说明、流程文件等资料 |
| 推荐结果 | 基于岗位召回候选人并输出排序结果 |
| 筛选记录 | 查看筛选报告、反馈总结与匹配分析 |
| 评估报表 | 展示召回率、准确率、排序指标 |

---

## 🧠 候选人筛选流程

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

---

## 📊 检索策略

当前候选人排序采用混合召回：

```text
final_score = 0.4 * lexical_score + 0.6 * vector_score
```

### 设计思路

- 关键词召回负责保障明确技能命中
- 向量召回负责覆盖语义相近表达
- 硬性筛选负责拦截明显不符合要求的候选人
- 知识库检索负责补充岗位规则与面试标准
- 大模型负责生成结构化分析与总结

### 目标

- 提高召回率
- 控制误召回
- 降低纯 Prompt 筛选的不稳定性
- 提高输出结果的业务可解释性

---

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

---

## 🚀 快速开始

### 1. 配置环境变量

复制后端环境变量模板：

```powershell
cd ai
copy .env.example .env
```

复制前端环境变量模板：

```powershell
cd frontend
copy .env.example .env.local
```

### 2. 启动后端服务

```powershell
cd "C:\Users\Administrator\Desktop\ai agent\ai"
.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --port 8001
```

接口文档：

```text
http://127.0.0.1:8001/docs
```

### 3. 启动前端应用

```powershell
cd "C:\Users\Administrator\Desktop\ai agent\ai\frontend"
npm install
npm run dev
```

前端访问地址：

```text
http://127.0.0.1:3000
```

---

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

### 推荐模式

#### 本地演示模式

```env
LLM_PROVIDER=mock
EMBEDDING_PROVIDER=auto
```

#### 真实 OpenAI 模式

```env
LLM_PROVIDER=openai
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-5.4-mini
EMBEDDING_MODEL=text-embedding-3-small
```

#### Dify + OpenAI Embedding 模式

```env
LLM_PROVIDER=dify
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
DIFY_API_BASE=https://your-dify-domain/v1
DIFY_API_KEY=your_default_dify_key
```

---

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

---

## 🐳 部署方式

### Docker Compose

```powershell
cd "C:\Users\Administrator\Desktop\ai agent\ai"
docker compose up --build
```

### 部署建议

- 本地开发：SQLite + Mock / OpenAI
- 演示环境：Docker Compose
- 云服务器：PostgreSQL + Docker
- 模型接入：OpenAI / Dify

---

## 📚 相关文档

- 项目详细说明：`ai/README.md`
- 架构文档：`ai/docs/architecture.md`
- 部署文档：`ai/docs/deployment.md`

---

## 🛠️ 技术栈

### 后端
- FastAPI
- SQLAlchemy
- Pydantic Settings
- OpenAI SDK
- NumPy

### 前端
- Next.js
- React
- TypeScript

### 检索与模型
- RAG
- Hybrid Recall
- OpenAI API
- Dify Workflow API

### 部署
- Docker
- Docker Compose
- SQLite / PostgreSQL

---

## 📎 项目亮点

- 具备完整前后端页面与业务流程
- 支持真实大模型与检索增强接入
- 支持规则 + 检索 + 模型的组合筛选链路
- 支持评估指标展示，适合简历与面试展示
- 仓库结构清晰，可继续扩展为生产化项目
