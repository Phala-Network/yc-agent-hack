import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { MessageCircle } from 'lucide-react'

interface ConversationMessage {
  timestamp: Date
  speaker: 'user' | 'assistant'
  text: string
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

  const getSpeakerName = (speaker: 'user' | 'assistant') => {
    return speaker === 'user' ? 'Speaker' : 'Bullshit Detector'
  }

  const getSpeakerColor = (speaker: 'user' | 'assistant') => {
    return speaker === 'user' 
      ? 'bg-blue-50 text-blue-700 border-blue-200' 
      : 'bg-red-50 text-red-700 border-red-200'
  }

  const getMessageBg = (speaker: 'user' | 'assistant') => {
    return speaker === 'user'
      ? 'bg-blue-50 border-blue-100'
      : 'bg-red-50 border-red-100'
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
                    <div className={`rounded-lg p-3 text-xs text-gray-800 leading-relaxed border ${getMessageBg(message.speaker)}`}>
                      {message.text}
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