import { useState, useEffect } from 'react'
import { Mic, MicOff, User, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ParticipantFrameProps {
  name: string
  role: 'speaker' | 'vc' | 'detector'
  isCurrentUser?: boolean
  isMuted?: boolean
  isActive?: boolean
  showBullshitAlert?: boolean
  className?: string
}

export const ParticipantFrame = ({
  name,
  role,
  isCurrentUser = false,
  isMuted = false,
  isActive = false,
  showBullshitAlert = false,
  className
}: ParticipantFrameProps) => {
  const [alertVisible, setAlertVisible] = useState(false)

  useEffect(() => {
    if (showBullshitAlert) {
      setAlertVisible(true)
      const timer = setTimeout(() => setAlertVisible(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showBullshitAlert])

  const getFrameStyle = () => {
    if (role === 'speaker' && isCurrentUser) {
      return 'ring-4 ring-blue-500'
    }
    if (isActive) {
      return 'ring-2 ring-green-500'
    }
    return 'ring-1 ring-gray-300'
  }

  const getBackgroundGradient = () => {
    switch (role) {
      case 'speaker':
        return 'from-blue-900 to-blue-700'
      case 'vc':
        return 'from-purple-900 to-purple-700'
      case 'detector':
        return 'from-red-900 to-red-700'
      default:
        return 'from-gray-900 to-gray-700'
    }
  }

  const getRoleIcon = () => {
    switch (role) {
      case 'detector':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  return (
    <div className={cn(
      'relative w-full h-full bg-black rounded-lg overflow-hidden transition-all duration-200 min-h-0',
      getFrameStyle(),
      className
    )}>
      {/* Video Background Simulation */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-80',
        getBackgroundGradient()
      )} />
      
      {/* User Avatar/Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
          <div className="text-white">
            {getRoleIcon()}
          </div>
        </div>
      </div>

      {/* Bullshit Alert Overlay */}
      {alertVisible && role === 'detector' && (
        <div className="absolute inset-0 bg-red-600/95 flex items-center justify-center animate-pulse z-10">
          <div className="text-center text-white">
            <div className="text-2xl md:text-4xl font-bold mb-2 drop-shadow-lg">BULLSHIT!</div>
            <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 mx-auto animate-bounce" />
          </div>
        </div>
      )}

      {/* Name Label */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent text-white px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm font-medium truncate">{name}</span>
            {isCurrentUser && (
              <span className="text-xs bg-blue-500 px-2 py-1 rounded-full whitespace-nowrap">You</span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isMuted ? (
              <MicOff className="h-3 w-3 md:h-4 md:w-4 text-red-400" />
            ) : (
              <Mic className="h-3 w-3 md:h-4 md:w-4 text-green-400" />
            )}
          </div>
        </div>
      </div>

      {/* Speaking Indicator */}
      {isActive && !isMuted && (
        <div className="absolute top-2 right-2 z-20">
          <div className="w-2 h-2 md:w-3 md:h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
        </div>
      )}

      {/* Corner indicator for active speaker */}
      {isActive && (
        <div className="absolute top-0 left-0 w-full h-1 bg-green-400 animate-pulse"></div>
      )}
    </div>
  )
}