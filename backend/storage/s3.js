const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const s3 = new S3Client({ region: process.env.AWS_REGION });

async function upload(file) {
  if (!file || !file.path) throw new Error('Invalid file');
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) throw new Error('AWS_S3_BUCKET not configured');
  const key = `rmm/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
  const body = fs.createReadStream(file.path);
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: file.mimetype,
  });
  await s3.send(cmd);
  const url = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  fs.unlink(file.path, () => {});
  return {
    url,
    filename: file.originalname,
    provider: 's3',
    key,
  };
}

module.exports = { upload };
