'use client';

import type { TextLabelConfig } from '../../types/widget.types';

interface Props {
  config: TextLabelConfig;
}

const SIZE_MAP = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg font-semibold',
  xl: 'text-2xl font-bold',
};

const ALIGN_MAP = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function TextLabelWidget({ config }: Props) {
  if (config.style === 'divider') {
    return (
      <div className="flex items-center h-full px-2">
        <div className="flex-1 border-t border-border" />
        {config.text && (
          <>
            <span className="px-3 text-xs text-muted-foreground whitespace-nowrap">{config.text}</span>
            <div className="flex-1 border-t border-border" />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center h-full px-3">
      <p
        className={`w-full ${SIZE_MAP[config.fontSize]} ${ALIGN_MAP[config.align]} ${
          config.style === 'subtitle' ? 'text-muted-foreground' : 'text-foreground'
        }`}
      >
        {config.text}
      </p>
    </div>
  );
}
