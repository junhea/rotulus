import React, { HTMLAttributes, PropsWithChildren, useRef } from 'react'

import { animateElement, WheelAnimation } from './animation'
import { useWheelAnimationFrame } from './wheel-animation-provider'

interface Props extends HTMLAttributes<HTMLDivElement> {
  animations: WheelAnimation[]
}

export function WheelAnimationComponent({
  animations,
  children,
  ...props
}: PropsWithChildren<Props>) {
  const containerRef = useRef<HTMLDivElement>(null)
  useWheelAnimationFrame((frame) => {
    animateElement(frame, animations, [containerRef.current])
  })

  return (
    <div ref={containerRef} {...props}>
      {children}
    </div>
  )
}
