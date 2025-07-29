const multer = require('multer');
const { storage } = require('../cloudinary'); // adjust path if needed

module.exports = multer({ storage });
