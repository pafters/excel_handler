import { useEffect, useState } from "react";
import FileUpload from "../../components/uploads/FileUpload";
import ExcelEditor from "../../components/excel/ExcelEditor";
import QuitButton from "../../components/quit/QuitButton";

export default function MainPage({ router }) {
    const [token, updToken] = useState(null)
    const [handlerStatus, updateHandlerStatus] = useState({});

    useEffect(() => {
        const localToken = localStorage.getItem('excel_handler_token');
        if (localToken) {
            const fetchObj = async () => {
                const tokenInfo = await router.sendGet(
                    'users/token-life',
                    '',
                    {
                        'AuthorizationToken': `${localToken}`
                    }
                )
                if (tokenInfo) {
                    if (tokenInfo.status === 200)
                        updToken(localToken);
                    else {
                        updToken('');
                        localStorage.removeItem('excel_handler_token');
                        window.location.replace('/auth')
                    }
                }
            }
            fetchObj();
        }
        else window.location.replace('/auth')
    }, [])

    return (
        <div>
            {token &&
                <div>
                    <QuitButton />
                    <FileUpload handlerStatus={handlerStatus} updateHandlerStatus={updateHandlerStatus} router={router} token={token} />
                    <ExcelEditor handlerStatus={handlerStatus} router={router} token={token} />
                </div>}
        </div>
    );
}