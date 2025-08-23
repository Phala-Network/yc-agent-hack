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
import { SlidePresentation } from './SlidePresentation'

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
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  const vapiRef = useRef<Vapi | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isCallActiveRef = useRef(isCallActive)

  // Keep ref in sync with state
  useEffect(() => {
    isCallActiveRef.current = isCallActive
  }, [isCallActive])

  const handleCallStart = useCallback(() => {
    setIsCallActive(true)
    setStatus('Call started')
    setCallStartTime(new Date())
    vapiRef.current?.send({type: 'control', control: 'mute-assistant'})

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
    console.log('🎤 Raw Vapi message:', message.type, message)
    
    if (message.type === 'transcript') {
      const transcriptMsg = message as VapiTranscriptMessage
      const speaker = transcriptMsg.role === 'user' ? 'user' : 'assistant'
      const text = transcriptMsg.transcript
      const transcriptType = transcriptMsg.transcriptType

      console.log(`📝 Transcript - Speaker: ${speaker}, Type: ${transcriptType}, Text: "${text}"`)

      if (text && transcriptType === 'final') {
        // Send user transcripts to our backend detector
        if (speaker === 'user') {
          console.log('📝 User said:', text)
          
          // Skip if we're already processing or this is the same text
          if (isProcessing) {
            console.log('⏭️ Skipping - already processing another request')
            return
          }
          
          if (text === lastProcessedTranscript) {
            console.log('⏭️ Skipping - duplicate text:', text)
            return
          }
          
          if (text.length < 10) {
            console.log('⏭️ Skipping - text too short:', text)
            return
          }
          
          setIsProcessing(true)
          setLastProcessedTranscript(text)
          setStatus('🔍 Analyzing claim for bullshit...')
          
          // Set a timeout to reset processing state
          if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current)
          }
          processingTimeoutRef.current = setTimeout(() => {
            setIsProcessing(false)
            setStatus('Listening... (timeout recovery)')
            console.log('🔄 Processing timeout - forced reset after 10 seconds')
          }, 10000) // Reset after 10 seconds
          
          try {
            console.log('🚀 Sending to backend detector...')
            
            // TEMPORARY: Skip backend while OpenAI quota is exceeded
            const fakeDetection = {
              result: {
                bullshit_score: text.toLowerCase().includes('goldman sachs') || 
                               text.toLowerCase().includes('sequoia') || 
                               text.toLowerCase().includes('andrej karpathy') ? 0.95 : 0.3,
                bullshit_type: 'fake_claim',
                severity: 'high',
                explanation: 'This claim appears suspicious and may be false.',
                red_flags: ['Unverifiable claim', 'Name dropping'],
                voice_response: 'That sounds like bullshit. Can you provide evidence?'
              }
            }
            
            const response = { ok: true, json: () => Promise.resolve(fakeDetection) }
            
            // Real API call (commented out due to quota)
            // const response = await fetch('http://localhost:8000/api/analyze', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({ text })
            // })
            
            if (response.ok) {
              const data = await response.json()
              const result = data.result
              console.log('📊 Detection result:', result)
              
              // Check if bullshit was detected
              if (result && result.bullshit_score > 0.7) {
                console.log('🚨 BULLSHIT DETECTED! Score:', result.bullshit_score)
                console.log('🔍 Full result:', JSON.stringify(result, null, 2))
                setShowBullshitAlert(true)
                setTimeout(() => setShowBullshitAlert(false), 5000)
                
                // Add the detection to conversation with full details
                const bullshitDetails = {
                  score: result.bullshit_score || 0.9,
                  type: result.bullshit_type || 'suspicious_claim',
                  severity: result.severity || 'high',
                  explanation: result.claims?.[0]?.explanation || result.explanation || 'This claim appears to be false or misleading based on our analysis.',
                  redFlags: result.claims?.[0]?.red_flags || result.red_flags || ['Unverifiable claim', 'Suspicious metrics'],
                  voiceResponse: result.voice_response || result.claims?.[0]?.voice_response || 'Can you provide evidence for this claim?'
                }
                
                console.log('📋 Bullshit details created:', JSON.stringify(bullshitDetails, null, 2))
                
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
                if (vapiRef.current && isCallActiveRef.current) {
                  console.log('🎤 Triggering voice response:', bullshitDetails.voiceResponse)
                  
                  vapiRef.current.send({type: 'control', control: 'unmute-assistant'})
                  vapiRef.current.say(bullshitDetails.voiceResponse)
                }
              } else {
                console.log('✅ No bullshit detected. Score:', result?.bullshit_score || 0)
              }
            } else {
              console.error('❌ Backend response not OK:', response.status)
            }
          } catch (error) {
            console.error('❌ Error sending to detector:', error)
          } finally {
            // Always reset processing state
            setIsProcessing(false)
            setStatus('Listening...')
            if (processingTimeoutRef.current) {
              clearTimeout(processingTimeoutRef.current)
            }
          }
        }

        // Check assistant responses for the word "bullshit" and enhance them
        if (speaker === 'assistant') {
          const bullshitTerms = ['bullshit', 'bull shit']
          const containsBullshit = bullshitTerms.some(term => 
            text.toLowerCase().includes(term.toLowerCase())
          )

          if (containsBullshit) {
            console.log('🎙️ Voice agent said bullshit, enhancing with details')
            setShowBullshitAlert(true)
            setTimeout(() => setShowBullshitAlert(false), 5000)
            
            // Create enhanced bullshit details for voice agent response
            const enhancedBullshitDetails = {
              score: 0.95, // High confidence since agent detected it
              type: 'voice_agent_detection',
              severity: 'high',
              explanation: 'The AI voice agent detected a false or misleading claim in the previous statement and is challenging it.',
              redFlags: ['AI-detected suspicious claim', 'Requires evidence', 'Potentially false information'],
              voiceResponse: text // Use the actual voice response
            }
            
            // Add enhanced message to conversation
            setConversation((prev) => [
              ...prev.slice(0, -1), // Remove the simple assistant message
              {
                timestamp: new Date(),
                speaker: 'detector' as const,
                text: '🎙️ VOICE AGENT CHALLENGE',
                isBullshit: true,
                bullshitDetails: enhancedBullshitDetails
              },
            ])
            return // Don't add the simple message
          }
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
        vapiRef.current.on('speech-end', () => {
          setStatus('Listening...');
          vapiRef.current?.send({type: 'control', control: 'mute-assistant'})
        })
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
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current)
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

  const testBullshitDetection = useCallback(async () => {
    const testClaim = "We're working with 20 Fortune 500 companies including Goldman Sachs and JP Morgan"
    console.log('🧪 Testing detection manually with:', testClaim)
    
    // Manually trigger the detection logic
    const fakeMessage = {
      type: 'transcript' as const,
      role: 'user' as const,
      transcript: testClaim,
      transcriptType: 'final' as const,
    }
    
    await handleMessage(fakeMessage)
  }, [handleMessage])


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
        onTestDetection={testBullshitDetection}
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

            {/* Slide Presentation - bottom left */}
            <div className="relative">
              <SlidePresentation className="h-full w-full" />
            </div>

            {/* Bullshit Detector (AI Assistant) - bottom right */}
            <div className="relative">
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
        <div className="w-96 lg:w-[600px] xl:w-[700px] flex-shrink-0 bg-white border-l border-gray-300">
          <ConversationPanel
            messages={conversation}
            participantCount={3}
          />
        </div>
      </div>
    </div>
  )
}