const fs = require('fs');
const path = require('path');

async function upload(file) {
  if (!file || !file.path) {
    throw new Error('Invalid file');
  }

  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const safeName = file.originalname.replace(/\s+/g, '_');
  const filename = `${Date.now()}-${safeName}`;
  const destPath = path.join(uploadsDir, filename);

  await fs.promises.rename(file.path, destPath);

  return {
    url: `/uploads/${filename}`,
    filename: file.originalname,
    provider: 'local',
    key: filename,
    filepath: destPath
  };
}

module.exports = { upload };
