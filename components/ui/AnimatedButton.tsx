'use client';

import { forwardRef, ReactNode } from 'react';

import { VariantProps } from 'class-variance-authority';
import { motion, MotionProps, Variants } from 'framer-motion';

import { Button, buttonVariants } from '@/components/ui/button';
import { MOTION_VARIANTS, ANIMATION_CLASSES } from '@/lib/animations';
import { cn } from '@/lib/utils';

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

interface AnimatedButtonProps extends Omit<ButtonProps, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'> {
  children: ReactNode;
  animation?: 'default' | 'pulse' | 'bounce' | 'glow' | 'slide' | 'none';
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  ripple?: boolean;
  motionProps?: MotionProps;
  variant?: ButtonProps['variant'];
  className?: string;
  asChild?: boolean;
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(({
  children,
  animation = 'default',
  loading = false,
  icon,
  iconPosition = 'left',
  ripple = false,
  motionProps,
  className,
  disabled,
  onClick,
  asChild,
  variant,
  ...props
}, ref) => {
  const isDisabled = disabled || loading;

  // Animation variants based on type
  const getAnimationVariants = (): Variants => {
    switch (animation) {
      case 'pulse':
        return {
          ...MOTION_VARIANTS.button,
          hover: {
            ...MOTION_VARIANTS.button.hover,
            boxShadow: [
              '0 0 0 0 rgba(var(--primary-orange-rgb), 0.7)',
              '0 0 0 10px rgba(var(--primary-orange-rgb), 0)',
              '0 0 0 0 rgba(var(--primary-orange-rgb), 0)',
            ],
            transition: {
              duration: 0.6,
              repeat: Infinity,
            },
          },
        };
      case 'bounce':
        return {
          ...MOTION_VARIANTS.button,
          hover: {
            y: [0, -2, 0],
            scale: 1.05,
            transition: {
              y: {
                duration: 0.3,
                repeat: 2,
              },
              scale: {
                duration: 0.1,
              },
            },
          },
        };
      case 'glow':
        return {
          ...MOTION_VARIANTS.button,
          hover: {
            ...MOTION_VARIANTS.button.hover,
            boxShadow: [
              '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              '0 10px 25px -5px rgba(var(--primary-orange-rgb), 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
            ],
            transition: {
              duration: 0.3,
            },
          },
        };
      case 'slide':
        return {
          rest: {
            backgroundPosition: '0% 50%',
            transition: { duration: 0.3 },
          },
          hover: {
            backgroundPosition: '100% 50%',
            scale: 1.02,
            transition: { duration: 0.3 },
          },
          tap: {
            scale: 0.98,
            transition: { duration: 0.1 },
          },
        };
      case 'none':
        return {
          rest: { opacity: 1 },
          hover: { opacity: 1 },
          tap: { opacity: 1 },
        };
      default:
        return MOTION_VARIANTS.button;
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Ripple effect
    if (ripple && !isDisabled) {
      const button = e.currentTarget;
      const ripple = document.createElement('span');
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple-effect');

      button.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    }

    onClick?.(e);
  };

  const buttonContent = (
    <span className="inline-flex items-center">
      {loading && (
        <motion.div
          className="mr-2"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
        </motion.div>
      )}

      {icon && iconPosition === 'left' && !loading && (
        <motion.span
          className="mr-2"
          animate={animation === 'bounce' ? { y: [0, -1, 0] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {icon}
        </motion.span>
      )}

      <motion.span
        animate={loading ? { opacity: 0.7 } : { opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.span>

      {icon && iconPosition === 'right' && !loading && (
        <motion.span
          className="ml-2"
          animate={animation === 'bounce' ? { y: [0, -1, 0] } : {}}
          transition={{ duration: 1, repeat: Infinity, delay: 0.1 }}
        >
          {icon}
        </motion.span>
      )}
    </span>
  );

  const baseClasses = cn(
    // Base transition
    'transition-all duration-200 ease-in-out',

    // Interactive states
    !isDisabled && ANIMATION_CLASSES.buttonPress,
    !isDisabled && 'hover:shadow-lg',

    // Loading state
    loading && 'cursor-wait',

    // Ripple container
    ripple && 'relative overflow-hidden',

    // Animation-specific classes
    animation === 'glow' && 'hover:shadow-orange-500/25',
    animation === 'slide' && 'bg-gradient-to-r from-current to-orange-600 bg-size-200',

    className
  );

  if (animation === 'none' || asChild) {
    return (
      <Button
        ref={ref}
        className={baseClasses}
        disabled={isDisabled}
        onClick={handleClick}
        asChild={asChild}
        variant={variant}
        {...props}
      >
        {buttonContent}
      </Button>
    );
  }

  return (
    <motion.button
      ref={ref}
      className={cn('inline-flex items-center justify-center', baseClasses)}
      variants={getAnimationVariants()}
      initial="rest"
      whileHover={!isDisabled ? "hover" : "rest"}
      whileTap={!isDisabled ? "tap" : "rest"}
      disabled={isDisabled}
      onClick={handleClick}
      {...motionProps}
      {...props}
    >
      {buttonContent}
    </motion.button>
  );
});

AnimatedButton.displayName = 'AnimatedButton';

// Add the ripple effect styles
export const RippleStyles = `
  .ripple-effect {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple-animation 0.6s linear;
    pointer-events: none;
  }

  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }

  .bg-size-200 {
    background-size: 200% 100%;
  }
`;