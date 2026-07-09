import { useState, useEffect } from 'react'

function getBreakpoint(width) {
  if (width < 768)  return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

export function useBreakpoint() {
  const [width, setWidth] = useState(() => window.innerWidth)

  useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const bp = getBreakpoint(width)

  return {
    breakpoint: bp,
    windowWidth: width,
    isMobile:  bp === 'mobile',
    isTablet:  bp === 'tablet',
    isDesktop: bp === 'desktop',
    isSmall:   bp === 'mobile' || bp === 'tablet',
  }
}