import { useState, useEffect, useRef } from 'react';

interface CatDesktopProps {
  onClick: () => void;
  x?: number;
  y?: number;
}

export default function CatDesktop({ onClick, x = 40, y = 40 }: CatDesktopProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [blinkPhase, setBlinkPhase] = useState(0); // 0=open, 1=closing, 2=closed, 3=opening
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Breathing animation
  const [breathOffset, setBreathOffset] = useState(0);
  const breathRef = useRef(0);

  useEffect(() => {
    let frame: number;
    const animate = () => {
      breathRef.current += 0.03;
      setBreathOffset(Math.sin(breathRef.current) * 3);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Random blinking
  useEffect(() => {
    const blinkCycle = () => {
      // Random interval between 2-6 seconds
      const delay = 2000 + Math.random() * 4000;
      const timer = setTimeout(() => {
        setBlinkPhase(1); // start closing
        setTimeout(() => setBlinkPhase(2), 60); // closed
        setTimeout(() => setBlinkPhase(3), 120); // opening
        setTimeout(() => setBlinkPhase(0), 180); // open
        blinkCycle();
      }, delay);
      return timer;
    };
    const timer = blinkCycle();
    return () => clearTimeout(timer);
  }, []);

  // Show tooltip on hover after delay
  useEffect(() => {
    if (isHovered) {
      tooltipTimer.current = setTimeout(() => setTooltipVisible(true), 800);
    } else {
      if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
      setTooltipVisible(false);
    }
    return () => { if (tooltipTimer.current) clearTimeout(tooltipTimer.current); };
  }, [isHovered]);

  // Cat eye style based on blink phase
  const eyeScaleY = blinkPhase === 0 || blinkPhase === 3 ? 1 : blinkPhase === 1 ? 0.3 : 0.05;

  return (
    <div
      className="absolute flex flex-col items-center cursor-pointer select-none"
      style={{
        left: x,
        top: y + breathOffset,
        width: '80px',
        zIndex: 20,
        transition: 'transform 0.1s ease',
        transform: isPressed ? 'scale(0.95)' : isHovered ? 'scale(1.05)' : 'scale(1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={onClick}
    >
      {/* Cat Image Container */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '12px',
          backgroundColor: isHovered ? 'rgba(86,156,214,0.15)' : 'transparent',
          transition: 'background-color 0.2s ease',
        }}
      >
        <img
          src="/images/cat.png"
          alt="助手"
          className="pixelated"
          style={{
            width: '64px',
            height: '64px',
            imageRendering: 'pixelated',
            filter: isHovered ? 'brightness(1.15)' : 'brightness(1)',
            transition: 'filter 0.2s ease',
          }}
          draggable={false}
        />

        {/* Animated eyes overlay for blinking effect */}
        <div
          className="absolute flex gap-2"
          style={{
            top: '22px',
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: eyeScaleY < 0.5 ? 0 : 0,
            pointerEvents: 'none',
          }}
        >
          <div style={{ width: '6px', height: `${6 * eyeScaleY}px`, backgroundColor: '#222', borderRadius: '50%' }} />
          <div style={{ width: '6px', height: `${6 * eyeScaleY}px`, backgroundColor: '#222', borderRadius: '50%' }} />
        </div>
      </div>

      {/* Label */}
      <span
        className="mt-1 px-1.5 py-0.5 rounded text-center"
        style={{
          fontSize: '11px',
          color: isHovered ? '#fff' : '#d4d4d4',
          backgroundColor: isHovered ? 'rgba(86,156,214,0.5)' : 'transparent',
          transition: 'all 0.15s ease',
          textShadow: isHovered ? 'none' : '0 1px 3px rgba(0,0,0,0.8)',
          maxWidth: '76px',
          wordBreak: 'break-word',
        }}
      >
        对话
      </span>

      {/* Tooltip */}
      {tooltipVisible && (
        <div
          className="absolute flex items-center gap-1.5 px-2.5 py-1 rounded-md whitespace-nowrap"
          style={{
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%) translateY(-4px)',
            backgroundColor: 'rgba(45,45,45,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '11px',
            color: '#d4d4d4',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            animation: 'fadeInUp 0.15s ease-out',
            zIndex: 50,
          }}
        >
          <span>点击开始对话</span>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(0); }
          to { opacity: 1; transform: translateX(-50%) translateY(-4px); }
        }
        .pixelated {
          image-rendering: pixelated;
          image-rendering: crisp-edges;
        }
      `}</style>
    </div>
  );
}
