import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Общие стили для всех кнопок приложения. Меняйте здесь — применится везде. */
const appButtonStyles = 'cursor-pointer';

type ButtonVariant = React.ComponentProps<typeof Button>['variant'];
type AppButtonProps = Omit<React.ComponentProps<typeof Button>, 'variant'> & {
  variant?: ButtonVariant | 'primary';
};

function AppButton({ className, type = 'button', variant, ...props }: AppButtonProps) {
  const mappedVariant = variant === 'primary' ? 'default' : variant;
  return (
    <Button
      className={cn(appButtonStyles, className)}
      type={type}
      variant={mappedVariant}
      {...props}
    />
  );
}

export { AppButton, appButtonStyles };
export type { AppButtonProps };
