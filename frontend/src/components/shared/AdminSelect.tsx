'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface AdminSelectOption {
  id: string;
  text: string;
}

interface AdminSelectProps {
  label: string;
  placeholder?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  options: AdminSelectOption[];
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
}

export function AdminSelect({
  label,
  placeholder,
  value,
  onChange,
  options,
  isRequired,
  isDisabled,
  className = 'w-full',
}: AdminSelectProps) {
  return (
    <div className={className}>
      <label className="text-sm font-medium">{label}</label>
      <Select
        value={value ?? undefined}
        onValueChange={(next) => onChange(next ? String(next) : null)}
        disabled={isDisabled}
      >
        <SelectTrigger className="mt-2 w-full bg-background text-foreground">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-popover text-popover-foreground">
          {options
            .filter((opt) => opt.id !== '')
            .map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.text}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      {isRequired ? <span className="sr-only">*</span> : null}
    </div>
  );
}
