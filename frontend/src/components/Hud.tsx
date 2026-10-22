import { useGame } from '../store'

const LABELS: Record<string, string> = {
  时间: '时间',
  地点: '地点',
  现金: '现金',
  银行卡: '银行卡',
  债务: '债务',
  房租: '房租',
  身体: '身体',
  工资: '工资',
}

export default function Hud() {
  const hud = useGame((s) => s.hud)
  if (!hud) return null

  const items = Object.entries(hud).filter(([, v]) => v)
  if (!items.length) return null

  return (
    <div className="hud">
      <div className="hud-title">⚪ 当前状态</div>
      <div className="hud-grid">
        {items.map(([k, v]) => (
          <div className="hud-item" key={k}>
            <span className="hud-k">{LABELS[k] ?? k}</span>
            <span className="hud-v">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
