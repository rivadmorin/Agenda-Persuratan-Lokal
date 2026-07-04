import React, { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'motion/react';

interface ClickRipple {
  id: string;
  x: number;
  y: number;
}

export default function CursorInteraction() {
  const [isMobile, setIsMobile] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<ClickRipple[]>([]);
  
  // Custom cursor position state
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth springs for trailing halo effect
  const springConfig = { damping: 30, stiffness: 280, mass: 0.6 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Check if the device has a mouse (not touch-only)
    const mediaQuery = window.matchMedia('(pointer: fine)');
    setIsMobile(!mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsMobile(!e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    }

    // Mouse movement listener
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      // Check if hovering over any clickable or interactive element
      const target = e.target as HTMLElement;
      if (target) {
        const isClickable = 
          target.tagName === 'BUTTON' || 
          target.tagName === 'A' || 
          target.tagName === 'INPUT' || 
          target.tagName === 'SELECT' || 
          target.tagName === 'TEXTAREA' || 
          target.closest('button') || 
          target.closest('a') || 
          target.closest('.interactive-card') ||
          target.classList.contains('cursor-pointer');
        
        setIsHovered(!!isClickable);
      }
    };

    // Click particle trigger
    const handleWindowClick = (e: MouseEvent) => {
      const newRipple: ClickRipple = {
        id: `${Date.now()}-${Math.random()}`,
        x: e.clientX,
        y: e.clientY
      };
      setRipples(prev => [...prev, newRipple].slice(-10)); // Keep max 10 ripples
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleWindowClick);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleWindowClick);
    };
  }, [mouseX, mouseY]);

  // Handle removing completed ripples
  const removeRipple = (id: string) => {
    setRipples(prev => prev.filter(r => r.id !== id));
  };

  if (isMobile) return (
    // Only render touch click ripples on mobile without custom cursors
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.div
            key={ripple.id}
            initial={{ opacity: 0.8, scale: 0 }}
            animate={{ opacity: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            onAnimationComplete={() => removeRipple(ripple.id)}
            style={{
              position: 'fixed',
              left: ripple.x - 24,
              top: ripple.y - 24,
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: '2px solid rgba(59, 130, 246, 0.5)',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              pointerEvents: 'none'
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none">
      {/* Click ripple animation rings */}
      <AnimatePresence>
        {ripples.map(ripple => (
          <React.Fragment key={ripple.id}>
            {/* Primary expanding ring */}
            <motion.div
              initial={{ opacity: 0.6, scale: 0.1 }}
              animate={{ opacity: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.1, 0.8, 0.3, 1] }}
              onAnimationComplete={() => removeRipple(ripple.id)}
              style={{
                position: 'fixed',
                left: ripple.x - 40,
                top: ripple.y - 40,
                width: 80,
                height: 80,
                borderRadius: '50%',
                border: '1.5px solid rgba(59, 130, 246, 0.4)',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            {/* Secondary micro-particles */}
            <motion.div
              initial={{ opacity: 0.8, scale: 0 }}
              animate={{ opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                left: ripple.x - 15,
                top: ripple.y - 15,
                width: 30,
                height: 30,
                borderRadius: '50%',
                backgroundColor: 'rgba(59, 130, 246, 0.25)',
                pointerEvents: 'none',
                filter: 'blur(4px)'
              }}
            />
          </React.Fragment>
        ))}
      </AnimatePresence>

      {/* Trailing Outer Halo */}
      <motion.div
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: isHovered ? 44 : 26,
          height: isHovered ? 44 : 26,
          backgroundColor: isHovered ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.03)',
          borderColor: isHovered ? 'rgba(59, 130, 246, 0.45)' : 'rgba(148, 163, 184, 0.25)',
          borderWidth: isHovered ? '2px' : '1px'
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 220 }}
        className="fixed rounded-full border pointer-events-none flex items-center justify-center transition-colors duration-150"
      >
        {/* Inner dynamic ring */}
        <div className={`w-1 h-1 rounded-full bg-blue-500/30 transition-all duration-150 ${isHovered ? 'scale-[3]' : ''}`} />
      </motion.div>

      {/* Precise Pointer Dot */}
      <motion.div
        style={{
          x: mouseX,
          y: mouseY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isHovered ? 0.5 : 1,
          backgroundColor: isHovered ? '#2563eb' : '#3b82f6',
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="fixed w-2 h-2 rounded-full pointer-events-none shadow-[0_0_10px_rgba(59,130,246,0.6)]"
      />
    </div>
  );
}
