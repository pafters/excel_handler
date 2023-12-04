const UserManager = require("../modules/UserManager");

class UserController {

    auth = async (req, res) => {
        const { login, password } = req.body;
        const answer = UserManager.auth(login, password);
        res.status(answer.status).send(answer.msg);
    }

    checkToken = async (req, res) => {
        const token = req.headers.authorizationtoken;
        const tokenInfo = UserManager.checkToken(token);
        if (tokenInfo)
            res.status(tokenInfo.status).send({});
    }
}

module.exports = new UserController();