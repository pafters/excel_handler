const Router = require('express');
const FileController = require('../controllers/FileController');
const router = new Router();

const uploadFile = require('../middleware/fileUpload');

router.post('/upload-file', uploadFile.single('file'), FileController.fileUpload);

router.get('/data/:filename', FileController.getFile);

router.post('/update-handler-status', FileController.updateHandlerStatus);

router.get('/get-table-names', FileController.getTablenames);

router.get('/get-table', FileController.getTableJson);

router.post('/delete-table', FileController.deleteTable);

router.post('/add-to-main-table', FileController.addToMainTable);

router.post('/switch-main-table', FileController.switchMainTable);

router.post('/update-status', FileController.updateHandlerStatus);

router.get('/get-hadler-status', FileController.getHadlerStatus);

module.exports = router;