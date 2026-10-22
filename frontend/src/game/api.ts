import type { ChatMessage } from '../types'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// 以 SSE 方式流式读取 /api/chat 的返回（服务端透传 DeepSeek 的 event-stream）。
// 每次 yield 一个增量文本片段，供 UI 实时渲染。
// 「请求发起阶段」失败（网络错误 / 5xx / 429）自动重试，最多 3 次、退避 800ms 递增；
// 一旦开始流式返回，中断则抛给调用方（由调用方决定是否保留已生成内容）。
export async function* streamChat(
  messages: ChatMessage[],
  opts?: { signal?: AbortSignal }
): AsyncGenerator<string> {
  const MAX_ATTEMPTS = 3
  let res: Response | undefined

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let r: Response
    try {
      r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
        signal: opts?.signal,
      })
    } catch (e) {
      // 纯网络错误（fetch 抛错）：可重试；主动取消（AbortSignal）则立即抛
      if (opts?.signal?.aborted) throw e
      if (attempt === MAX_ATTEMPTS) throw e
      await sleep(800 * attempt)
      continue
    }

    if (!r.ok) {
      const status = r.status
      let detail = ''
      try {
        detail = await r.text()
      } catch {}
      // 5xx / 429（服务端暂时不可用）可重试；4xx 客户端错误重试无意义，直接抛
      const retryable = (status >= 500 || status === 429) && attempt < MAX_ATTEMPTS
      if (retryable) {
        await sleep(800 * attempt)
        continue
      }
      throw new Error(`API ${status}: ${detail}`)
    }

    res = r
    break
  }

  // 到这里 res 必然已赋值（否则上面已 throw）
  const reader = res!.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let nl: number
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nl).trim()
      buffer = buffer.slice(nl + 1)
      if (!line.startsWith('data:')) continue
      const data = line.slice(5).trim()
      if (data === '[DONE]') continue
      try {
        const json = JSON.parse(data)
        const delta =
          json.choices?.[0]?.delta?.content ||
          json.choices?.[0]?.message?.content ||
          ''
        if (delta) yield delta
      } catch {
        // 跳过不完整/非 JSON 行
      }
    }
  }

  // 处理缓冲区剩余内容
  const rest = buffer.trim()
  if (rest.startsWith('data:')) {
    const data = rest.slice(5).trim()
    if (data && data !== '[DONE]') {
      try {
        const json = JSON.parse(data)
        const delta =
          json.choices?.[0]?.delta?.content ||
          json.choices?.[0]?.message?.content ||
          ''
        if (delta) yield delta
      } catch {}
    }
  }
}
