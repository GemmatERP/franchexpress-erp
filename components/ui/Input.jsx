'use client';

import React, { useId } from 'react';

export function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = '',
  inputClassName = '',
  name,
  readOnly = false,
  ...props
}) {
  const inputId = useId();
  const errorId = useId();

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-fe-dark font-sans flex items-center gap-0.5"
        >
          {label}
          {required && <span className="text-red-500" aria-hidden="true">*</span>}
        </label>
      )}
      
      <input
        id={inputId}
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        aria-required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        className={`w-full px-4 py-2.5 rounded-lg border text-sm font-sans transition-all bg-white text-fe-dark placeholder-fe-gray focus:outline-none focus:ring-2 focus:ring-fe-teal focus:ring-offset-1 disabled:opacity-50 disabled:bg-gray-50 ${
          error 
            ? 'border-red-300 ring-2 ring-red-200' 
            : readOnly
            ? 'border-fe-muted bg-fe-bg font-mono'
            : 'border-fe-muted focus:border-fe-teal'
        } ${inputClassName}`}
        {...props}
      />
      
      {error && (
        <span
          id={errorId}
          className="text-[11px] font-medium text-red-600 mt-0.5 animate-pulse"
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  );
}
