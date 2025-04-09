const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure disk storage for files
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    let uploadDir;
    
    // Determine upload directory based on fieldname
    if (file.fieldname === 'certificationPhotos') {
      uploadDir = path.join(__dirname, '../../uploads/certifications');
    } else if (file.fieldname === 'documents') {
      uploadDir = path.join(__dirname, '../../uploads/documents');
    } else {
      uploadDir = path.join(__dirname, '../../uploads');
    }
    
    // Ensure directory exists
    fs.mkdirSync(uploadDir, { recursive: true });
    
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to accept images and documents
const fileFilter = (req, file, cb) => {
  // Accept image files
  if (file.fieldname === 'certificationPhotos' && !file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed for certification photos!"), false);
  }
  
  // Accept documents (PDFs, images, common document types)
  if (file.fieldname === 'documents') {
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Only PDF, images, or document files are allowed!"), false);
    }
  }
  
  // Accept the file
  cb(null, true);
};

// Create the multer instance with configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
});

module.exports = upload;
