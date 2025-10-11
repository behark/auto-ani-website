'use client';

import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { MOTION_VARIANTS, ANIMATION_CLASSES } from '@/lib/animations';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  transition?: 'fade' | 'slide' | 'scale' | 'rotate' | 'none';
  duration?: number;
}

export function PageTransition({
  children,
  className = '',
  transition = 'fade',
  duration = 0.3,
}: PageTransitionProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (shouldReduceMotion || transition === 'none') {
    return <div className={className}>{children}</div>;
  }

  const getTransitionVariants = () => {
    switch (transition) {
      case 'slide':
        return {
          initial: { opacity: 0, x: 50 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -50 },
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.05 },
        };
      case 'rotate':
        return {
          initial: { opacity: 0, rotateY: -45 },
          animate: { opacity: 1, rotateY: 0 },
          exit: { opacity: 0, rotateY: 45 },
        };
      default: // 'fade'
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
    }
  };

  const variants = getTransitionVariants();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        className={className}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={{
          duration,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Loading transition component
interface LoadingTransitionProps {
  loading: boolean;
  children: ReactNode;
  loadingComponent?: ReactNode;
  transition?: 'fade' | 'scale' | 'slide';
}

export function LoadingTransition({
  loading,
  children,
  loadingComponent,
  transition = 'fade',
}: LoadingTransitionProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return loading ? (loadingComponent || <DefaultLoader />) : <>{children}</>;
  }

  const getVariants = () => {
    switch (transition) {
      case 'scale':
        return {
          hidden: { opacity: 0, scale: 0.8 },
          visible: { opacity: 1, scale: 1 },
        };
      case 'slide':
        return {
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        };
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        };
    }
  };

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="loading"
          variants={getVariants()}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.2 }}
        >
          {loadingComponent || <DefaultLoader />}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          variants={getVariants()}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Default loader component
function DefaultLoader() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <motion.div
        className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// Staggered children animation
interface StaggerContainerProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
  once?: boolean;
}

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className = '',
  once = true,
}: StaggerContainerProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      initial="hidden"
      animate="visible"
      viewport={{ once }}
    >
      {children}
    </motion.div>
  );
}

// Individual stagger item
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function StaggerItem({ children, className = '', delay = 0 }: StaggerItemProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.4,
            delay,
            ease: [0.25, 0.46, 0.45, 0.94],
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// Scroll-triggered animations
interface ScrollAnimationProps {
  children: ReactNode;
  animation?: 'fadeUp' | 'fadeDown' | 'fadeLeft' | 'fadeRight' | 'scale' | 'rotate';
  threshold?: number;
  rootMargin?: string;
  className?: string;
  delay?: number;
  once?: boolean;
}

export function ScrollAnimation({
  children,
  animation = 'fadeUp',
  threshold = 0.1,
  rootMargin = '0px 0px -10% 0px',
  className = '',
  delay = 0,
  once = true,
}: ScrollAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const getAnimationVariants = () => {
    switch (animation) {
      case 'fadeDown':
        return {
          hidden: { opacity: 0, y: -30 },
          visible: { opacity: 1, y: 0 },
        };
      case 'fadeLeft':
        return {
          hidden: { opacity: 0, x: 30 },
          visible: { opacity: 1, x: 0 },
        };
      case 'fadeRight':
        return {
          hidden: { opacity: 0, x: -30 },
          visible: { opacity: 1, x: 0 },
        };
      case 'scale':
        return {
          hidden: { opacity: 0, scale: 0.8 },
          visible: { opacity: 1, scale: 1 },
        };
      case 'rotate':
        return {
          hidden: { opacity: 0, rotate: -10 },
          visible: { opacity: 1, rotate: 0 },
        };
      default: // 'fadeUp'
        return {
          hidden: { opacity: 0, y: 30 },
          visible: { opacity: 1, y: 0 },
        };
    }
  };

  return (
    <motion.div
      className={className}
      variants={getAnimationVariants()}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: threshold, margin: rootMargin }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
}

// Route transition wrapper for app directory
export function RouteTransition({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <PageTransition className={className} transition="fade">
      <StaggerContainer>
        <StaggerItem>{children}</StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}