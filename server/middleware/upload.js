import multer from 'multer';

const upload = multer({
    dest: 'tmp/uploads/',
    limits: { filesSize: 10 *  1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if(file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Only PDF files are allowed'));
    }
});