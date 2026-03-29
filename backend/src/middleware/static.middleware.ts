import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class StaticMiddleware implements NestMiddleware {
  private readonly logger = new Logger(StaticMiddleware.name);

  use(req: any, res: any, next: () => void) {
    this.logger.debug('🔎 StaticMiddleware triggered - request received');
    this.logger.debug(`🔎 Request URL: ${req.url}`);

    const staticPath = path.join(process.cwd(), 'public', 'content', 'afisha');
    this.logger.log(`🗂️  StaticMiddleware path: ${staticPath}`);

    // Проверка существования папки
    if (!fs.existsSync(staticPath)) {
      this.logger.error(`❌ Static directory does not exist: ${staticPath}`);
      next();
      return;
    }

    const staticHandler = express.static(staticPath, {
      index: false,
      setHeaders: (res, filePath) => {
        res.setHeader('X-Static-File', 'true');
      }
    });

    staticHandler(req, res, (err) => {
      if (err) {
        this.logger.warn(`❌ Static file not found: ${req.url}`);
        next();
      } else {
        this.logger.log(`✅ Static file served: ${req.url}`);
      }
    });
  }
}
