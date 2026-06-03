import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ZodType } from 'zod';

const TIMEOUT_MS = 30_000;

interface OllamaGenerateResponse {
  response: string;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(config: ConfigService) {
    this.baseUrl = (
      config.get<string>('OLLAMA_URL') ?? 'http://localhost:11434'
    ).replace(/\/$/, '');
    this.model = config.get<string>('OLLAMA_MODEL') ?? 'qwen2.5:3b';
  }

  async generateJson<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: ZodType<T>,
    maxRetries = 2,
  ): Promise<T | null> {
    let lastValidationError = '';

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const prompt = this.buildPrompt(
        systemPrompt,
        userPrompt,
        lastValidationError,
      );

      const raw = await this.callOllama(prompt);
      if (raw === null) return null; // network/timeout — no point retrying

      const parsed = this.parseJson(raw);
      if (parsed === null) {
        lastValidationError = 'Response was not valid JSON.';
        this.logger.warn(`Attempt ${attempt + 1}: invalid JSON from LLM`);
        continue;
      }

      const result = schema.safeParse(parsed);
      if (result.success) return result.data;

      lastValidationError = result.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      this.logger.warn(
        `Attempt ${attempt + 1}: schema validation failed — ${lastValidationError}`,
      );
    }

    this.logger.error(`LLM failed after ${maxRetries + 1} attempts`);
    return null;
  }

  private buildPrompt(
    system: string,
    user: string,
    validationError: string,
  ): string {
    const errorHint = validationError
      ? `\n\nPrevious attempt failed validation: ${validationError}\nFix those issues in your response.`
      : '';
    return `${system}\n\n${user}${errorHint}`;
  }

  private async callOllama(prompt: string): Promise<string | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          format: 'json',
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.logger.error(`Ollama HTTP ${res.status}: ${text.slice(0, 200)}`);
        return null;
      }

      const body = (await res.json()) as OllamaGenerateResponse;
      return body.response ?? null;
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        this.logger.error(`Ollama request timed out after ${TIMEOUT_MS}ms`);
      } else {
        this.logger.error(`Ollama request failed: ${(err as Error).message}`);
      }
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  private parseJson(raw: string): unknown {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}
