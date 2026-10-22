// 系统提示词以纯文本存放，Vite 的 ?raw 导入会原样返回字符串，
// 避免模板字符串里的反斜杠（如 \colorbox）被 JS 转义处理。
import SYSTEM_PROMPT from './systemPrompt.txt?raw'

export { SYSTEM_PROMPT }
