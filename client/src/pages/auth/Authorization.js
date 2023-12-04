import { createRef, useEffect, useState } from 'react';
import './auth.css';
import axios from 'axios';

export default function Authorization({ router }) {
    const loginRef = createRef(null);
    const passwordRef = createRef(null);
    const [errMessage, updErrMessage] = useState('');
    useEffect(() => {
        const token = localStorage.getItem('excel_handler_token');
        if (token)
            window.location.replace('/')
    }, [])

    async function login() {
        updErrMessage('');
        const login = loginRef.current.value;
        const password = passwordRef.current.value;
        try {
            const answer = await router.sendPost('users/auth', { login, password });
            if (answer?.data?.token) {
                localStorage.setItem('excel_handler_token', answer.data.token)
                window.location.replace('/')
            }

        }  catch (e) {
            updErrMessage(e.response.data.err);
        }
    }

    return (
        <div className="login-container">
            <div>
                <h1 className="login-title">Авторизация</h1>
                <input ref={loginRef} className="login-input" type="text" placeholder="Логин" />
                <input ref={passwordRef} className="login-input" type="password" placeholder="Пароль" />
                <button onClick={login} className="login-button">Войти</button>
                <span className='err-message'>{errMessage}</span>
            </div>
        </div>
    )
}