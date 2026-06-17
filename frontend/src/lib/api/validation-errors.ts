import { ApiError } from './core';

export interface ParsedApiValidationError {
  fieldErrors: Record<string, string>;
  formError: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function inferFieldFromMessage(message: string): string | null {
  const lower = message.toLowerCase();
  if (lower.includes('priority')) return 'priority';
  if (lower.includes('name')) return 'name';
  return null;
}

export function parseApiValidationError(error: unknown): ParsedApiValidationError | null {
  if (!(error instanceof ApiError) || !isRecord(error.data)) {
    return null;
  }

  const fieldErrors: Record<string, string> = {};
  const formMessages: string[] = [];
  const rawFieldErrors = error.data.fieldErrors;

  if (Array.isArray(rawFieldErrors)) {
    for (const item of rawFieldErrors) {
      if (!isRecord(item)) continue;
      const message = typeof item.message === 'string' ? item.message.trim() : '';
      if (!message) continue;

      const field = typeof item.field === 'string' ? item.field.trim() : '';
      const targetField = field || inferFieldFromMessage(message);

      if (targetField) {
        fieldErrors[targetField] = message;
      } else {
        formMessages.push(message);
      }
    }
  }

  const responseMessage =
    typeof error.data.message === 'string' ? error.data.message.trim() : '';

  let formError: string | null = null;
  if (formMessages.length > 0) {
    formError = formMessages.join('. ');
  } else if (Object.keys(fieldErrors).length === 0) {
    formError = responseMessage || error.message;
  }

  return { fieldErrors, formError };
}

export function applyApiValidationErrors(
  error: unknown,
  setters: {
    setFieldError: (field: string, message: string | null) => void;
    setFormError: (message: string | null) => void;
  },
  fallbackMessage: string,
) {
  const parsed = parseApiValidationError(error);
  if (!parsed) {
    setters.setFormError(fallbackMessage);
    return;
  }

  for (const [field, message] of Object.entries(parsed.fieldErrors)) {
    setters.setFieldError(field, message);
  }
  setters.setFormError(parsed.formError);
}
