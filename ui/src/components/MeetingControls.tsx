import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Phone, PhoneOff, Settings, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MeetingControlsProps {
  isCallActive: boolean
  isMuted: boolean
  callDuration: number
  onStartCall: () => void
  onStopCall: () => void
  onToggleMute: () => void
  status: string
}

export const MeetingControls = ({
  isCallActive,
  isMuted,
  callDuration,
  onStartCall,
  onStopCall,
  onToggleMute,
  status
}: MeetingControlsProps) => {
  const formatDuration = (duration: number) => {
    if (duration <= 0) return '0:00'
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-gray-900 text-white px-6 py-3 border-b border-gray-700 flex-shrink-0">
      <div className="flex items-center justify-between w-full">
        {/* Left: Meeting Info */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium whitespace-nowrap">YC Demo Meeting</span>
          </div>
          {callDuration > 0 && (
            <Badge variant="secondary" className="bg-gray-700 text-gray-200 text-xs px-2 py-1">
              {formatDuration(callDuration)}
            </Badge>
          )}
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Users className="h-3 w-3" />
            <span className="hidden sm:inline">3 participants</span>
            <span className="sm:hidden">3</span>
          </div>
        </div>

        {/* Center: Controls */}
        <div className="flex items-center gap-2">
          {!isCallActive ? (
            <Button
              onClick={onStartCall}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm"
            >
              <Phone className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Join Meeting</span>
              <span className="sm:hidden">Join</span>
            </Button>
          ) : (
            <>
              <Button
                onClick={onToggleMute}
                variant="ghost"
                size="sm"
                className={cn(
                  'text-white hover:bg-gray-700 p-2 rounded-full',
                  isMuted && 'bg-red-600 hover:bg-red-700'
                )}
              >
                {isMuted ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={onStopCall}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 text-sm rounded-full"
              >
                <PhoneOff className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Leave</span>
              </Button>
            </>
          )}
        </div>

        {/* Right: Settings and Status */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-xs text-gray-400 truncate max-w-32 sm:max-w-none">
            {status}
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-white hover:bg-gray-700 p-2 rounded-full"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}