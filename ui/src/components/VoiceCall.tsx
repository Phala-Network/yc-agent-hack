import { useState, useRef, useEffect, useCallback } from 'react'
import Vapi from '@vapi-ai/web'
import type { 
  VapiMessage, 
  VapiError, 
  VapiTranscriptMessage, 
  VapiSpeechMessage, 
  VapiStatusMessage 
} from '@/types/vapi'
import { ParticipantFrame } from './ParticipantFrame'
import { ConversationPanel } from './ConversationPanel'
import { MeetingControls } from './MeetingControls'

const VAPI_CONFIG = {
  PUBLIC_KEY: '8bf3ee7e-bfdc-42b0-893b-a75e93ed9c40',
  ASSISTANT_ID: 'f80bdb7d-68d6-48cd-8676-f803bab629c7'
} as const

interface ConversationMessage {
  timestamp: Date
  speaker: 'user' | 'assistant' | 'detector'
  text: string
  isBullshit?: boolean
  bullshitDetails?: {
    score: number
    type: string
    severity: string
    explanation: string
    redFlags: string[]
    voiceResponse: string
  }
}


export const VoiceCall = () => {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [publicKey] = useState(VAPI_CONFIG.PUBLIC_KEY)
  const [assistantId] = useState(VAPI_CONFIG.ASSISTANT_ID)
  const [status, setStatus] = useState('Ready to join meeting')
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  const [callStartTime, setCallStartTime] = useState<Date | null>(null)
  const [callDuration, setCallDuration] = useState(0)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [showBullshitAlert, setShowBullshitAlert] = useState(false)

  const vapiRef = useRef<Vapi | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handleCallStart = useCallback(() => {
    setIsCallActive(true)
    setStatus('Call started')
    setCallStartTime(new Date())

    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1)
    }, 1000)
    timerRef.current = timer
  }, [])

  const handleCallEnd = useCallback(() => {
    setIsCallActive(false)
    setStatus('Call ended')
    setCallStartTime(null)

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handleMessage = useCallback(async (message: VapiMessage) => {
    if (message.type === 'transcript') {
      const transcriptMsg = message as VapiTranscriptMessage
      const speaker = transcriptMsg.role === 'user' ? 'user' : 'assistant'
      const text = transcriptMsg.transcript
      const transcriptType = transcriptMsg.transcriptType

      if (text && transcriptType === 'final') {
        // Send user transcripts to our backend detector
        if (speaker === 'user') {
          console.log('📝 User said:', text)
          try {
            console.log('🚀 Sending to backend detector...')
            const response = await fetch('http://localhost:8000/api/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text })
            })
            
            if (response.ok) {
              const data = await response.json()
              const result = data.result
              console.log('📊 Detection result:', result)
              
              // Check if bullshit was detected
              if (result && result.bullshit_score > 0.7) {
                console.log('🚨 BULLSHIT DETECTED! Score:', result.bullshit_score)
                setShowBullshitAlert(true)
                setTimeout(() => setShowBullshitAlert(false), 5000)
                
                // Add the detection to conversation with full details
                const bullshitDetails = {
                  score: result.bullshit_score,
                  type: result.bullshit_type || 'unknown',
                  severity: result.severity || 'high',
                  explanation: result.claims?.[0]?.explanation || 'Suspicious claim detected',
                  redFlags: result.claims?.[0]?.red_flags || [],
                  voiceResponse: result.voice_response || 'This claim needs verification'
                }
                
                setConversation((prev) => [
                  ...prev,
                  {
                    timestamp: new Date(),
                    speaker: 'detector' as const,
                    text: `🚨 BULLSHIT DETECTED!`,
                    isBullshit: true,
                    bullshitDetails
                  },
                ])
                
                // If Vapi is active, make the assistant speak the challenge
                if (vapiRef.current && isCallActive) {
                  console.log('🎤 Triggering voice response:', bullshitDetails.voiceResponse)
                  
                  // Send the message to Vapi using the send method
                  try {
                    // Send a system message to trigger the assistant to speak
                    vapiRef.current.send({
                      type: 'add-message',
                      message: {
                        role: 'system',
                        content: `INTERRUPT AND SAY: "${bullshitDetails.voiceResponse}"`
                      }
                    })
                    console.log('📤 Sent interrupt command to Vapi')
                  } catch (error) {
                    console.error('Failed to send to Vapi:', error)
                    
                    // Alternative: Use Vapi's say method if available
                    if (typeof vapiRef.current.say === 'function') {
                      vapiRef.current.say(bullshitDetails.voiceResponse)
                    }
                  }
                }
              } else {
                console.log('✅ No bullshit detected. Score:', result?.bullshit_score || 0)
              }
            } else {
              console.error('❌ Backend response not OK:', response.status)
            }
          } catch (error) {
            console.error('❌ Error sending to detector:', error)
          }
        }

        // Check assistant responses for the word "bullshit"
        const bullshitTerms = ['bullshit', 'bull shit']
        const containsBullshit = bullshitTerms.some(term => 
          text.toLowerCase().includes(term.toLowerCase())
        )

        if (containsBullshit && speaker === 'assistant') {
          setShowBullshitAlert(true)
          setTimeout(() => setShowBullshitAlert(false), 3000)
        }

        setConversation((prev) => [
          ...prev,
          {
            timestamp: new Date(),
            speaker,
            text,
          },
        ])
      }
    } else if (message.type === 'speech-update') {
      const speechMsg = message as VapiSpeechMessage
      
      if (speechMsg.status === 'started' && speechMsg.role === 'assistant') {
        setStatus('Assistant speaking...')
      } else if (speechMsg.status === 'stopped') {
        setStatus('Listening...')
      }
    } else if (message.type === 'status-update') {
      const statusMsg = message as VapiStatusMessage
      
      if (statusMsg.status === 'ended') {
        setStatus(`Call ended: ${statusMsg.endedReason || 'unknown reason'}`)
      }
    }
  }, [])

  const handleError = useCallback((error: VapiError) => {
    setStatus(`Error: ${error.message || 'Unknown error'}`)
  }, [])

  useEffect(() => {
    if (!publicKey) return

    const initVapi = () => {
      try {
        vapiRef.current = new Vapi(publicKey)
        vapiRef.current.on('call-start', handleCallStart)
        vapiRef.current.on('call-end', handleCallEnd)
        vapiRef.current.on('speech-start', () => setStatus('Assistant speaking...'))
        vapiRef.current.on('speech-end', () => setStatus('Listening...'))
        vapiRef.current.on('volume-level', setVolumeLevel)
        vapiRef.current.on('message', handleMessage)
        vapiRef.current.on('error', handleError)
      } catch (error) {
        setStatus('Failed to initialize AI assistant')
      }
    }

    const timeoutId = setTimeout(initVapi, 100)

    return () => {
      clearTimeout(timeoutId)
      if (vapiRef.current) {
        vapiRef.current.stop()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [publicKey, handleCallStart, handleCallEnd, handleMessage, handleError])


  const startCall = useCallback(async () => {
    if (!publicKey || !assistantId) {
      setStatus('Configuration missing')
      return
    }

    if (!vapiRef.current) {
      setStatus('AI assistant not initialized')
      return
    }

    try {
      setStatus('Joining meeting...')
      setCallDuration(0)
      await vapiRef.current.start(assistantId)
    } catch (error) {
      setStatus(
        `Error: ${
          error instanceof Error ? error.message : 'Failed to join meeting'
        }`
      )
    }
  }, [publicKey, assistantId])

  const stopCall = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.stop()
    }

    setConversation([])
    setCallDuration(0)
  }, [])

  const toggleMute = useCallback(() => {
    if (vapiRef.current) {
      const newMutedState = !isMuted
      vapiRef.current.setMuted(newMutedState)
      setIsMuted(newMutedState)
    }
  }, [isMuted])


  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 overflow-hidden">
      {/* Meeting Controls at top */}
      <MeetingControls
        isCallActive={isCallActive}
        isMuted={isMuted}
        callDuration={callDuration}
        onStartCall={startCall}
        onStopCall={stopCall}
        onToggleMute={toggleMute}
        status={status}
      />

      {/* Main meeting area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid Area */}
        <div className="flex-1 p-4 bg-black">
          <div className="h-full w-full grid grid-cols-2 grid-rows-2 gap-3">
            {/* Speaker (current user) - top left */}
            <div className="relative">
              <ParticipantFrame
                name="Speaker"
                role="speaker"
                isCurrentUser={true}
                isMuted={isMuted}
                isActive={volumeLevel > 0.1}
                className="h-full w-full"
              />
            </div>

            {/* VC - top right */}
            <div className="relative">
              <ParticipantFrame
                name="VC Partner"
                role="vc"
                isCurrentUser={false}
                isMuted={false}
                isActive={false}
                className="h-full w-full"
              />
            </div>

            {/* Bullshit Detector (AI Assistant) - bottom spanning full width */}
            <div className="relative col-span-2">
              <ParticipantFrame
                name="Bullshit Detector"
                role="detector"
                isCurrentUser={false}
                isMuted={false}
                isActive={status === 'Assistant speaking...'}
                showBullshitAlert={showBullshitAlert}
                className="h-full w-full"
              />
            </div>
          </div>
        </div>

        {/* Conversation Panel on the right */}
        <div className="w-80 flex-shrink-0 bg-white border-l border-gray-300">
          <ConversationPanel
            messages={conversation}
            participantCount={3}
          />
        </div>
      </div>
    </div>
  )
}