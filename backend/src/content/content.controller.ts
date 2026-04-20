import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('content')
export class ContentController {
  constructor() {
    console.log('✅ ContentController успешно инициализирован');
  }

  @Get('afisha')
  getAfishaImage(@Res() res: Response) {
    console.log('🔎 Получен запрос на /api/content/afisha');

    const contentPath = path.join(process.cwd(), 'public', 'content', 'afisha');
    console.log('📁 Путь к директории:', contentPath);

    if (!fs.existsSync(contentPath)) {
      console.error('❌ Директория не существует:', contentPath);
      return res.status(404).send('Directory not found');
    }

    const files = fs.readdirSync(contentPath);
    const firstJpg = files.find((f) => f.endsWith('.jpg'));

    if (!firstJpg) {
      console.error('❌ Изображения не найдены в директории:', contentPath);
      return res.status(404).send('No images found');
    }

    console.log(`📋 Отдаём изображение: ${firstJpg}`);
    res.sendFile(path.join(contentPath, firstJpg));
  }
}
