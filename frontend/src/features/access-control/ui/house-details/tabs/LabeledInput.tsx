'use client';

import { useId, type ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';

interface LabeledInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LabeledInput({
  label,
  placeholder,
  value,
  onChange,
  type,
  size,
  className,
}: LabeledInputProps) {
  const inputId = useId();
  const sizeClass =
    size === 'sm' ? 'h-8 text-sm' : size === 'lg' ? 'h-10 text-base' : 'h-9 text-sm';
  return (
    <div className={className ? `space-y-1 ${className}` : 'space-y-1'}>
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <Input
        id={inputId}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={sizeClass}
      />
    </div>
  );
}
