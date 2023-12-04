const Router = require('express');
const FileController = require('../controllers/FileController');
const router = new Router();
const uploadFile = require('../middleware/fileUpload');

router.post('/upload-file', uploadFile.single('file'), FileController.fileUpload);

router.post('/add-to-main-table', FileController.addToMainTable)

module.exports = router;