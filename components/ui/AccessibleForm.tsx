'use client';

import { forwardRef, ReactNode, useState, useId } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFormAccessibility, useScreenReader } from '@/hooks/useAccessibility';

// Accessible Form Field
interface AccessibleFieldProps {
  children: ReactNode;
  label: string;
  error?: string;
  help?: string;
  required?: boolean;
  className?: string;
}

export function AccessibleField({
  children,
  label,
  error,
  help,
  required = false,
  className = ''
}: AccessibleFieldProps) {
  const fieldId = useId();
  const errorId = useId();
  const helpId = useId();

  return (
    <div className={`space-y-2 ${className}`}>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      <div className="relative">
        {/* Clone children and add accessibility props */}
        {typeof children === 'object' && children && 'props' in children
          ? {
              ...children,
              props: {
                ...children.props,
                id: fieldId,
                'aria-invalid': error ? 'true' : 'false',
                'aria-describedby': `${error ? errorId + ' ' : ''}${help ? helpId : ''}`.trim() || undefined,
                'aria-required': required
              }
            }
          : children}
      </div>

      {help && (
        <p id={helpId} className="text-sm text-gray-600">
          {help}
        </p>
      )}

      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          className="flex items-center gap-2 text-sm text-red-600"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}

// Accessible Input
interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  help?: string;
  showPasswordToggle?: boolean;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(({
  label,
  error,
  help,
  required,
  type = 'text',
  showPasswordToggle = false,
  className = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const fieldId = useId();
  const errorId = useId();
  const helpId = useId();

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <AccessibleField
      label={label}
      error={error}
      help={help}
      required={required}
    >
      <div className="relative">
        <input
          ref={ref}
          id={fieldId}
          type={inputType}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={`${error ? errorId + ' ' : ''}${help ? helpId : ''}`.trim() || undefined}
          aria-required={required}
          className={`
            block w-full px-3 py-2 border rounded-md shadow-sm
            ${error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }
            focus:outline-none focus:ring-1
            disabled:bg-gray-50 disabled:text-gray-500
            ${showPasswordToggle ? 'pr-10' : ''}
            ${className}
          `}
          {...props}
        />

        {showPasswordToggle && type === 'password' && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        )}
      </div>
    </AccessibleField>
  );
});

AccessibleInput.displayName = 'AccessibleInput';

// Accessible Textarea
interface AccessibleTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  help?: string;
  maxLength?: number;
  showCharCount?: boolean;
}

export const AccessibleTextarea = forwardRef<HTMLTextAreaElement, AccessibleTextareaProps>(({
  label,
  error,
  help,
  required,
  maxLength,
  showCharCount = false,
  className = '',
  value = '',
  ...props
}, ref) => {
  const fieldId = useId();
  const errorId = useId();
  const helpId = useId();
  const charCountId = useId();

  const currentLength = String(value).length;
  const remaining = maxLength ? maxLength - currentLength : undefined;

  return (
    <AccessibleField
      label={label}
      error={error}
      help={help}
      required={required}
    >
      <textarea
        ref={ref}
        id={fieldId}
        maxLength={maxLength}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={`
          ${error ? errorId + ' ' : ''}
          ${help ? helpId + ' ' : ''}
          ${showCharCount ? charCountId : ''}
        `.trim() || undefined}
        aria-required={required}
        className={`
          block w-full px-3 py-2 border rounded-md shadow-sm
          ${error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }
          focus:outline-none focus:ring-1
          disabled:bg-gray-50 disabled:text-gray-500
          ${className}
        `}
        value={value}
        {...props}
      />

      {showCharCount && maxLength && (
        <div
          id={charCountId}
          className={`text-xs mt-1 text-right ${
            remaining !== undefined && remaining < 10 ? 'text-red-600' : 'text-gray-500'
          }`}
          aria-live="polite"
        >
          {currentLength}/{maxLength} characters
          {remaining !== undefined && remaining < 10 && (
            <span className="ml-1">({remaining} remaining)</span>
          )}
        </div>
      )}
    </AccessibleField>
  );
});

AccessibleTextarea.displayName = 'AccessibleTextarea';

// Accessible Select
interface AccessibleSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  help?: string;
  placeholder?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

export const AccessibleSelect = forwardRef<HTMLSelectElement, AccessibleSelectProps>(({
  label,
  error,
  help,
  required,
  placeholder,
  options,
  className = '',
  ...props
}, ref) => {
  const fieldId = useId();
  const errorId = useId();
  const helpId = useId();

  return (
    <AccessibleField
      label={label}
      error={error}
      help={help}
      required={required}
    >
      <select
        ref={ref}
        id={fieldId}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={`${error ? errorId + ' ' : ''}${help ? helpId : ''}`.trim() || undefined}
        aria-required={required}
        className={`
          block w-full px-3 py-2 border rounded-md shadow-sm bg-white
          ${error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }
          focus:outline-none focus:ring-1
          disabled:bg-gray-50 disabled:text-gray-500
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </AccessibleField>
  );
});

AccessibleSelect.displayName = 'AccessibleSelect';

// Accessible Checkbox
interface AccessibleCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
}

export const AccessibleCheckbox = forwardRef<HTMLInputElement, AccessibleCheckboxProps>(({
  label,
  description,
  error,
  className = '',
  ...props
}, ref) => {
  const fieldId = useId();
  const errorId = useId();
  const descId = useId();

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          id={fieldId}
          type="checkbox"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={`${error ? errorId + ' ' : ''}${description ? descId : ''}`.trim() || undefined}
          className={`
            mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded
            focus:ring-blue-500 focus:ring-2 focus:ring-offset-2
            ${error ? 'border-red-300' : ''}
          `}
          {...props}
        />
        <div className="flex-1">
          <label htmlFor={fieldId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
          {description && (
            <p id={descId} className="text-sm text-gray-600 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          className="flex items-center gap-2 text-sm text-red-600"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
});

AccessibleCheckbox.displayName = 'AccessibleCheckbox';

// Accessible Form Container
interface AccessibleFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode;
  title?: string;
  description?: string;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  errors?: Record<string, string>;
}

export function AccessibleForm({
  children,
  title,
  description,
  onSubmit,
  isSubmitting = false,
  errors = {},
  className = '',
  ...props
}: AccessibleFormProps) {
  const { announce } = useScreenReader();
  const formId = useId();
  const titleId = useId();
  const descId = useId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Announce form submission
    if (isSubmitting) {
      announce('Form is being submitted', 'assertive');
    }

    // Check for errors and announce them
    const errorCount = Object.keys(errors).length;
    if (errorCount > 0) {
      announce(`Form has ${errorCount} error${errorCount === 1 ? '' : 's'}. Please review and correct.`, 'assertive');

      // Focus first field with error
      const firstErrorField = document.querySelector('[aria-invalid="true"]') as HTMLElement;
      firstErrorField?.focus();

      return;
    }

    onSubmit(e);
  };

  return (
    <form
      id={formId}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      onSubmit={handleSubmit}
      noValidate
      className={`space-y-6 ${className}`}
      {...props}
    >
      {title && (
        <div className="space-y-2">
          <h2 id={titleId} className="text-2xl font-bold text-gray-900">
            {title}
          </h2>
          {description && (
            <p id={descId} className="text-gray-600">
              {description}
            </p>
          )}
        </div>
      )}

      {children}

      {/* Global form errors */}
      {Object.keys(errors).length > 0 && (
        <div
          role="alert"
          aria-live="polite"
          className="bg-red-50 border border-red-200 rounded-md p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Please correct the following errors:
              </h3>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

// Form Success Message
interface FormSuccessProps {
  title?: string;
  message: string;
  action?: ReactNode;
}

export function FormSuccess({ title = 'Success!', message, action }: FormSuccessProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="bg-green-50 border border-green-200 rounded-md p-4"
    >
      <div className="flex items-start gap-3">
        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-green-800">{title}</h3>
          <p className="mt-1 text-sm text-green-700">{message}</p>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </div>
  );
}