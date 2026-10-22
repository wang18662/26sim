export type Phase = 'mode' | 'time' | 'identity' | 'create' | 'playing'

export type Mode = 'fun' | 'immersive' | 'hardcore'

export type TimeEntry = 'early' | 'mid' | 'late' | 'custom'

export type Identity = 'A' | 'B' | 'C' | 'D' | 'E'

export interface Character {
  name: string
  age: string
  gender: string
  job: string
  economy: string
  background: string
}

export interface Hud {
  time?: string
  location?: string
  cash?: string
  bank?: string
  debt?: string
  rent?: string
  body?: string
  [k: string]: string | undefined
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface SaveData {
  version: string
  systemPrompt: string
  mode: Mode | null
  timeEntry: TimeEntry | null
  timeCustom: string
  identity: Identity | null
  identityNote: string
  character: Character
  messages: ChatMessage[]
  hud: Hud | null
  worldLineOffset: string
  savedAt: string
}
