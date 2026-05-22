import { Controller, Get } from '@nestjs/common';
import { Observable, of } from 'rxjs';

@Controller('health')
export class HealthController {
  @Get()
  check(): Observable<{ status: string; timestamp: string }> {
    return of({ status: 'ok', timestamp: new Date().toISOString() });
  }
}
