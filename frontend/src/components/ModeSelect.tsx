import { useGame } from '../store'

export default function ModeSelect() {
  const setMode = useGame((s) => s.setMode)

  const cards = [
    {
      color: '🟢',
      key: 'fun' as const,
      title: '① 爽玩 · 推荐',
      desc: '机会更多，反馈更快，少走无意义弯路。世界会给聪明计划真实回报。但人物不会无脑舔你，代价、误判和失败仍然存在。',
    },
    {
      color: '🔵',
      key: 'immersive' as const,
      title: '② 沉浸',
      desc: '愿望与世界约束保持平衡。机会、关系、资源、时间与风险，按照当前世界自然发展。',
    },
    {
      color: '🔴',
      key: 'hardcore' as const,
      title: '③ 硬核',
      desc: '身份、信息、现金流、时间、交通、组织权限和身体状态更加严格。世界不会主动照顾玩家。',
    },
  ]

  return (
    <div className="screen">
      <div className="screen-head">
        <div className="node">🟤 26岁</div>
        <blockquote>这一次，原著只是过去。你进去以后真正做过的事情，会留下来。</blockquote>
      </div>

      <div className="cards">
        {cards.map((c) => (
          <button key={c.key} className="card" onClick={() => setMode(c.key)}>
            <div className="card-title">
              <span>{c.color}</span> {c.title}
            </div>
            <div className="card-desc">{c.desc}</div>
          </button>
        ))}
      </div>

      <div className="hint">回复 1 / 2 / 3 选模式；或点「随便」用 🟢 爽玩默认开局。</div>
      <button className="btn-default" onClick={() => setMode('fun')}>
        随便 / 默认 → 爽玩
      </button>
    </div>
  )
}
