import { useGame } from '../store'
import Hud from './Hud'
import NarrativeLog from './NarrativeLog'
import ActionBar from './ActionBar'

export default function GameScreen() {
  const error = useGame((s) => s.error)

  return (
    <div className="gamescreen">
      <Hud />
      {error && <div className="error-bar">⚠️ {error}</div>}
      <NarrativeLog />
      <ActionBar />
    </div>
  )
}
