import { useEffect, useRef, useState, useCallback } from 'react'
import Vapi from '@vapi-ai/web'

interface UseVapiWithDetectorProps {
  publicKey: string
  assistantId: string
  onTranscript?: (text: string, speaker: 'user' | 'assistant') => void
  onBullshitDetected?: (details: any) => void
}

export const useVapiWithDetector = ({
  publicKey,
  assistantId,
  onTranscript,
  onBullshitDetected
}: UseVapiWithDetectorProps) => {
  const vapiRef = useRef<Vapi | null>(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  
  useEffect(() => {
    if (!publicKey) return

    const vapi = new Vapi(publicKey)
    
    // Set up event listeners
    vapi.on('call-start', () => {
      console.log('📞 Call started')
      setIsCallActive(true)
    })
    
    vapi.on('call-end', () => {
      console.log('📞 Call ended')
      setIsCallActive(false)
    })
    
    vapi.on('message', async (message: any) => {
      // Handle transcripts
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        const speaker = message.role === 'user' ? 'user' : 'assistant'
        const text = message.transcript
        
        if (onTranscript) {
          onTranscript(text, speaker)
        }
        
        // If user is speaking, check for bullshit
        if (speaker === 'user' && text) {
          try {
            const response = await fetch('http://localhost:8000/api/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text })
            })
            
            if (response.ok) {
              const data = await response.json()
              const result = data.result
              
              if (result && result.bullshit_score > 0.7 && onBullshitDetected) {
                console.log('🚨 Bullshit detected, triggering callback')
                onBullshitDetected(result)
              }
            }
          } catch (error) {
            console.error('Error checking for bullshit:', error)
          }
        }
      }
    })
    
    vapiRef.current = vapi
    
    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop()
      }
    }
  }, [publicKey, onTranscript, onBullshitDetected])
  
  const startCall = useCallback(async () => {
    if (!vapiRef.current || !assistantId) return
    
    try {
      await vapiRef.current.start(assistantId)
    } catch (error) {
      console.error('Failed to start call:', error)
    }
  }, [assistantId])
  
  const endCall = useCallback(() => {
    if (!vapiRef.current) return
    vapiRef.current.stop()
  }, [])
  
  const toggleMute = useCallback(() => {
    if (!vapiRef.current) return
    
    if (isMuted) {
      vapiRef.current.setMuted(false)
      setIsMuted(false)
    } else {
      vapiRef.current.setMuted(true)
      setIsMuted(true)
    }
  }, [isMuted])
  
  return {
    startCall,
    endCall,
    toggleMute,
    isCallActive,
    isMuted
  }
}