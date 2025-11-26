import cron from 'node-cron';
import fs from 'fs';
import path from 'path';

const tempDir = path.join(__dirname, '../public/uploads/temp');

// Очистка временных файлов старше 1 часа
const cleanupTempFiles = () => {
  if (!fs.existsSync(tempDir)) {
    return;
  }

  const files = fs.readdirSync(tempDir);
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  files.forEach(file => {
    const filePath = path.join(tempDir, file);
    const stats = fs.statSync(filePath);

    if (now - stats.mtime.getTime() > oneHour) {
      fs.unlinkSync(filePath);
    }
  });
};

// Запускаем очистку каждые 30 минут
cron.schedule('*/30 * * * *', cleanupTempFiles);

export default cleanupTempFiles;