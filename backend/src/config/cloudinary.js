const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// As variáveis process.env.XXX funcionam se o arquivo .env estiver correto
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'power_soccer_v2_elenco',
        allowed_formats: ['jpg', 'png', 'jpeg']
    },
});

const upload = multer({ storage: storage });

module.exports = upload;