import React, {
  createContext,
  HTMLAttributes,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
} from 'react'

type OverflowBehavior =
  | 'loopBoth'
  | 'loopStart'
  | 'loopEnd'
  | 'overflow'
  | 'contain'

interface WheelAnimationProviderProps extends HTMLAttributes<HTMLDivElement> {
  overflowBehavior?: OverflowBehavior
  max?: number
  start?: number
}

function createWheelCallbacks(): WheelCallbacks {
  const callbacks = new Set<(frame: number) => void>()
  return {
    callbacks,
    addCallback(callback: (frame: number) => void) {
      this.callbacks.add(callback)
      return callback
    },
    removeCallback(callback: (frame: number) => void) {
      this.callbacks.delete(callback)
    },
    run(frame: number) {
      for (const c of this.callbacks.values()) {
        c(frame)
      }
    },
  }
}

const LERP = 0.005
const PRECISION = 0.01
const MAX_WHEEL_DELTA = 200

export function WheelAnimationProvider({
  children,
  overflowBehavior = 'contain',
  start = 0,
  max = Number.MAX_SAFE_INTEGER,
  ...props
}: PropsWithChildren<WheelAnimationProviderProps>) {
  const wheelRef = useRef(start)
  const callbacksRef = useRef<WheelCallbacks>(createWheelCallbacks())
  const divRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!divRef.current) return
    const divToWatch = divRef.current
    const onWheel = (e: WheelEvent) => {
      wheelRef.current += Math.min(
        MAX_WHEEL_DELTA,
        Math.max(-MAX_WHEEL_DELTA, e.deltaY)
      )
      if (wheelRef.current < 0)
        wheelRef.current =
          overflowBehavior === 'loopStart' || overflowBehavior === 'loopBoth'
            ? wheelRef.current + max
            : 0
      else if (wheelRef.current > max)
        wheelRef.current =
          overflowBehavior === 'loopEnd' || overflowBehavior === 'loopBoth'
            ? wheelRef.current - max
            : max

      if (
        !(
          overflowBehavior === 'overflow' &&
          (wheelRef.current === max || wheelRef.current === 0)
        )
      )
        e.preventDefault()
    }
    divToWatch.addEventListener('wheel', onWheel)

    let running = true
    let prevFrame = -1
    let prevTime = 0

    const tick = (time: DOMHighResTimeStamp) => {
      if (Math.abs(prevFrame - wheelRef.current) > PRECISION) {
        const timeDelta = time - prevTime
        // find shortest length
        const frameDelta = getFrameDelta(
          wheelRef.current,
          prevFrame,
          max,
          0,
          overflowBehavior
        )

        prevFrame += frameDelta * LERP * timeDelta
        if (prevFrame < 0)
          prevFrame =
            overflowBehavior === 'loopStart' || overflowBehavior === 'loopBoth'
              ? max + prevFrame
              : 0
        else if (prevFrame > max)
          prevFrame =
            overflowBehavior === 'loopEnd' || overflowBehavior === 'loopBoth'
              ? prevFrame - max
              : max

        callbacksRef.current.run(prevFrame)
        prevTime = time
      }

      prevTime = time
      if (running) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    return () => {
      divToWatch.removeEventListener('wheel', onWheel)
      running = false
    }
  }, [max, overflowBehavior])

  return (
    <WheelAnimationContext.Provider value={callbacksRef}>
      <div ref={divRef} {...props}>
        {children}
      </div>
    </WheelAnimationContext.Provider>
  )
}

function getFrameDelta(
  target: number,
  current: number,
  max: number,
  min: number,
  overflowBehavior: OverflowBehavior
) {
  const delta = target - current
  if (delta > 0) {
    //정방향 혹은 역방향 루프 통과
    const forwardDelta = target - current
    if (!(overflowBehavior === 'loopStart' || overflowBehavior === 'loopBoth'))
      return forwardDelta
    const backwardDelta = current - min + max - target
    if (forwardDelta > backwardDelta) return -backwardDelta
    return forwardDelta
  } else {
    //역방향 혹은 정방향 루프 통과
    const backwardDelta = current - target
    if (!(overflowBehavior === 'loopEnd' || overflowBehavior === 'loopBoth'))
      return -backwardDelta
    const forwardDelta = max - current + target - min
    if (backwardDelta > forwardDelta) return forwardDelta
    return -backwardDelta
  }
}

export function useWheelAnimationFrame(callback: (frame: number) => void) {
  const wheel = useContext(WheelAnimationContext)
  if (wheel === null)
    throw new Error('must be used inside wheel animation provider')

  useEffect(() => {
    const wheelCallbacks = wheel.current
    const prevCallback = wheelCallbacks.addCallback(callback)
    return () => wheelCallbacks.removeCallback(prevCallback)
  }, [callback, wheel])
}

interface WheelCallbacks {
  callbacks: Set<(frame: number) => void>
  addCallback: (callback: (frame: number) => void) => (frame: number) => void
  removeCallback: (callback: (frame: number) => void) => void
  run: (frame: number) => void
}

export const WheelAnimationContext =
  createContext<React.MutableRefObject<WheelCallbacks> | null>(null)
