# 智能招聘助手（AI Recruiting Assistant）

这是一个可以写进简历、也可以直接演示给面试官或客户看的 **AI 智能招聘助手**。

它不是单纯的聊天机器人，而是把真实招聘流程拆成了几个可落地环节：

- 岗位信息录入与结构化解析
- 候选人简历解析与入库
- 知识库检索（RAG）
- 候选人召回与排序
- 筛选报告生成
- 面试问题建议
- 面试反馈总结
- 前后端完整界面
- 后续可 Docker 部署到云服务器

---

## 1. 项目适合怎么写进简历

你可以直接改成下面这种表述：

> 独立完成智能招聘助手项目，基于 FastAPI + Next.js 搭建前后端，接入 OpenAI / Dify 大模型 API，实现岗位解析、简历解析、RAG 检索增强、候选人混合召回、筛选报告生成与面试反馈总结，并支持本地演示与 Docker 部署。

更技术一点的写法：

> 设计并实现 AI Recruiting Assistant，封装 OpenAI / Dify / Mock 多模型适配层，构建关键词召回 + 向量检索的 Hybrid Recall 与 RAG 链路，支持结构化输出、检索评测与全栈页面展示。

---

## 2. 这个项目解决什么问题

招聘场景里常见几个痛点：

1. JD 很长，信息不统一，HR 不好快速抓重点
2. 简历很多，人工初筛很费时间
3. 只看关键词容易漏人，只看语义又容易误召回
4. 面试反馈容易写得不规范，不利于复盘

所以这个系统做的事情是：

- 先把岗位和简历都转成结构化数据
- 再用 **关键词 + 向量** 的方式做召回
- 再结合 **RAG 知识库** 给出更稳的筛选分析
- 最后生成面试建议和反馈总结

---

## 3. 当前已实现的核心功能

### 后端能力
- `POST /api/jobs`：新增岗位并解析岗位要求
- `POST /api/candidates/text`：录入候选人简历文本
- `POST /api/candidates/upload`：上传简历文件
- `POST /api/knowledge`：导入知识库内容
- `POST /api/jobs/{job_id}/recall`：对某个岗位召回候选人
- `POST /api/screenings`：生成候选人筛选报告
- `POST /api/screenings/{screening_id}/feedback`：生成反馈总结
- `GET /api/evals/retrieval`：查看召回评测指标

### 前端页面
- 首页总览
- 岗位管理
- 候选人管理
- 知识库管理
- 筛选报告
- 评测页面

### 模型接入方式
- `mock`：本地无 key 也能完整跑通
- `openai`：真实 OpenAI 大模型 + 真实 embedding
- `dify`：真实 Dify Workflow API + 可独立配置 embedding

---

## 4. 技术栈

### 后端
- FastAPI
- SQLAlchemy
- Pydantic
- OpenAI SDK
- httpx
- NumPy
- SQLite / PostgreSQL

### 前端
- Next.js
- React
- TypeScript

### 部署
- Docker
- Docker Compose

---

## 5. 项目结构

```text
ai/
├─ backend/
│  ├─ app/
│  │  ├─ config.py
│  │  ├─ db.py
│  │  ├─ evals.py
│  │  ├─ llm.py
│  │  ├─ main.py
│  │  ├─ rag.py
│  │  ├─ schemas.py
│  │  └─ services/
│  ├─ sample_data/
│  ├─ scripts/
│  └─ tests/
├─ frontend/
├─ infra/
├─ .env
├─ .env.example
└─ README.md
```

---

## 6. 本地启动

### 6.1 启动后端

```powershell
cd "C:\Users\Administrator\Desktop\ai agent\ai"
.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload
```

启动后访问：

- 健康检查：`http://127.0.0.1:8000/api/health`
- 接口文档：`http://127.0.0.1:8000/docs`

### 6.2 启动前端

```powershell
cd "C:\Users\Administrator\Desktop\ai agent\ai\frontend"
npm run dev
```

前端地址：

- `http://127.0.0.1:3000`

---

## 7. 演示数据

导入示例数据：

```powershell
cd "C:\Users\Administrator\Desktop\ai agent\ai"
.venv\Scripts\python.exe backend\scripts\seed_demo.py
```

示例文件在：

- `backend/sample_data/job_ai_engineer.txt`
- `backend/sample_data/resume_candidate_zhangsan.txt`
- `backend/sample_data/knowledge_interview_guide.txt`
- `backend/sample_data/knowledge_hiring_playbook.txt`
- `backend/sample_data/knowledge_rag_quality.txt`

---

## 8. 已升级为“真实大模型版”

这次升级后，项目已经不再只是 mock 演示链路，而是支持真实模型调用。

### 升级点 1：OpenAI 模式不再假装成功

如果你设置：

```env
LLM_PROVIDER=openai
```

但没有配置 `OPENAI_API_KEY`，系统现在会 **直接报错**，而不是悄悄退回 mock。

这样更像真实项目，避免你以为自己在调用真模型，实际上跑的是本地假数据。

### 升级点 2：Dify 走真实 Workflow API

Dify 现在按真实工作流方式调用：

- 请求地址：`POST /workflows/run`
- 每个任务都可以配置独立 API Key
- 也支持共用一个 `DIFY_API_KEY`

支持的任务包括：

- 岗位解析
- 简历解析
- 匹配分析
- 面试计划生成
- 反馈总结

### 升级点 3：RAG 的 embedding 可以独立配置

以前如果切到 Dify，RAG 向量检索可能还是 mock embedding。

现在可以独立指定：

```env
EMBEDDING_PROVIDER=openai
```

也就是说：

- **LLM 可以走 Dify**
- **Embedding 可以走 OpenAI**

这样更接近真实企业里的拆分架构。

---

## 9. 环境变量说明

### 9.1 默认演示模式

```env
LLM_PROVIDER=mock
EMBEDDING_PROVIDER=auto
```

适合：
- 本地先跑通
- 没有 key 也能演示
- 网络不稳定时先验证前后端流程

### 9.2 OpenAI 真实模式

把 `.env` 改成：

```env
LLM_PROVIDER=openai
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-5.4-mini
EMBEDDING_MODEL=text-embedding-3-small
```

说明：
- 岗位解析、简历解析、匹配分析、面试建议、反馈总结都走 OpenAI
- RAG 向量检索也走 OpenAI embedding
- 这是最完整的“真实大模型版”配置

### 9.3 Dify 真实模式

把 `.env` 改成：

```env
LLM_PROVIDER=dify
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
EMBEDDING_MODEL=text-embedding-3-small
DIFY_API_BASE=https://your-dify-domain/v1
DIFY_API_KEY=your_default_dify_key
DIFY_JOB_API_KEY=
DIFY_RESUME_API_KEY=
DIFY_MATCH_API_KEY=
DIFY_INTERVIEW_API_KEY=
DIFY_FEEDBACK_API_KEY=
```

说明：
- LLM 工作流走 Dify
- RAG embedding 走 OpenAI
- 如果 5 个任务都用同一个 Dify Workflow App Key，只填 `DIFY_API_KEY` 即可
- 如果你给不同任务分了不同 Workflow，也可以分别填 5 个 key

### 9.4 什么时候要重建向量数据

如果你已经用 mock embedding 导入过候选人或知识库，之后又切换成 OpenAI embedding，建议：

1. 清空旧数据库，或
2. 重新执行候选人入库 / 知识库导入 / seed 脚本

原因很简单：
- 旧向量和新向量不是同一种空间
- 混着用会影响召回准确率

---

## 10. 这个系统怎么筛选候选人

这个系统不是只靠一句 prompt 来筛人，而是分成 4 步：

### 第 1 步：岗位和简历结构化

先把 JD 和简历分别解析成结构化信息，比如：

- 岗位名称
- 必备技能
- 加分项技能
- 工作年限
- 候选人技能
- 项目经历
- 风险点

### 第 2 步：混合召回（Hybrid Recall）

候选人排序时不是只看一种分数，而是同时看两种：

1. **关键词重叠分数 lexical score**
2. **向量相似度分数 vector score**

当前候选人召回分数公式：

```text
final_score = 0.4 * lexical_score + 0.6 * vector_score
```

这样做的好处是：

- 只看关键词：容易漏掉同义表达
- 只看向量：容易召回“语义接近但岗位不对”的人
- 两者结合：召回率和准确率更平衡

### 第 3 步：硬性筛选（Hard Screen）

召回之后，还会检查：

- 工作年限是否达标
- 必备技能是否命中
- 学历是否满足要求

这一步的作用是把明显不合格的人先筛掉，避免纯模型判断太飘。

### 第 4 步：RAG + 大模型分析

系统会从知识库里检索相关内容，例如：

- 招聘标准
- 面试规范
- 业务岗位要求
- 内部筛选 playbook

再把这些上下文和候选人信息一起交给大模型，生成：

- 匹配理由
- 风险提示
- 面试重点
- 最终建议

---

## 11. 如何兼顾召回率和准确率

这是这个项目最适合面试时讲的地方。

### 为了提高召回率
- 用向量检索补关键词检索的短板
- 结构化提取岗位关键词，避免 query 太弱
- RAG 检索更多相关知识辅助判断

### 为了提高准确率
- 加入硬性筛选规则
- 混合打分而不是单一向量排序
- 用知识库约束大模型输出
- 生成结构化结果，减少模型胡说

你面试时可以这样讲：

> 我没有把候选人筛选完全交给大模型，而是做成“规则 + 检索 + 大模型”的组合链路，这样能更好平衡召回率和准确率，也更符合真实业务系统的设计方式。

---

## 12. 检索评测

项目提供：

- Recall@1
- Recall@3
- Recall@5
- Precision@3
- MRR

接口：

```text
GET /api/evals/retrieval
```

当前默认是开发态的 heuristic benchmark，适合做本地验证和版本回归。

后续如果你要继续升级，可以加：

- 人工标注数据集
- rerank 模型对照实验
- pgvector / Elasticsearch
- 历史招聘数据评测

---

## 13. 测试与校验

### 后端测试

```powershell
cd "C:\Users\Administrator\Desktop\ai agent\ai"
.venv\Scripts\python.exe -m pytest backend\tests -q
```

### 前端构建校验

```powershell
cd "C:\Users\Administrator\Desktop\ai agent\ai\frontend"
npm run build
```

---

## 14. Docker 和云端部署

本地如果 C 盘紧张，可以先不在本机装 Docker，直接后面放到服务器上部署。

推荐方式：

### 方案 A：云服务器 + Docker Compose
适合：
- 简历项目
- 演示项目
- 小流量业务验证

### 方案 B：前后端分离部署
适合：
- 前端部署到 Vercel
- 后端部署到云主机或容器平台
- 数据库用托管 PostgreSQL

---

## 15. 后续还可以继续增强

如果你还想把这个项目继续打磨成更强的作品，建议按这个顺序升级：

1. 增加登录与权限管理
2. 增加候选人操作日志和审计链路
3. 接入 pgvector 或 ES
4. 增加 rerank 模型
5. 增加异步任务队列
6. 支持云端对象存储
7. 增加真实标注评测集

---

## 16. 当前状态

- [x] 前后端完整可运行
- [x] RAG 检索链路可运行
- [x] OpenAI 真实模型模式
- [x] Dify 真实工作流模式
- [x] Embedding 独立配置
- [x] 检索评测页面
- [x] 本地 Demo 数据
- [x] 后端测试通过
- [ ] Docker 云端实机部署待你上服务器后执行

如果你愿意，下一步我可以继续直接帮你做这两件事里的任意一个：

1. **把 `.env` 直接改成 OpenAI 或 Dify 实战配置**
2. **继续给你补“云服务器部署版 Docker 文档 + 一键部署脚本”**

## 17. DeepSeek 接入示例

如果你使用的是 DeepSeek 官方 API，可以这样配置：

```env
LLM_PROVIDER=openai
EMBEDDING_PROVIDER=mock
OPENAI_API_KEY=你的DeepSeekKey
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_MODEL=deepseek-v4-flash
```

说明：
- 这里沿用了项目里的 `openai` 适配层，但实际请求会发往 `OPENAI_BASE_URL`
- 为了兼容 DeepSeek，项目在配置了 `OPENAI_BASE_URL` 后会自动改走更通用的 `chat.completions` JSON 输出模式
- 当前默认把 `EMBEDDING_PROVIDER` 设为 `mock`，避免把 DeepSeek key 错用于 embedding 接口
- 如果你后面有单独可用的 embedding 服务，再单独补 embedding 配置即可
