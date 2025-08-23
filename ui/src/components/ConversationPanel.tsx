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
          <div className="p-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <MessageCircle className="h-8 w-8 mx-auto mb-3 opacity-40" />
                <p className="text-xs">
                  Join the meeting to see live conversation
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div key={`${message.timestamp.getTime()}-${index}`} className="space-y-2">
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
                    <div className={`rounded-lg p-3 text-xs leading-relaxed border ${getMessageBg(message.speaker)}`}>
                      {message.isBullshit && message.bullshitDetails ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            {message.text}
                          </div>
                          
                          <div className="space-y-2 text-gray-700">
                            <div className="flex items-start gap-2">
                              <Badge className="bg-red-500 text-white">
                                Score: {Math.round(message.bullshitDetails.score * 100)}%
                              </Badge>
                              <Badge variant="outline" className="border-red-500 text-red-700">
                                {message.bullshitDetails.type.replace(/_/g, ' ')}
                              </Badge>
                              <Badge variant="outline" className={`
                                ${message.bullshitDetails.severity === 'extreme' ? 'border-red-600 text-red-600' : ''}
                                ${message.bullshitDetails.severity === 'high' ? 'border-orange-600 text-orange-600' : ''}
                                ${message.bullshitDetails.severity === 'medium' ? 'border-yellow-600 text-yellow-600' : ''}
                                ${message.bullshitDetails.severity === 'low' ? 'border-gray-600 text-gray-600' : ''}
                              `}>
                                {message.bullshitDetails.severity}
                              </Badge>
                            </div>
                            
                            <div className="bg-white/50 rounded p-2">
                              <p className="font-semibold mb-1">Analysis:</p>
                              <p>{message.bullshitDetails.explanation}</p>
                            </div>
                            
                            {message.bullshitDetails.redFlags.length > 0 && (
                              <div className="bg-white/50 rounded p-2">
                                <p className="font-semibold mb-1">Red Flags:</p>
                                <ul className="list-disc list-inside space-y-1">
                                  {message.bullshitDetails.redFlags.map((flag, i) => (
                                    <li key={i}>{flag}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                              <p className="font-semibold mb-1 text-yellow-800">VC Response:</p>
                              <p className="text-yellow-900 italic">"{message.bullshitDetails.voiceResponse}"</p>
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