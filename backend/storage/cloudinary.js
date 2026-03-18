const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// cloudinary reads CLOUDINARY_URL from env if present
cloudinary.config({ secure: true });

async function upload(file) {
  if (!file || !file.path) {
    throw new Error('Invalid file');
  }
  const options = { folder: 'rmm', resource_type: 'auto' };
  const res = await cloudinary.uploader.upload(file.path, options);
  // remove temp file
  fs.unlink(file.path, () => {});
  return {
    url: res.secure_url,
    filename: file.originalname,
    provider: 'cloudinary',
    key: res.public_id
  };
}

module.exports = { upload };
