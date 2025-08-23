export interface VapiTranscriptMessage {
  type: 'transcript'
  role: 'user' | 'assistant'
  transcriptType: 'partial' | 'final'
  transcript: string
}

export interface VapiStatusMessage {
  type: 'status-update'
  status: string
  endedReason?: string
}

export interface VapiSpeechMessage {
  type: 'speech-update'
  status: 'started' | 'stopped'
  role: 'user' | 'assistant'
  turn: number
}

export interface VapiConversationMessage {
  type: 'conversation-update'
  conversation: Array<{
    role: string
    content: string
  }>
  messages: Array<{
    role: string
    message: string
    time: number
    endTime?: number
    secondsFromStart: number
    duration?: number
    source?: string
  }>
  messagesOpenAIFormatted: any[]
}

export type VapiMessage = 
  | VapiTranscriptMessage 
  | VapiStatusMessage 
  | VapiSpeechMessage 
  | VapiConversationMessage
  | { type: string; [key: string]: any }

export interface VapiError {
  message?: string
}

export interface VapiConfig {
  PUBLIC_KEY: string
  ASSISTANT_ID: string
}