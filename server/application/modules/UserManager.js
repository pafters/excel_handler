const jwt = require('jsonwebtoken');

class UserManager {

    constructor() {
    }

    createToken(login) {
        const payload = {
            login: login
        }
        return jwt.sign(payload, process.env.JWT_SECRET);
    }

    decodeToken(token) {
        return jwt.verify(token, process.env.JWT_SECRET);
    }

    checkToken = (token) => {
        const payload = this.decodeToken(token);

        if (payload.login == process.env.USER_LOGIN)
            return { status: 200 };
        else return { msg: { err: 'Ошибка авторизации. Сессия прервана' }, status: 400 };
    }

    auth = (login, password) => {
        const { USER_PASSWORD, USER_LOGIN } = process.env;
        if (login === USER_LOGIN) {
            if (password == USER_PASSWORD) {
                const token = this.createToken(login);
                return { msg: { token: token }, status: 200 }
            } else return { msg: { err: 'Неправильный пароль' }, status: 400 };
        } else return { msg: { err: 'Пользователь не найден' }, status: 400 };
    }
}

module.exports = new UserManager();