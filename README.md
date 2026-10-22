# 26岁·真彩世界模拟器 V2.1（Web 版）

基于《我的26岁女房客》沉浸式世界模拟提示词的**可复现独立网页游戏**。  
前端 React + Vite + TypeScript，后端 Express 代理 DeepSeek（密钥仅存服务端），支持流式叙事、HUD 状态卡、存档/读档。

---

## 1. 功能

- 完整阶段机：体验模式 → 时间入口 → 身份选择 → 原创人物创建 → 第一幕
- 三种体验模式：🟢 爽玩 / 🔵 沉浸 / 🔴 硬核
- 四类身份：A 昭阳 / B 原著角色 / C 原创房客（推荐）/ D 城市普通人 / E 自定义
- 流式叙事（SSE），实时逐字生成
- ⚪ 当前状态 HUD 自动解析（时间/地点/现金/银行卡/债务/房租/身体/工资）
- 存档 / 读档：导出 JSON，可在新会话完整复现世界
- 无 API Key 时自动进入 **mock 模式**，可离线验证全流程 UI

---

## 2. 运行

### 2.1 后端（代理 DeepSeek）

```bash
cd server
# 仅首次部署需要：复制模板再填入 Key
# ⚠️ 若 .env 已存在（已含 Key），切勿重复执行下面这行，否则会覆盖掉你的 Key
cp .env.example .env      # 仅在还没有 .env 时执行
npm install
npm start                # 默认 http://localhost:3001
```

`.env` 字段：

| 字段 | 说明 |
|---|---|
| `DEEPSEEK_API_KEY` | DeepSeek 后台申请的 Key（必填，否则走 mock） |
| `DEEPSEEK_BASE_URL` | 默认 `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | 默认 `deepseek-chat` |
| `PORT` | 后端端口，默认 `3001` |
| `MOCK` | 设为 `true` 可强制离线模拟（无需 Key） |

> 没有 Key 也能跑：不填 Key 启动即自动 mock，用于测试 UI 与流程。

### 2.2 前端（开发模式 / HMR 热更新）

当你要**改界面、调样式、加功能**时用这个模式（只玩的话用 2.1 后端的 `http://localhost:3001` 就够了，无需开 dev）。

```bash
cd frontend
npm install
npm run dev             # 默认 http://localhost:5173
```

要点：

- **热更新（HMR）**：Vite 启动后，修改 `src/` 下任意文件会**自动刷新浏览器**，无需手动重启 dev 服务。
- **必须同时跑后端**：dev 模式前端只是壳，真正的剧情推演在后端的 `3001`。请另开一个终端先 `npm start` 后端（见 2.1），再开 dev。
- **API 代理已配好**：Vite 把 `/api` 自动代理到 `http://localhost:3001`，所以浏览器直接访问 `http://localhost:5173` 就能连上后端，不会跨域。
- **停止**：在 dev 终端按 `Ctrl + C` 关闭。

> 典型开发工作流：终端A 跑 `server/npm start`（保持常驻），终端B 跑 `frontend/npm run dev`（改代码看效果），浏览器开 5173。

### 2.3 生产构建

```bash
cd frontend
npm run build           # 产物在 frontend/dist
```

构建后，后端会自动托管 `frontend/dist`：直接 `npm start` 后端，访问 `http://localhost:3001` 即可。

---

## 3. 项目结构

```
26sim/
├── server/                # Express 代理 + mock
│   ├── index.js           # /api/chat 流式透传 DeepSeek；无 Key 走 mock；生产托管 dist
│   ├── .env.example
│   └── package.json
└── frontend/             # React + Vite + TS
    ├── src/
    │   ├── App.tsx        # 顶栏 + 阶段机路由 + 存档/读档
    │   ├── store.ts       # zustand：消息、HUD 解析、流式编排、存档
    │   ├── types.ts
    │   ├── game/
    │   │   ├── prompt.ts          # 从 .txt?raw 导入系统提示词
    │   │   ├── systemPrompt.txt   # 完整 V2.1 提示词（原样保存）
    │   │   └── api.ts             # SSE 流式读取
    │   └── components/
    │       ├── ModeSelect / TimeEntry / IdentitySelect / CharCreate
    │       └── GameScreen / Hud / NarrativeLog / ActionBar
    └── package.json
```

---

## 4. 存档格式（save JSON）

点顶部「存档」导出 JSON，结构如下（与提示词 V2.1 存档协议对齐，并额外保存对话历史以复现）：

```jsonc
{
  "version": "26sim-v2.1",
  "systemPrompt": "完整 V2.1 提示词文本",
  "mode": "fun | immersive | hardcore | null",
  "timeEntry": "early | mid | late | custom | null",
  "timeCustom": "自定义时间点文本",
  "identity": "A | B | C | D | E | null",
  "identityNote": "B/E 补充的身份说明",
  "character": {
    "name": "", "age": "", "gender": "",
    "job": "", "economy": "", "background": ""
  },
  "messages": [ { "role": "user|assistant", "content": "..." } ],
  "hud": { "时间": "...", "现金": "..." },
  "worldLineOffset": "低 | 已偏移",
  "savedAt": "ISO 时间"
}
```

读档：顶部「读档」选择该 JSON，会**直接恢复到当前世界状态继续游玩**，不会重新进入模式选择，也不会被原著默认剧情覆盖。

---

## 5. 已知边界

- 世界记忆依赖对话历史随请求发送；超长剧情建议定期存档。
- HUD 仅在模型按 `⚪ 当前状态` 格式输出时解析；格式不符则不显示（属正常）。
- mock 模式返回脚本化文本，仅用于 UI 验证，不是真实世界推演。
