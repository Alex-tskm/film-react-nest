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
  getAfishaFiles(@Res() res: Response) {
    console.log('🔎 Получен запрос на /api/content/afisha');

    // Исправленный путь — выберите подходящий вариант
    const contentPath = path.join(process.cwd(), 'public', 'content', 'afisha');
    console.log('📁 Путь к директории:', contentPath);

    if (!fs.existsSync(contentPath)) {
      console.error('❌ Директория не существует:', contentPath);
      return res.status(404).send('Directory not found');
    }

    fs.readdir(contentPath, (err, files) => {
      if (err) {
        console.error('❌ Ошибка чтения директории:', err);
        return res.status(500).send('Error reading directory');
      }

      console.log(`📋 Найдено файлов: ${files.length}`);
      const fileList = files.map(file => ({
        name: file,
        url: `/content/afisha/${file}`
      }));

      res.json(fileList);
    });
  }
}
