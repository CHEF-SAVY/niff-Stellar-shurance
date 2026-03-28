'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

import { Input } from './input'
import { Label } from './label'

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  decimals?: number
  allowNegative?: boolean
  prefix?: string
  suffix?: string
}

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ 
    className, 
    label, 
    error, 
    decimals = 2, 
    allowNegative = false,
    prefix,
    suffix,
    value,
    onChange,
    onBlur,
    ...props 
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState('')

    React.useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value.toString())
      }
    }, [value])

    const validateAndFormat = (inputValue: string): string => {
      let cleaned = inputValue.replace(/[^0-9.-]/g, '')
      
      if (!allowNegative) {
        cleaned = cleaned.replace(/-/g, '')
      }
      
      const parts = cleaned.split('.')
      if (parts.length > 2) {
        cleaned = parts[0] + '.' + parts.slice(1).join('')
      }
      
      if (parts[1] && parts[1].length > decimals) {
        cleaned = parts[0] + '.' + parts[1].substring(0, decimals)
      }
      
      if (cleaned === '' || cleaned === '-') {
        return cleaned
      }
      
      const num = parseFloat(cleaned)
      if (isNaN(num)) {
        return ''
      }
      
      return num.toString()
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = validateAndFormat(e.target.value)
      setInternalValue(formatted)
      
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: formatted
          }
        }
        onChange(syntheticEvent)
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      let formatted = internalValue
      
      if (formatted && formatted !== '-') {
        const num = parseFloat(formatted)
        if (!isNaN(num)) {
          formatted = num.toFixed(decimals)
        }
      }
      
      setInternalValue(formatted)
      
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: formatted
          }
        }
        onChange(syntheticEvent)
      }
      
      if (onBlur) {
        onBlur(e)
      }
    }

    const id = React.useId()

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={id} className={cn(error && 'text-destructive')}>
            {label}
          </Label>
        )}
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {prefix}
            </span>
          )}
          <Input
            {...props}
            id={id}
            ref={ref}
            type="text"
            value={internalValue}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn(
              prefix && 'pl-8',
              suffix && 'pr-8',
              error && 'border-destructive focus:ring-destructive',
              className
            )}
            inputMode="decimal"
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>
        {error && (
          <p id={`${id}-error`} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
NumericInput.displayName = 'NumericInput'

export { NumericInput }
