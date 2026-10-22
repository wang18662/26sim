import { useMemo, useState } from 'react'
import { useGame } from '../store'

// 从最后一条助手文本里提取「你可以：」后的建议动作
function parseActions(text: string): string[] {
  const idx = text.lastIndexOf('你可以：')
  if (idx < 0) return []
  const block = text.slice(idx + 4)
  const lines = block.split('\n').map((l) => l.replace(/^[\s\d.、\-·]+/, '').trim())
  return lines.filter((l) => l && !l.startsWith('自由行动')).slice(0, 4)
}

export default function ActionBar() {
  const sendInput = useGame((s) => s.sendInput)
  const loading = useGame((s) => s.loading)
  const messages = useGame((s) => s.messages)
  const [text, setText] = useState('')

  const suggestions = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.role === 'assistant')
    return last ? parseActions(last.content) : []
  }, [messages])

  const send = (value: string) => {
    if (!value.trim() || loading) return
    setText('')
    sendInput(value)
  }

  return (
    <div className="actionbar">
      {suggestions.length > 0 && (
        <div className="chips">
          {suggestions.map((s, i) => (
            <button key={i} className="chip" disabled={loading} onClick={() => send(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="input-row">
        <input
          className="input"
          placeholder={loading ? '世界正在推进…' : '做点什么，或自由输入'}
          value={text}
          disabled={loading}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send(text)
          }}
        />
        <button className="btn-default" disabled={loading || !text.trim()} onClick={() => send(text)}>
          行动
        </button>
      </div>
      <div className="hint">始终可自由输入；说「保存 / 存档」也会在顶部生成存档文件。</div>
    </div>
  )
}
