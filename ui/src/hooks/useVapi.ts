import { useRef, useEffect, useCallback } from 'react'
import Vapi from '@vapi-ai/web'
import type { VapiMessage, VapiError } from '@/types/vapi'

interface UseVapiProps {
  publicKey: string
  onCallStart?: () => void
  onCallEnd?: () => void
  onSpeechStart?: () => void
  onSpeechEnd?: () => void
  onVolumeLevel?: (volume: number) => void
  onMessage?: (message: VapiMessage) => void
  onError?: (error: VapiError) => void
}

export const useVapi = ({
  publicKey,
  onCallStart,
  onCallEnd,
  onSpeechStart,
  onSpeechEnd,
  onVolumeLevel,
  onMessage,
  onError,
}: UseVapiProps) => {
  const vapiRef = useRef<Vapi | null>(null)

  useEffect(() => {
    if (!publicKey) return

    const initVapi = () => {
      try {
        vapiRef.current = new Vapi(publicKey)

        if (onCallStart) {
          vapiRef.current.on('call-start', onCallStart)
        }
        if (onCallEnd) {
          vapiRef.current.on('call-end', onCallEnd)
        }
        if (onSpeechStart) {
          vapiRef.current.on('speech-start', onSpeechStart)
        }
        if (onSpeechEnd) {
          vapiRef.current.on('speech-end', onSpeechEnd)
        }
        if (onVolumeLevel) {
          vapiRef.current.on('volume-level', onVolumeLevel)
        }
        if (onMessage) {
          vapiRef.current.on('message', onMessage)
        }
        if (onError) {
          vapiRef.current.on('error', onError)
        }
      } catch (error) {
        if (onError) {
          onError({ message: 'Failed to initialize SDK' })
        }
      }
    }

    const timeoutId = setTimeout(initVapi, 100)

    return () => {
      clearTimeout(timeoutId)
      if (vapiRef.current) {
        vapiRef.current.stop()
      }
    }
  }, [
    publicKey,
    onCallStart,
    onCallEnd,
    onSpeechStart,
    onSpeechEnd,
    onVolumeLevel,
    onMessage,
    onError,
  ])

  const startCall = useCallback(
    async (assistantId: string) => {
      if (!vapiRef.current) {
        throw new Error('SDK not initialized')
      }
      await vapiRef.current.start(assistantId)
    },
    []
  )

  const stopCall = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.stop()
    }
  }, [])

  const setMuted = useCallback((muted: boolean) => {
    if (vapiRef.current) {
      vapiRef.current.setMuted(muted)
    }
  }, [])

  return {
    startCall,
    stopCall,
    setMuted,
  }
}