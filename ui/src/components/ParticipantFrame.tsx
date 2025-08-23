import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, User, AlertTriangle, Camera, CameraOff } from 'lucide-react'
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
  const [hasCamera, setHasCamera] = useState(false)
  const [cameraError, setCameraError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (showBullshitAlert) {
      setAlertVisible(true)
      const timer = setTimeout(() => setAlertVisible(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showBullshitAlert])

  // Initialize camera for current user (speaker)
  useEffect(() => {
    let stream: MediaStream | null = null
    let isMounted = true
    
    const initCamera = async () => {
      if (isCurrentUser && role === 'speaker') {
        console.log('🎥 Attempting to access camera for speaker...')
        
        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error('❌ Camera API not available')
          if (isMounted) {
            setHasCamera(false)
            setCameraError(true)
          }
          return
        }

        try {
          console.log('📹 Requesting camera access...')
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user'
            },
            audio: false 
          })
          
          console.log('✅ Camera access granted!', stream)
          
          if (isMounted && videoRef.current) {
            videoRef.current.srcObject = stream
            setHasCamera(true)
            setCameraError(false)
            
            // Wait for video to be ready
            videoRef.current.onloadedmetadata = () => {
              console.log('📺 Video metadata loaded, dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight)
              if (videoRef.current) {
                videoRef.current.play().then(() => {
                  console.log('✅ Video playing successfully')
                }).catch(e => {
                  console.error('❌ Error playing video:', e)
                  if (isMounted) {
                    setCameraError(true)
                    setHasCamera(false)
                  }
                })
              }
            }
            
            videoRef.current.onerror = (e) => {
              console.error('❌ Video element error:', e)
              if (isMounted) {
                setCameraError(true) 
                setHasCamera(false)
              }
            }
          }
        } catch (error) {
          console.error('❌ Camera access error:', error)
          if (isMounted) {
            setHasCamera(false)
            setCameraError(true)
          }
        }
      }
    }

    // Add slight delay to ensure component is mounted
    const timeoutId = setTimeout(initCamera, 100)

    // Cleanup function
    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      if (stream) {
        console.log('🔄 Cleaning up camera stream')
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [isCurrentUser, role])

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
      {/* Camera Video for Speaker - Always render for speaker, hidden until stream */}
      {isCurrentUser && role === 'speaker' && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover z-10"
          style={{ transform: 'scaleX(-1)' }} // Mirror effect like front camera
        />
      )}

      {/* Fallback Background for Others or No Camera */}
      {(!isCurrentUser || role !== 'speaker' || !hasCamera) && (
        <>
          <div className={cn(
            'absolute inset-0 bg-gradient-to-br opacity-80',
            getBackgroundGradient()
          )} />
          
          {/* User Avatar/Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <div className="text-white">
                {isCurrentUser && role === 'speaker' && cameraError ? (
                  <CameraOff className="h-4 w-4" />
                ) : (
                  getRoleIcon()
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bullshit Alert Overlay */}
      {alertVisible && role === 'detector' && (
        <div className="absolute inset-0 bg-red-700/98 flex items-center justify-center animate-pulse z-20 border-4 border-red-400">
          <div className="text-center text-white transform scale-110 px-2">
            <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-2 drop-shadow-2xl animate-bounce text-yellow-300 stroke-red-900" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>
              🚨 BULLSHIT! 🚨
            </div>
            <div className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white mb-2 drop-shadow-xl">
              FALSE CLAIM DETECTED
            </div>
            <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 mx-auto animate-bounce text-yellow-400 drop-shadow-xl" />
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
            {/* Camera Indicator for Speaker */}
            {isCurrentUser && role === 'speaker' && (
              <>
                {hasCamera ? (
                  <Camera className="h-3 w-3 md:h-4 md:w-4 text-green-400" />
                ) : (
                  <CameraOff className="h-3 w-3 md:h-4 md:w-4 text-red-400" />
                )}
              </>
            )}
            {/* Mic Indicator */}
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