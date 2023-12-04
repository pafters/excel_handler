const Router = require('express');
const router = new Router();

const FileRouter = require('./FileRouter');
const UserRouter = require('./UserRouter')

router.use('/files', FileRouter);
router.use('/users', UserRouter)
// router.use('/admin', AdminRouter);

module.exports = router;