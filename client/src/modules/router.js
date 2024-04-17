import axios from "axios"

export default class BaseRouter {

    sendPost(method, body, headers, params = '') {
        const answer = axios.post(`http://212.193.51.97:5000/api/${method}${params}`, body, { headers: headers })
        if (answer)
            return answer
    }

    sendGet(method, params = '', headers) {
        const answer = axios.get(`http://212.193.51.97:5000/api/${method}${params}`, {
            headers: headers
        })
        if (answer)
            return answer
    }
}