'use client';

import { useEffect, useRef, forwardRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFocusManagement, useKeyboardNavigation } from '@/hooks/useAccessibility';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  initialFocus?: React.RefObject<HTMLElement>;
  restoreFocus?: boolean;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  className?: string;
}

export const AccessibleModal = forwardRef<HTMLDivElement, AccessibleModalProps>(({
  isOpen,
  onClose,
  children,
  title,
  description,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  initialFocus,
  restoreFocus = true,
  ariaLabelledBy,
  ariaDescribedBy,
  className = ''
}, ref) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const { trapFocus } = useFocusManagement();

  // Handle escape key
  useKeyboardNavigation(
    undefined,
    closeOnEscape ? onClose : undefined
  );

  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Focus management
      const modal = modalRef.current;
      if (modal) {
        // Set up focus trap
        const cleanup = trapFocus(modal);

        // Focus initial element or first focusable element
        setTimeout(() => {
          if (initialFocus?.current) {
            initialFocus.current.focus();
          } else {
            const firstFocusable = modal.querySelector(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            ) as HTMLElement;
            firstFocusable?.focus();
          }
        }, 0);

        return () => {
          cleanup();
          document.body.style.overflow = '';

          // Restore focus to previously active element
          if (restoreFocus && previousActiveElement.current) {
            previousActiveElement.current.focus();
          }
        };
      }
    }
  }, [isOpen, trapFocus, initialFocus, restoreFocus]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'md':
        return 'max-w-lg';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      case 'full':
        return 'max-w-7xl mx-4';
      default:
        return 'max-w-lg';
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleOverlayClick}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy || `modal-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
        aria-describedby={ariaDescribedBy || (description ? `modal-description-${title.replace(/\s+/g, '-').toLowerCase()}` : undefined)}
        className={`relative bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden ${getSizeClasses()} ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2
              id={ariaLabelledBy || `modal-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
              className="text-xl font-semibold text-gray-900"
            >
              {title}
            </h2>
            {description && (
              <p
                id={ariaDescribedBy || `modal-description-${title.replace(/\s+/g, '-').toLowerCase()}`}
                className="mt-1 text-sm text-gray-600"
              >
                {description}
              </p>
            )}
          </div>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close modal"
              className="h-8 w-8 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
          {children}
        </div>
      </div>
    </div>
  );

  // Render modal in portal
  return createPortal(modalContent, document.body);
});

AccessibleModal.displayName = 'AccessibleModal';

// Accessible Modal Trigger Button
interface ModalTriggerProps {
  children: ReactNode;
  onClick: () => void;
  ariaControls?: string;
  ariaExpanded?: boolean;
  className?: string;
}

export function ModalTrigger({
  children,
  onClick,
  ariaControls,
  ariaExpanded = false,
  className = ''
}: ModalTriggerProps) {
  return (
    <Button
      onClick={onClick}
      aria-controls={ariaControls}
      aria-expanded={ariaExpanded}
      aria-haspopup="dialog"
      className={className}
    >
      {children}
    </Button>
  );
}

// Accessible Modal Actions
interface ModalActionsProps {
  children: ReactNode;
  className?: string;
}

export function ModalActions({ children, className = '' }: ModalActionsProps) {
  return (
    <div className={`flex gap-3 justify-end p-6 border-t bg-gray-50 ${className}`}>
      {children}
    </div>
  );
}

// Accessible Modal Content
interface ModalContentProps {
  children: ReactNode;
  className?: string;
}

export function ModalContent({ children, className = '' }: ModalContentProps) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

export default AccessibleModal;