import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ProxyService } from './proxy.service';

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  constructor(private readonly proxyService: ProxyService) {}

  use(req: Request, res: Response, next: NextFunction) {
    this.proxyService.resolve(req.path)(req, res, next);
  }
}
