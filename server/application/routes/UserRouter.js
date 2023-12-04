const Router = require('express');
const UserController = require('../controllers/UserController');
const router = new Router();

router.post('/auth', UserController.auth);
router.get('/token-life', UserController.checkToken);

module.exports = router;