const fs = require('fs');
const path = require('path');
const multer = require('multer');
const AppError = require('../utils/AppError');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'productos');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024;
const MAX_ADDITIONAL_IMAGES = 6;

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, uniqueName);
    }
});

function fileFilter(req, file, cb) {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
        return cb(new AppError('Formato de imagen no permitido (solo jpg, png o webp)', 400));
    }
    cb(null, true);
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_SIZE }
});

const uploadImagenProducto = upload.fields([
    { name: 'imagen', maxCount: 1 },
    { name: 'imagenes', maxCount: MAX_ADDITIONAL_IMAGES }
]);

module.exports = { uploadImagenProducto, UPLOAD_DIR, MAX_ADDITIONAL_IMAGES };
