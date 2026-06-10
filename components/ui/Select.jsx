'use client';

import React, { useId } from 'react';

export function Select({
  label,
  value,
  onChange,
  options = [], // array of { value, label } or string values
  error,
  required = false,
  disabled = false,
  className = '',
  selectClassName = '',
  name,
  ...props
}) {
  const selectId = useId();
  const errorId = useId();

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-fe-dark font-sans flex items-center gap-0.5"
        >
          {label}
          {required && <span className="text-red-500" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : undefined}
          className={`w-full px-4 py-2.5 rounded-lg border text-sm font-sans transition-all bg-white text-fe-dark focus:outline-none focus:ring-2 focus:ring-fe-teal focus:ring-offset-1 disabled:opacity-50 disabled:bg-gray-50 appearance-none ${
            error
              ? 'border-red-300 ring-2 ring-red-200'
              : 'border-fe-muted focus:border-fe-teal'
          } ${selectClassName}`}
          {...props}
        >
          {options.map((opt, idx) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={idx} value={optVal}>
                {optLabel}
              </option>
            );
          })}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-fe-gray">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      </div>

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
