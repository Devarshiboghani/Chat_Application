const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = 'uploads/files/';
    
    // Determine folder based on mime type
    if (file.mimetype.startsWith('image/')) {
      dest = 'uploads/images/';
    }
    
    // Ensure directory exists
    const fullPath = path.join(__dirname, '..', dest);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const originalExt = path.extname(file.originalname);
    const randomName = crypto.randomBytes(8).toString('hex');
    const safeFilename = `${Date.now()}-${randomName}${originalExt}`;
    cb(null, safeFilename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const allowedFileTypes = [
    'application/pdf', 
    'text/plain',
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/zip'
  ];
  
  const forbiddenExtensions = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.js', '.vbs', '.scr'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (forbiddenExtensions.includes(ext)) {
    return cb(new Error('Executable files are not allowed.'), false);
  }

  if (allowedImageTypes.includes(file.mimetype)) {
    // It's an image
    file.isImage = true;
    cb(null, true);
  } else if (allowedFileTypes.includes(file.mimetype)) {
    // It's a general file
    file.isImage = false;
    cb(null, true);
  } else {
    // Reject
    cb(new Error('Unsupported file format.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    // Start with 10MB limit, we'll check inside the controller if image is > 5MB
    fileSize: 10 * 1024 * 1024 
  },
  fileFilter: fileFilter
});

module.exports = upload;
