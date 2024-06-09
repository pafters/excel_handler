const axios = require('axios');

class BaseRouter {

    async sendRequestToServerB(req, res) {
        try {
            // Определяем базовый URL сервера "Б"
            const serverBUrl = 'http://localhost:5060';
            // Перенаправляем запрос целиком на сервер "Б"
            const response = await axios({
                method: req.method,
                url: serverBUrl + req.originalUrl,
                headers: req.headers,
                data: req.body
            });
            // Возвращаем полученный ответ от сервера "Б" клиенту
            //return response
        } catch (error) {
            // Обрабатываем ошибки при перенаправлении запроса
            //console.error('Ошибка при отправке запроса на сервер "Б":', error);
            //return error
        }
    }

    sendPost(method, body, headers, params = '') {
        const answer = axios.post(`http://localhost:5060/api/${method}${params}`, body, { headers: headers })
        if (answer)
            return answer
    }

    sendGet(method, params = '', headers) {
        const answer = axios.get(`http://localhost:5060/api/${method}${params}`, {
            headers: headers
        })
        if (answer)
            return answer
    }
}

module.exports = new BaseRouter();