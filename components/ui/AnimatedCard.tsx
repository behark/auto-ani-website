'use client';

import { forwardRef, ReactNode } from 'react';

import { motion, MotionProps, useReducedMotion, Variants } from 'framer-motion';

import { Card, CardProps } from '@/components/ui/card';
import { MOTION_VARIANTS, ANIMATION_CLASSES } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface AnimatedCardProps extends Omit<CardProps, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'> {
  children: ReactNode;
  animation?: 'hover' | 'lift' | 'glow' | 'scale' | 'rotate' | 'none';
  delay?: number;
  duration?: number;
  hover?: boolean;
  stagger?: boolean;
  onView?: boolean;
  motionProps?: MotionProps;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(({
  children,
  animation = 'hover',
  delay = 0,
  duration = 0.2,
  hover = true,
  stagger = false,
  onView = false,
  motionProps,
  className,
  ...props
}, ref) => {
  const shouldReduceMotion = useReducedMotion();

  // Animation variants based on type
  const getAnimationVariants = (): Variants => {
    if (shouldReduceMotion) {
      return {
        rest: { opacity: 1 },
        hover: { opacity: 1 },
        tap: { opacity: 1 },
      };
    }

    switch (animation) {
      case 'lift':
        return {
          rest: {
            y: 0,
            scale: 1,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            transition: {
              duration,
              ease: "easeOut",
            },
          },
          hover: {
            y: -8,
            scale: 1.02,
            boxShadow: '0 25px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            transition: {
              duration,
              ease: "easeOut",
            },
          },
          tap: {
            y: -2,
            scale: 0.98,
            transition: {
              duration: 0.1,
            },
          },
        };

      case 'glow':
        return {
          rest: {
            scale: 1,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            transition: {
              duration,
            },
          },
          hover: {
            scale: 1.03,
            boxShadow: [
              '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              '0 10px 25px -5px rgba(var(--primary-orange-rgb), 0.25), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            ],
            transition: {
              duration: 0.3,
              boxShadow: {
                duration: 0.4,
              },
            },
          },
          tap: {
            scale: 0.97,
            transition: {
              duration: 0.1,
            },
          },
        };

      case 'scale':
        return {
          rest: {
            scale: 1,
            transition: {
              duration,
              ease: "easeOut",
            },
          },
          hover: {
            scale: 1.05,
            transition: {
              duration,
              ease: "easeOut",
            },
          },
          tap: {
            scale: 0.95,
            transition: {
              duration: 0.1,
            },
          },
        };

      case 'rotate':
        return {
          rest: {
            rotate: 0,
            scale: 1,
            transition: {
              duration,
            },
          },
          hover: {
            rotate: 2,
            scale: 1.02,
            transition: {
              duration,
            },
          },
          tap: {
            rotate: -1,
            scale: 0.98,
            transition: {
              duration: 0.1,
            },
          },
        };

      case 'none':
        return {
          rest: { opacity: 1 },
          hover: { opacity: 1 },
          tap: { opacity: 1 },
        };

      default: // 'hover'
        return MOTION_VARIANTS.card;
    }
  };

  // On-view animation variants
  const getOnViewVariants = () => {
    if (shouldReduceMotion || !onView) return {
      hidden: { opacity: 0 },
      visible: { opacity: 1 }
    };

    return {
      hidden: {
        opacity: 0,
        y: 50,
        scale: 0.95,
      },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          duration: 0.5,
          delay: stagger ? delay : 0,
          ease: "easeOut",
        },
      },
    };
  };

  const baseClasses = cn(
    // Base transition for non-animated properties
    'transition-colors duration-200',

    // Transform optimization
    'transform-gpu',

    // Enhanced shadow on hover for non-motion devices
    shouldReduceMotion && hover && 'hover:shadow-lg',

    className
  );

  // Handle cases where animation is disabled
  if (animation === 'none' || shouldReduceMotion) {
    return (
      <Card
        ref={ref}
        className={cn(
          baseClasses,
          hover && 'hover:shadow-lg transition-shadow duration-200'
        )}
        {...props}
      >
        {children}
      </Card>
    );
  }

  const cardVariants: Variants = {
    ...getAnimationVariants(),
    ...getOnViewVariants(),
  } as Variants;

  return (
    <motion.div
      ref={ref}
      className={cn('block', baseClasses)}
      variants={cardVariants}
      initial={onView ? "hidden" : "rest"}
      animate={onView ? "visible" : undefined}
      whileHover={hover ? "hover" : undefined}
      whileTap={hover ? "tap" : undefined}
      viewport={{ once: true, margin: '-10%' }}
      {...motionProps}
      {...props}
    >
      {children}
    </motion.div>
  );
});

AnimatedCard.displayName = 'AnimatedCard';

// Animated Card Content with stagger effect
interface AnimatedCardContentProps {
  children: ReactNode;
  stagger?: boolean;
  delay?: number;
  className?: string;
}

export function AnimatedCardContent({
  children,
  stagger = false,
  delay = 0,
  className,
}: AnimatedCardContentProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion || !stagger) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.1,
            delayChildren: delay,
          },
        },
      }}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

// Animated Card Grid for collections
interface AnimatedCardGridProps {
  children: ReactNode;
  stagger?: boolean;
  className?: string;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function AnimatedCardGrid({
  children,
  stagger = true,
  className,
  columns = 3,
}: AnimatedCardGridProps) {
  const shouldReduceMotion = useReducedMotion();

  const gridClasses = cn(
    'grid gap-6',
    columns === 1 && 'grid-cols-1',
    columns === 2 && 'grid-cols-1 md:grid-cols-2',
    columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    columns === 5 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
    columns === 6 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6',
    className
  );

  if (shouldReduceMotion || !stagger) {
    return <div className={gridClasses}>{children}</div>;
  }

  return (
    <motion.div
      className={gridClasses}
      variants={MOTION_VARIANTS.container}
      initial="hidden"
      animate="visible"
      viewport={{ once: true, margin: '-10%' }}
    >
      {children}
    </motion.div>
  );
}

// Pre-built animated card variants
export function ProductCard({
  children,
  className,
  ...props
}: Omit<AnimatedCardProps, 'animation'>) {
  return (
    <AnimatedCard
      animation="lift"
      onView
      hover
      className={cn('overflow-hidden', className)}
      {...props}
    >
      {children}
    </AnimatedCard>
  );
}

export function FeatureCard({
  children,
  className,
  ...props
}: Omit<AnimatedCardProps, 'animation'>) {
  return (
    <AnimatedCard
      animation="glow"
      onView
      hover
      className={cn('p-6', className)}
      {...props}
    >
      {children}
    </AnimatedCard>
  );
}

export function StatCard({
  children,
  className,
  ...props
}: Omit<AnimatedCardProps, 'animation'>) {
  return (
    <AnimatedCard
      animation="scale"
      onView
      hover
      className={cn('text-center p-6', className)}
      {...props}
    >
      {children}
    </AnimatedCard>
  );
}