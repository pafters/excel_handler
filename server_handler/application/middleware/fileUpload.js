const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadFile = (req, res, next) => { //тестировка
    upload.single('file')(req, res, (err) => {
        if (err) {
            console.log(err); // выводим ошибку в консоль
            //return next(err);
        }
        next();
    });
};

module.exports = upload;