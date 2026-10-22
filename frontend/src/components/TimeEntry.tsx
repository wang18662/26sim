import { useState } from 'react'
import { useGame } from '../store'

export default function TimeEntry() {
  const setTime = useGame((s) => s.setTime)
  const [custom, setCustom] = useState('')

  const opts = [
    { key: 'early' as const, title: '① 原著前期｜推荐', desc: '大量关键关系尚未彻底定型，你拥有最大的世界线改变空间。' },
    { key: 'mid' as const, title: '② 原著中期', desc: '一部分关系已经形成，一些话已说过、一些事已发生。你无法删除过去，只能改变未来。' },
    { key: 'late' as const, title: '③ 原著后期', desc: '大量事件已成既定事实，改变未来更困难，但并非不可能。' },
    { key: 'custom' as const, title: '④ 自定义时间点', desc: '允许你描述进入阶段。' },
  ]

  return (
    <div className="screen">
      <div className="screen-head">
        <div className="node">🟤 选择你踏进这段人生的时间</div>
      </div>

      <div className="cards">
        {opts.map((o) => (
          <button
            key={o.key}
            className="card"
            onClick={() => (o.key === 'custom' ? null : setTime(o.key))}
          >
            <div className="card-title">{o.title}</div>
            <div className="card-desc">{o.desc}</div>
          </button>
        ))}
      </div>

      <textarea
        className="input"
        placeholder="④ 自定义：描述你想进入的时间点（如「昭阳刚搬进502那天」）"
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
      />
      <button
        className="btn-default"
        disabled={!custom.trim()}
        onClick={() => setTime('custom', custom.trim())}
      >
        用自定义时间点进入
      </button>
    </div>
  )
}
