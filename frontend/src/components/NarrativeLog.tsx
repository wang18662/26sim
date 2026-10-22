import { useEffect, useRef } from 'react'
import { useGame } from '../store'

export default function NarrativeLog() {
  const messages = useGame((s) => s.messages)
  const streaming = useGame((s) => s.streaming)
  const loading = useGame((s) => s.loading)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  return (
    <div className="log">
      {messages.map((m, i) => (
        <div key={i} className={`msg ${m.role === 'user' ? 'player' : 'story'}`}>
          {m.role === 'user' ? <span className="who">你</span> : null}
          <div className="bubble">{m.content}</div>
        </div>
      ))}

      {loading && streaming && (
        <div className="msg story">
          <div className="bubble streaming">{streaming}</div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  )
}
