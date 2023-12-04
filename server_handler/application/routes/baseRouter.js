const Router = require('express');
const router = new Router();

const FileRouter = require('./FileRouter');

router.use('/files', FileRouter);

module.exports = router;