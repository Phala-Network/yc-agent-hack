import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, AlertTriangle } from 'lucide-react'

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

interface ConversationPanelProps {
  messages: ConversationMessage[]
  participantCount: number
}

export const ConversationPanel = ({ messages, participantCount }: ConversationPanelProps) => {
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSpeakerName = (speaker: 'user' | 'assistant' | 'detector') => {
    if (speaker === 'user') return 'Speaker'
    if (speaker === 'detector') return '🚨 BS Detector'
    return 'AI Assistant'
  }

  const getSpeakerColor = (speaker: 'user' | 'assistant' | 'detector') => {
    if (speaker === 'user') return 'bg-blue-50 text-blue-700 border-blue-200'
    if (speaker === 'detector') return 'bg-red-600 text-white border-red-600'
    return 'bg-green-50 text-green-700 border-green-200'
  }

  const getMessageBg = (speaker: 'user' | 'assistant' | 'detector') => {
    if (speaker === 'user') return 'bg-blue-50 border-blue-100'
    if (speaker === 'detector') return 'bg-red-50 border-red-200'
    return 'bg-green-50 border-green-100'
  }

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat
          </h3>
          <Badge variant="secondary" className="text-xs px-2 py-1">
            {participantCount}
          </Badge>
        </div>
        <p className="text-xs text-gray-600">
          Live transcript & detection
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <MessageCircle className="h-8 w-8 mx-auto mb-3 opacity-40" />
                <p className="text-xs">
                  Join the meeting to see live conversation
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div key={`${message.timestamp.getTime()}-${index}`} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-2 py-0.5 ${getSpeakerColor(message.speaker)}`}
                      >
                        {getSpeakerName(message.speaker)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <div className={`rounded-lg text-xs leading-relaxed border ${getMessageBg(message.speaker)} ${message.isBullshit ? 'p-0' : 'p-3'}`}>
                      {message.isBullshit && message.bullshitDetails ? (
                        <div className="space-y-4 p-6 bg-red-100 border-4 border-red-500 rounded-xl">
                          <div className="flex items-center gap-3 text-red-800 font-black text-3xl animate-pulse">
                            <AlertTriangle className="h-8 w-8 animate-bounce" />
                            <span className="drop-shadow-lg">{message.text || "BULLSHIT DETECTED!"}</span>
                          </div>
                          
                          <div className="space-y-4 text-lg">
                            <div className="flex items-start gap-3 flex-wrap">
                              <Badge className="bg-red-600 text-white text-xl px-4 py-2 font-bold">
                                🎯 Score: {Math.round((message.bullshitDetails?.score || 0.9) * 100)}%
                              </Badge>
                              <Badge variant="outline" className="border-red-600 text-red-800 text-lg px-4 py-2 font-bold">
                                {message.bullshitDetails?.type === 'voice_agent_detection' ? '🎙️' : '📝'} {(message.bullshitDetails?.type || 'suspicious_claim').replace(/_/g, ' ').toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className={`text-lg px-4 py-2 font-bold
                                ${(message.bullshitDetails?.severity || 'high') === 'extreme' ? 'border-red-700 text-red-700 bg-red-50' : ''}
                                ${(message.bullshitDetails?.severity || 'high') === 'high' ? 'border-orange-600 text-orange-700 bg-orange-50' : ''}
                                ${(message.bullshitDetails?.severity || 'high') === 'medium' ? 'border-yellow-600 text-yellow-700 bg-yellow-50' : ''}
                                ${(message.bullshitDetails?.severity || 'high') === 'low' ? 'border-gray-600 text-gray-700 bg-gray-50' : ''}
                              `}>
                                ⚠️ {(message.bullshitDetails?.severity || 'HIGH').toUpperCase()}
                              </Badge>
                            </div>
                            
                            <div className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                              <p className="font-bold text-xl mb-3 text-gray-800">🔍 ANALYSIS:</p>
                              <p className="text-lg leading-relaxed text-gray-700">
                                {message.bullshitDetails?.explanation || 'This claim appears to be false or misleading based on our analysis.'}
                              </p>
                            </div>
                            
                            {(message.bullshitDetails?.redFlags?.length > 0 || !message.bullshitDetails?.redFlags) && (
                              <div className="bg-white rounded-lg p-4 border-2 border-red-300 shadow-sm">
                                <p className="font-bold text-xl mb-3 text-red-800">🚩 RED FLAGS:</p>
                                <ul className="space-y-2 text-lg">
                                  {(message.bullshitDetails?.redFlags || ['Unverifiable claim', 'Suspicious metrics']).map((flag, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-red-600 font-bold">•</span>
                                      <span className="text-red-700 font-medium">{flag}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <div className="bg-yellow-100 border-4 border-yellow-400 rounded-lg p-6 shadow-lg">
                              <p className="font-black text-2xl mb-4 text-yellow-900">
                                {message.bullshitDetails?.type === 'voice_agent_detection' ? '🎙️ LIVE VOICE CHALLENGE:' : '💬 VC CHALLENGE:'}
                              </p>
                              <div className={`rounded-lg p-4 border-2 ${
                                message.bullshitDetails?.type === 'voice_agent_detection' 
                                  ? 'bg-blue-50 border-blue-300' 
                                  : 'bg-yellow-50 border-yellow-300'
                              }`}>
                                <p className="text-xl font-bold italic leading-relaxed">
                                  "{message.bullshitDetails?.voiceResponse || 'Can you provide evidence for this claim?'}"
                                </p>
                              </div>
                              {message.bullshitDetails?.type === 'voice_agent_detection' && (
                                <p className="text-sm text-blue-700 mt-2 font-medium">
                                  ↑ This challenge was spoken live by the AI voice agent
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-800">{message.text}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{messages.length} messages</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
        </div>
      </div>
    </div>
  )
}