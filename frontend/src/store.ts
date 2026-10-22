import { create } from 'zustand'
import { SYSTEM_PROMPT } from './game/prompt'
import { streamChat } from './game/api'
import type { ChatMessage, Character, Hud, Identity, Mode, Phase, SaveData, TimeEntry } from './types'

const emptyChar: Character = {
  name: '',
  age: '',
  gender: '',
  job: '',
  economy: '',
  background: '',
}

interface GameState {
  phase: Phase
  mode: Mode | null
  timeEntry: TimeEntry | null
  timeCustom: string
  identity: Identity | null
  identityNote: string
  character: Character
  messages: ChatMessage[]
  streaming: string
  hud: Hud | null
  worldLineOffset: string
  loading: boolean
  error: string | null

  setPhase: (p: Phase) => void
  setMode: (m: Mode) => void
  setTime: (t: TimeEntry, custom?: string) => void
  setIdentity: (i: Identity, note?: string) => void
  setCharacter: (c: Partial<Character>) => void
  randomCharacter: () => void

  startGame: () => Promise<void>
  sendInput: (text: string) => Promise<void>

  exportSave: () => SaveData
  importSave: (data: SaveData) => void
  reset: () => void
}

const MODE_LABEL: Record<Mode, string> = {
  fun: '爽玩',
  immersive: '沉浸',
  hardcore: '硬核',
}
const TIME_LABEL: Record<TimeEntry, string> = {
  early: '原著前期',
  mid: '原著中期',
  late: '原著后期',
  custom: '自定义时间点',
}
const IDENTITY_LABEL: Record<Identity, string> = {
  A: '昭阳',
  B: '原著已有角色',
  C: '原创房客',
  D: '城市普通年轻人',
  E: '自定义合理身份',
}

// 从助手文本里解析 ⚪ 当前状态 HUD
function parseHud(text: string): Hud | null {
  const marker = '⚪ 当前状态'
  const idx = text.indexOf(marker)
  if (idx < 0) return null
  const after = text.slice(idx + marker.length)
  const keys = ['时间', '地点', '现金', '银行卡', '债务', '房租', '身体', '工资']
  const keyAlt = keys.join('|')
  // 值不跨行：止于「下一个键:」或「换行」或「末尾」，避免把后续正文吞进最后一个字段
  const re = new RegExp(
    `(${keyAlt})[:：]\\s*([^\\n]*?)(?=(?:${keyAlt})[:：]|\\n|$)`,
    'g'
  )
  const hud: Hud = {}
  let m: RegExpExecArray | null
  while ((m = re.exec(after)) !== null) {
    const v = m[2].trim()
    if (v) hud[m[1]] = v
  }
  return Object.keys(hud).length ? hud : null
}

function buildSetup(s: GameState): string {
  const lines: string[] = ['【玩家设定】']
  lines.push(`模式：${s.mode ? MODE_LABEL[s.mode] : '爽玩'}`)
  lines.push(
    `时间入口：${s.timeEntry ? TIME_LABEL[s.timeEntry] : '原著前期'}${
      s.timeEntry === 'custom' && s.timeCustom ? `（${s.timeCustom}）` : ''
    }`
  )
  const idLabel = s.identity ? IDENTITY_LABEL[s.identity] : '原创房客'
  lines.push(`身份：${idLabel}${s.identity === 'B' || s.identity === 'E' ? `（${s.identityNote}）` : ''}`)

  if (s.identity === 'C' || s.identity === 'D' || s.identity === 'E') {
    const c = s.character
    lines.push(`姓名：${c.name || '（未填）'}`)
    lines.push(`年龄：${c.age || '（未填）'}`)
    lines.push(`性别：${c.gender || '（未填）'}`)
    lines.push(`当前工作：${c.job || '（未填）'}`)
    lines.push(`当前经济状态：${c.economy || '（未填）'}`)
    lines.push(`重要背景：${c.background || '（未填）'}`)
  }

  lines.push('')
  lines.push(
    '请严格按照《26岁·真彩世界模拟器 V2.1》协议，直接进入第一幕。从一个正在发生的瞬间开始：3—7个手机友好短段落，明确时间、地点、至少一个感官细节、至少一个现实物件、至少一个人或现实过程。不替玩家作关键决定。可在适当时输出 ⚪ 当前状态 HUD。'
  )
  return lines.join('\n')
}

function detectWorldLine(text: string): string {
  if (/世界线发生偏移|世界线偏移|偏移/.test(text)) return '已偏移'
  return '低'
}

async function runTurn(get: () => GameState, set: (p: Partial<GameState>) => void, userText: string) {
  const cur = get()
  const messages: ChatMessage[] = [...cur.messages, { role: 'user', content: userText }]
  set({ messages, streaming: '', loading: true, error: null, phase: 'playing' })

  const full = [{ role: 'system' as const, content: SYSTEM_PROMPT }, ...messages]
  let acc = ''
  try {
    for await (const delta of streamChat(full)) {
      acc += delta
      set({ streaming: acc })
    }
  } catch (e) {
    // 流中断：已生成的内容不白费，保留成一条带提示的消息；acc 为空（请求阶段就失败）才走纯报错
    if (acc) {
      set({
        messages: [...messages, { role: 'assistant', content: acc + '\n\n[⚠️ 生成中断，请重新输入以继续]' }],
        streaming: '',
        loading: false,
        error: String(e),
      })
    } else {
      set({ error: String(e), loading: false, streaming: '' })
    }
    return
  }

  const hud = parseHud(acc)
  set({
    messages: [...messages, { role: 'assistant', content: acc }],
    streaming: '',
    loading: false,
    hud: hud ?? cur.hud,
    worldLineOffset: detectWorldLine(acc),
  })
}

export const useGame = create<GameState>((set, get) => ({
  phase: 'mode',
  mode: null,
  timeEntry: null,
  timeCustom: '',
  identity: null,
  identityNote: '',
  character: { ...emptyChar },
  messages: [],
  streaming: '',
  hud: null,
  worldLineOffset: '低',
  loading: false,
  error: null,

  setPhase: (p) => set({ phase: p }),
  setMode: (m) => set({ mode: m, phase: 'time' }),
  setTime: (t, custom) =>
    set({ timeEntry: t, timeCustom: custom ?? '', phase: 'identity' }),
  setIdentity: (i, note) =>
    set({
      identity: i,
      identityNote: note ?? '',
      phase: i === 'C' || i === 'D' || i === 'E' ? 'create' : 'playing',
    }),
  setCharacter: (c) => set({ character: { ...get().character, ...c } }),
  randomCharacter: () =>
    set({
      character: {
        name: '林默',
        age: '26',
        gender: '男',
        job: '刚失业的自由插画师',
        economy: '存款约 6800，月租 1800，暂无负债',
        background: '从老家来这座城市半年，想找份稳定工作留下来',
      },
    }),

  startGame: async () => {
    const setup = buildSetup(get())
    await runTurn(get, set, setup)
  },
  sendInput: async (text: string) => {
    if (!text.trim()) return
    await runTurn(get, set, text.trim())
  },

  exportSave: () => {
    const s = get()
    return {
      version: '26sim-v2.1',
      systemPrompt: SYSTEM_PROMPT,
      mode: s.mode,
      timeEntry: s.timeEntry,
      timeCustom: s.timeCustom,
      identity: s.identity,
      identityNote: s.identityNote,
      character: s.character,
      messages: s.messages,
      hud: s.hud,
      worldLineOffset: s.worldLineOffset,
      savedAt: new Date().toISOString(),
    }
  },
  importSave: (data) => {
    set({
      phase: 'playing',
      mode: data.mode ?? null,
      timeEntry: data.timeEntry ?? null,
      timeCustom: data.timeCustom ?? '',
      identity: data.identity ?? null,
      identityNote: data.identityNote ?? '',
      character: data.character ?? { ...emptyChar },
      messages: data.messages ?? [],
      hud: data.hud ?? null,
      worldLineOffset: data.worldLineOffset ?? '低',
      streaming: '',
      loading: false,
      error: null,
    })
  },
  reset: () =>
    set({
      phase: 'mode',
      mode: null,
      timeEntry: null,
      timeCustom: '',
      identity: null,
      identityNote: '',
      character: { ...emptyChar },
      messages: [],
      streaming: '',
      hud: null,
      worldLineOffset: '低',
      loading: false,
      error: null,
    }),
}))
