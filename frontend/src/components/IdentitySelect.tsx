import { useState } from 'react'
import { useGame } from '../store'

export default function IdentitySelect() {
  const setIdentity = useGame((s) => s.setIdentity)
  const startGame = useGame((s) => s.startGame)
  const [note, setNote] = useState('')

  const opts = [
    { key: 'A' as const, title: 'A｜昭阳', desc: '接管昭阳，继承进入时间点前已真实发生的经历、关系、财务、工作、承诺与冲突。未来完全由你决定。' },
    { key: 'B' as const, title: 'B｜原著已有角色', desc: '指定一个合理的原著人物，进入其当时真实拥有的身份、资源、关系与限制。', needNote: '填写你想接管的人物（如「米彩」「韦蔓雯」）' },
    { key: 'C' as const, title: 'C｜原创房客｜推荐', desc: '没有主角光环、没有后台全知，但拥有最大自由度。' },
    { key: 'D' as const, title: 'D｜城市普通年轻人', desc: '可能有工作也可能失业，可能认识原著人物也可能谁都不认识，需靠现实路径进入关系网。' },
    { key: 'E' as const, title: 'E｜自定义合理身份', desc: '自由描述你想成为的人。', needNote: '描述你的自定义身份' },
  ]

  const choose = (key: 'A' | 'B' | 'C' | 'D' | 'E', needNote?: string) => {
    if (needNote) {
      if (!note.trim()) {
        alert(needNote)
        return
      }
      setIdentity(key, note.trim())
      startGame()
    } else if (key === 'A') {
      setIdentity('A')
      startGame()
    } else {
      setIdentity(key)
    }
  }

  return (
    <div className="screen">
      <div className="screen-head">
        <div className="node">🟣 选择身份</div>
      </div>

      <div className="cards">
        {opts.map((o) => (
          <button key={o.key} className="card" onClick={() => choose(o.key, o.needNote)}>
            <div className="card-title">{o.title}</div>
            <div className="card-desc">{o.desc}</div>
          </button>
        ))}
      </div>

      <input
        className="input"
        placeholder="B / E 需要补充：你想接管的原著人物 或 自定义身份描述"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
    </div>
  )
}
