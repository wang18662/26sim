import { useRef } from 'react'
import { useGame } from './store'
import ModeSelect from './components/ModeSelect'
import TimeEntry from './components/TimeEntry'
import IdentitySelect from './components/IdentitySelect'
import CharCreate from './components/CharCreate'
import GameScreen from './components/GameScreen'

export default function App() {
  const phase = useGame((s) => s.phase)
  const worldLine = useGame((s) => s.worldLineOffset)

  const fileRef = useRef<HTMLInputElement>(null)

  const downloadSave = () => {
    const data = useGame.getState().exportSave()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `26sim-save-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        useGame.getState().importSave(data)
      } catch (err) {
        alert('存档解析失败：' + err)
      }
    }
    reader.readAsText(f)
    e.target.value = ''
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot">🟤</span>
          <span>26岁·真彩世界模拟器 V2.1</span>
        </div>
        {phase === 'playing' && (
          <div className="topbar-actions">
            <span className={`wl-tag ${worldLine === '低' ? '' : 'wl-on'}`}>
              世界线：{worldLine}
            </span>
            <button onClick={downloadSave}>存档</button>
            <button onClick={() => fileRef.current?.click()}>读档</button>
            <button className="ghost" onClick={() => useGame.getState().reset()}>
              重开
            </button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onFile} />
      </header>

      <main className="stage">
        {phase === 'mode' && <ModeSelect />}
        {phase === 'time' && <TimeEntry />}
        {phase === 'identity' && <IdentitySelect />}
        {phase === 'create' && <CharCreate />}
        {phase === 'playing' && <GameScreen />}
      </main>
    </div>
  )
}
