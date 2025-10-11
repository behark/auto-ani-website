// Animation utilities and configurations for smooth micro-interactions

export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 500,
} as const;

export const EASING = {
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
} as const;

// CSS animation classes for common micro-interactions
export const ANIMATION_CLASSES = {
  // Hover animations
  hoverScale: 'transition-transform duration-200 ease-in-out hover:scale-105',
  hoverScaleSmall: 'transition-transform duration-150 ease-in-out hover:scale-102',
  hoverLift: 'transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg',
  hoverGlow: 'transition-all duration-200 ease-in-out hover:shadow-xl hover:shadow-orange-500/25',

  // Focus animations
  focusRing: 'focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-150',
  focusScale: 'focus:scale-105 transition-transform duration-150',

  // Loading animations
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  spin: 'animate-spin',
  ping: 'animate-ping',

  // Entrance animations
  fadeIn: 'animate-in fade-in duration-300',
  slideInUp: 'animate-in slide-in-from-bottom-4 duration-300',
  slideInDown: 'animate-in slide-in-from-top-4 duration-300',
  slideInLeft: 'animate-in slide-in-from-left-4 duration-300',
  slideInRight: 'animate-in slide-in-from-right-4 duration-300',
  zoomIn: 'animate-in zoom-in-95 duration-300',

  // Exit animations
  fadeOut: 'animate-out fade-out duration-200',
  slideOutUp: 'animate-out slide-out-to-top-4 duration-200',
  slideOutDown: 'animate-out slide-out-to-bottom-4 duration-200',
  slideOutLeft: 'animate-out slide-out-to-left-4 duration-200',
  slideOutRight: 'animate-out slide-out-to-right-4 duration-200',
  zoomOut: 'animate-out zoom-out-95 duration-200',

  // Interactive elements
  buttonPress: 'active:scale-95 transition-transform duration-75',
  cardHover: 'transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-1',
  linkHover: 'transition-colors duration-150 hover:text-orange-500',

  // Page transitions
  pageEnter: 'animate-in fade-in slide-in-from-bottom-4 duration-500',
  pageExit: 'animate-out fade-out slide-out-to-top-4 duration-300',
} as const;

// Framer Motion variants for complex animations
export const MOTION_VARIANTS = {
  // Container animations (stagger children)
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  },

  // Item animations (used with container)
  item: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  },

  // Card animations
  card: {
    rest: {
      scale: 1,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      transition: {
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    hover: {
      scale: 1.02,
      y: -4,
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      transition: {
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1,
      },
    },
  },

  // Button animations
  button: {
    rest: {
      scale: 1,
      transition: {
        duration: 0.1,
      },
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.1,
      },
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.05,
      },
    },
  },

  // Modal/Dialog animations
  modal: {
    hidden: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  },

  // Navigation animations
  nav: {
    hidden: {
      y: -100,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  },

  // Image animations
  image: {
    hidden: {
      opacity: 0,
      scale: 1.1,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  },

  // Text animations
  text: {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  },

  // Loading animations
  loading: {
    rotate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      },
    },
    bounce: {
      y: [0, -10, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
} as const;

// Custom CSS animations for complex effects
export const CUSTOM_ANIMATIONS = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  @keyframes typewriter {
    from { width: 0; }
    to { width: 100%; }
  }

  @keyframes blink-caret {
    from, to { border-color: transparent; }
    50% { border-color: currentColor; }
  }

  @keyframes gradient-x {
    0%, 100% { transform: translateX(0%); }
    50% { transform: translateX(-100%); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes glow {
    0%, 100% { box-shadow: 0 0 5px rgba(var(--primary-orange-rgb), 0.2); }
    50% { box-shadow: 0 0 20px rgba(var(--primary-orange-rgb), 0.6); }
  }

  .animate-shimmer {
    animation: shimmer 2s infinite;
  }

  .animate-typewriter {
    animation: typewriter 3s steps(40, end), blink-caret 0.75s step-end infinite;
    border-right: 3px solid currentColor;
    white-space: nowrap;
    overflow: hidden;
  }

  .animate-gradient-x {
    animation: gradient-x 3s ease infinite;
    background-size: 200% 200%;
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .animate-glow {
    animation: glow 2s ease-in-out infinite alternate;
  }
`;

// Intersection Observer animation hook utilities
export interface AnimationObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
}

export const createAnimationObserver = (
  callback: (entry: IntersectionObserverEntry) => void,
  options: AnimationObserverOptions = {}
) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true,
    delay = 0,
  } = options;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setTimeout(() => callback(entry), delay);
          if (triggerOnce) {
            observer.unobserve(entry.target);
          }
        }
      });
    },
    {
      threshold,
      rootMargin,
    }
  );

  return observer;
};

// Animation utility functions
export const animationUtils = {
  // Add stagger delay to multiple elements
  addStaggerDelay: (elements: NodeListOf<Element>, baseDelay = 100) => {
    elements.forEach((element, index) => {
      (element as HTMLElement).style.animationDelay = `${index * baseDelay}ms`;
    });
  },

  // Trigger animation on scroll
  animateOnScroll: (selector: string, animationClass: string, options?: AnimationObserverOptions) => {
    const elements = document.querySelectorAll(selector);

    if (elements.length === 0) return;

    const observer = createAnimationObserver(
      (entry) => {
        entry.target.classList.add(animationClass);
      },
      options
    );

    elements.forEach((element) => observer.observe(element));

    return observer;
  },

  // Chain animations
  chainAnimations: async (
    element: HTMLElement,
    animations: Array<{ class: string; duration: number }>
  ) => {
    for (const animation of animations) {
      element.classList.add(animation.class);
      await new Promise((resolve) => setTimeout(resolve, animation.duration));
      element.classList.remove(animation.class);
    }
  },

  // Preload animation classes for better performance
  preloadAnimations: (classes: string[]) => {
    const style = document.createElement('style');
    style.textContent = classes
      .map((cls) => `.${cls} { animation-fill-mode: both; }`)
      .join('\n');
    document.head.appendChild(style);
  },
} as const;

// Performance-optimized animation classes
export const PERFORMANCE_ANIMATIONS = {
  // GPU-accelerated transforms
  gpuAccelerated: 'transform-gpu',
  willChange: 'will-change-transform',

  // Reduced motion support
  respectMotion: 'motion-safe:animate-bounce motion-reduce:animate-none',

  // Hardware acceleration hints
  optimized: 'backface-visibility-hidden perspective-1000',
} as const;