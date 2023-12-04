const multer = require('multer');

// const storage = multer.diskStorage({
//     destination(req, file, cb) {
//         cb(null, 'data/');
//     },
//     filename(req, file, cb) {
//         cb(null, `${Date.now()}` + '-' + file.originalname)
//     }
// })

const storage = multer.memoryStorage();

const upload = multer({ storage });

const uploadFile = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            console.log(err); // выводим ошибку в консоль
            return next(err);
        }
        next();
    });
};

module.exports = upload;