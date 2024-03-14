# 📜 Rotulus

Minimal wheel/scroll based animator for React

# Installation

```bash
npm install rotulus
```

# Usage

```jsx
function SimpleAnimation() {
  return (
    <WheelAnimationProvider max={1000}>
      <MovingText />
    </WheelAnimationProvider>
  )
}

function MovingText() {
  const moveAnimation = [
    {
      start: 0, // start value
      end: 500, // end value
      startFrame: 0, // start frame
      endFrame: 1000, // end frame
      type: 'translateY', // property to animate
      unit: 'px', // unit for property
    },
  ]
  return (
    <WheelAnimationComponent animations={moveAnimation}>
      Scroll to see this text move!
    </WheelAnimationComponent>
  )
}
```

# How it works

Rotulus uses React's Context API internally.

1. `WheelAnimationProvider` tracks the wheel progress by listening to browser's wheel event
2. `WheelAnimationComponent` registers a callback to the provider's context on mount (The callback contains the logic to update property on each frame)
3. `WheelAnimationProvider` runs the callback on each frame (by using requestAnimationFrame) thus synchronizing every `WheelAnimationComponent` to wheel progress that is in the Provider

It's as simple as that!

# Contribute

Any kind of feedback is welcome!
