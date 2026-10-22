import { useState } from 'react'
import { useGame } from '../store'

export default function CharCreate() {
  const character = useGame((s) => s.character)
  const setCharacter = useGame((s) => s.setCharacter)
  const randomCharacter = useGame((s) => s.randomCharacter)
  const startGame = useGame((s) => s.startGame)

  const [local, setLocal] = useState(character)
  const update = (k: keyof typeof local, v: string) => {
    const next = { ...local, [k]: v }
    setLocal(next)
    setCharacter({ [k]: v })
  }

  const fields: { key: keyof typeof local; label: string; placeholder: string }[] = [
    { key: 'name', label: '姓名', placeholder: '林默' },
    { key: 'age', label: '年龄', placeholder: '26' },
    { key: 'gender', label: '性别', placeholder: '男 / 女' },
    { key: 'job', label: '当前工作', placeholder: '自由插画师 / 失业中' },
    { key: 'economy', label: '当前经济状态', placeholder: '存款约8000，月租1800，无负债' },
    { key: 'background', label: '一个重要背景', placeholder: '刚从老家来这座城市，想稳定下来' },
  ]

  return (
    <div className="screen">
      <div className="screen-head">
        <div className="node">🟣 创建你的角色</div>
        <div className="hint">只填影响第一幕的必要信息。默认无系统、无超能力、无外挂、无自动好感。</div>
      </div>

      <div className="form">
        {fields.map((f) => (
          <label key={f.key} className="field">
            <span>{f.label}</span>
            <input
              className="input"
              value={local[f.key]}
              placeholder={f.placeholder}
              onChange={(e) => update(f.key, e.target.value)}
            />
          </label>
        ))}
      </div>

      <div className="row">
        <button className="ghost" onClick={randomCharacter}>
          随机生成
        </button>
        <button className="btn-default" onClick={() => startGame()}>
          确认进入第一幕
        </button>
      </div>
    </div>
  )
}
