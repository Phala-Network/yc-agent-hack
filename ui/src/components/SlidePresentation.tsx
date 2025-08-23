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
    title: "DevFlow AI",
    subtitle: "AI Coding Assistant",
    content: "Help developers write code faster"
  },
  {
    title: "Problem",
    content: "Developers waste time on boring code"
  },
  {
    title: "Solution", 
    content: "AI that understands your code and suggests improvements"
  },
  {
    title: "Growth",
    content: "8,000 users in 4 months • Growing fast"
  },
  {
    title: "Customers",
    content: "Several tech companies love our product"
  },
  {
    title: "Market",
    content: "$24B developer tools market • Many companies need this"
  },
  {
    title: "Team",
    content: "Ex-Google engineers • Stripe experience • Good team"
  },
  {
    title: "Funding",
    content: "Raising $25M Series A to grow and improve"
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
      <div className="h-full flex flex-col justify-center items-center p-8 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            {slide.title}
          </h1>
          {slide.subtitle && (
            <h2 className="text-lg text-gray-600 mb-6 font-medium">
              {slide.subtitle}
            </h2>
          )}
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
            {slide.content}
          </p>
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