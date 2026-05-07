import { Injectable } from '@nestjs/common';

/**
 * In-memory guard that enforces per-scenario debounce and maxConcurrency.
 * Stateless across restarts — acceptable because limits are soft protections.
 */
@Injectable()
export class ConcurrencyGuardService {
  private readonly running = new Map<string, number>();
  private readonly lastFired = new Map<string, number>();

  canFire(
    scenarioId: string,
    debounceMs: number,
    maxConcurrency: number,
  ): boolean {
    const now = Date.now();
    const last = this.lastFired.get(scenarioId) ?? 0;
    if (debounceMs > 0 && now - last < debounceMs) return false;
    const current = this.running.get(scenarioId) ?? 0;
    return current < maxConcurrency;
  }

  acquire(scenarioId: string): void {
    this.lastFired.set(scenarioId, Date.now());
    this.running.set(scenarioId, (this.running.get(scenarioId) ?? 0) + 1);
  }

  release(scenarioId: string): void {
    const current = this.running.get(scenarioId) ?? 1;
    this.running.set(scenarioId, Math.max(0, current - 1));
  }
}
