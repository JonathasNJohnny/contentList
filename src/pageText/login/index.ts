import { englishLoginText } from './english'
import { portugueseLoginText } from './portuguese'

export const loginPageText = {
  en: englishLoginText,
  ptBR: portugueseLoginText,
} as const

export type LoginLanguage = keyof typeof loginPageText
