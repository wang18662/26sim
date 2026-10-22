import express from 'express'
import cors from 'cors'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 读取 .env（若存在）
try {
  const envPath = join(__dirname, '.env')
  const envRaw = readFileSync(envPath, 'utf8')
  for (const line of envRaw.split('\n')) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {}

const PORT = process.env.PORT || 3001
const API_KEY = process.env.DEEPSEEK_API_KEY || ''
const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'
const MOCK = !API_KEY || process.env.MOCK === 'true'

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mock: MOCK, model: MODEL })
})

// 模拟模式：无 Key 时返回可测试脚本，保证 UI 全流程可跑
function mockResponse(messages) {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || ''
  const isFirstScene = /第一幕|直接进入|请开始|开始游戏|接管/.test(lastUser)

  if (isFirstScene) {
    return `🟤 第一幕｜合租房·傍晚

你推开 502 室那扇掉了漆的防盗门，玄关地上堆着两双陌生尺码的鞋。客厅里飘出方便面的味道，电视开着但没人看。

🟢 场景加载

墙上贴着一张泛黄的合租公约，最后一条被人用红笔划掉又改写：「电费平摊，谁赖账谁滚。」

你放下行李，手机震了一下——房东发来消息：「小友，房租下周一前转到老地方，别又忘。」

⚪ 当前状态

时间：201X年X月X日 19:42 地点：城西老小区·502合租房 现金：¥820 银行卡：¥7,180 债务：¥0 房租：3天后到期

你可以：
下楼买瓶水
回房东消息
翻翻合租公约
自由行动`
  }

  return `🟡 模拟模式

（当前为离线 mock 响应，未配置 DeepSeek API Key。配置 Key 后将由模型实时生成世界。）

你刚才的做法被记下了。世界继续按当前状态推进——但更真实的变化，需要接上模型。

⚪ 当前状态

时间：201X年X月X日 20:05 地点：502合租房 现金：¥820 银行卡：¥7,180 债务：¥0 房租：3天后到期

你可以：
自由行动`
}

app.post('/api/chat', async (req, res) => {
  const { messages, model } = req.body || {}
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages required' })
  }

  // 模拟模式
  if (MOCK) {
    const text = mockResponse(messages)
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    const payload = { choices: [{ delta: { content: text }, index: 0 }] }
    res.write(`data: ${JSON.stringify(payload)}\n\n`)
    res.write(`data: [DONE]\n\n`)
    return res.end()
  }

  try {
    const upstream = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: model || MODEL,
        messages,
        stream: true,
        temperature: 0.9,
        max_tokens: 2000,
      }),
    })

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => '')
      return res.status(502).json({ error: 'upstream error', detail: errText })
    }

    // 透传 DeepSeek 的 SSE 流
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      res.write(chunk)
    }
    res.end()
  } catch (e) {
    console.error('[chat] error', e)
    res.status(500).json({ error: String(e) })
  }
})

// 生产环境托管前端构建产物
const dist = join(__dirname, '..', 'frontend', 'dist')
try {
  readFileSync(join(dist, 'index.html'))
  app.use(express.static(dist))
  app.get('*', (_req, res) => res.sendFile(join(dist, 'index.html')))
  console.log('[serve] 托管前端 dist 成功')
} catch {
  console.log('[serve] 未检测到 frontend/dist，仅运行 API（开发模式由 Vite 提供前端）')
}

app.listen(PORT, () => {
  console.log(`26sim server on http://localhost:${PORT}  (mock=${MOCK}, model=${MODEL})`)
})
