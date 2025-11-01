'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -20,
  },
};

const pageTransition = {
  type: 'tween' as const,
  ease: 'easeInOut' as const,
  duration: 0.2,
};

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Safety timeout: ensure content is visible after transition
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      // Force opacity to 1 if animation didn't complete
      const elements = document.querySelectorAll('[data-page-transition]');
      elements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style.opacity === '0' || window.getComputedStyle(htmlEl).opacity === '0') {
          htmlEl.style.opacity = '1';
        }
      });
    }, pageTransition.duration * 1000 + 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname]);

  // On first mount, show content immediately without animation to avoid hydration issues
  if (!isMounted) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="min-h-screen"
        data-page-transition
        onAnimationStart={(definition) => {
          // Ensure opacity becomes 1 as soon as animation starts for 'in' state
          if (definition === 'in') {
            requestAnimationFrame(() => {
              const element = document.querySelector('[data-page-transition]') as HTMLElement;
              if (element) {
                element.style.opacity = '1';
              }
            });
          }
        }}
        onAnimationComplete={(definition) => {
          // Ensure opacity is 1 after animation completes
          if (definition === 'in') {
            const element = document.querySelector('[data-page-transition]') as HTMLElement;
            if (element) {
              element.style.opacity = '1';
            }
          }
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
