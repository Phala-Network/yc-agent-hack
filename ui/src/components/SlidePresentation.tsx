import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Slide {
  title: string
  content: string
  subtitle?: string
}

const slides: Slide[] = [
  {
    title: "Bullshit Detector AI",
    subtitle: "Real-Time Fact Checking",
    content: "We detect false claims instantly during meetings"
  },
  {
    title: "The Problem",
    content: "94.7% of startup pitches contain lies\nCosting $847 billion globally"
  },
  {
    title: "Our Solution", 
    content: "Quantum AI with 17 models\n4,300% more accurate than humans"
  },
  {
    title: "Traction",
    content: "12 million active users\n$25M recurring revenue\n500% monthly growth"
  },
  {
    title: "Customers",
    content: "OpenAI • FBI • Every YC Partner\nFortune 500 CEOs love us"
  },
  {
    title: "Market",
    content: "$2.4 trillion TAM\n73% market share by 2025\nEvery human will use this"
  },
  {
    title: "Team",
    content: "Elon Musk (Chief Advisor)\nEntire Google DeepMind team\nGeoffrey Hinton trained our AI"
  },
  {
    title: "Funding",
    content: "Sequoia led $500M Series Z\n$50 billion valuation\nGoing public next week"
  }
]

interface SlidePresentationProps {
  className?: string
}

export const SlidePresentation = ({ className = "" }: SlidePresentationProps) => {
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const slide = slides[currentSlide]

  return (
    <div className={`relative bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Slide Content */}
      <div className="h-full flex flex-col justify-center items-center p-8 text-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-lg">
          <h1 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            {slide.title}
          </h1>
          {slide.subtitle && (
            <h2 className="text-lg text-gray-600 mb-6 font-bold tracking-wide uppercase">
              {slide.subtitle}
            </h2>
          )}
          <p className="text-lg md:text-2xl text-gray-800 leading-relaxed font-semibold whitespace-pre-line">
            {slide.content}
          </p>
          
          {/* Add some "startup vibes" emojis */}
          {currentSlide === 0 && <div className="text-4xl mt-4">🚀✨</div>}
          {currentSlide === 1 && <div className="text-4xl mt-4">💸📊</div>}
          {currentSlide === 2 && <div className="text-4xl mt-4">🤖⚡</div>}
          {currentSlide === 3 && <div className="text-4xl mt-4">📈💰</div>}
          {currentSlide === 4 && <div className="text-4xl mt-4">🏢🤝</div>}
          {currentSlide === 5 && <div className="text-4xl mt-4">🌍💎</div>}
          {currentSlide === 6 && <div className="text-4xl mt-4">👨‍💼🧠</div>}
          {currentSlide === 7 && <div className="text-4xl mt-4">💵🎉</div>}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
        <Button
          onClick={prevSlide}
          variant="ghost"
          size="sm"
          className="pointer-events-auto bg-black/10 hover:bg-black/20 text-gray-700 rounded-full p-2 opacity-70 hover:opacity-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          onClick={nextSlide}
          variant="ghost"
          size="sm"  
          className="pointer-events-auto bg-black/10 hover:bg-black/20 text-gray-700 rounded-full p-2 opacity-70 hover:opacity-100"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Slide Counter */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
        {currentSlide + 1} / {slides.length}
      </div>

      {/* YC Style Brand */}
      <div className="absolute top-4 right-4">
        <div className="w-8 h-8 bg-orange-500 rounded-sm flex items-center justify-center">
          <span className="text-white font-bold text-xs">YC</span>
        </div>
      </div>
    </div>
  )
}