let impl;
const provider = (process.env.STORAGE_PROVIDER || 'cloudinary').toLowerCase();

if (provider === 's3') {
	impl = require('./s3');
} else if (provider === 'cloudinary') {
	impl = process.env.CLOUDINARY_URL ? require('./cloudinary') : require('./local');
} else if (provider === 'local') {
	impl = require('./local');
} else {
	impl = require('./cloudinary');
}

module.exports = impl;
