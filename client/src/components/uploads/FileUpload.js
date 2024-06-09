import React, { useEffect, useState } from 'react';
import './fileUpload.css';

function rus_to_latin(str) {

    var ru = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
        'е': 'e', 'ё': 'e', 'ж': 'j', 'з': 'z', 'и': 'i',
        'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
        'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh',
        'щ': 'shch', 'ы': 'y', 'э': 'e', 'ю': 'u', 'я': 'ya',
        'ъ': 'ie', 'ь': '', 'й': 'i'
    }, n_str = [];

    for (var i = 0; i < str.length; ++i) {
        n_str.push(
            ru[str[i]]
            || ru[str[i].toLowerCase()] == undefined && str[i]
            || ru[str[i].toLowerCase()].replace(/^(.)/, function (match) { return match.toUpperCase() })
        );
    }

    return n_str.join('');
}

function FileUpload({ router, token, handlerStatus, updateHandlerStatus }) {
    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileChange = (event) => {
        try {
            const renamedFile = new File([event.target?.files[0]], rus_to_latin(event.target?.files[0].name), { type: event.target?.files[0].type });
            const reader = new FileReader();
            reader.readAsDataURL(renamedFile)
            setSelectedFile(renamedFile);
        } catch (e) {
            return e
        }
    };

    async function getHadlerStatus() {
        try {
            const answer = await router.sendGet(
                'files/get-hadler-status',
                '',
                {
                    'AuthorizationToken': `${token}`
                }
            );
            if (answer.data?.status) {
                return answer.data.status;
            }
        } catch (e) {
            //updErrMessage(e.response.data.err)
        }
    }

    useEffect(() => {
        const fetchObj = async () => {
            const status = await getHadlerStatus();

            if (status)
                updateHandlerStatus(status);
            if (status?.process) {
                checkStatus();
            }
        }
        fetchObj();
    }, [])

    const checkStatus = () => {
        const interval = setInterval(async () => {
            const status = await getHadlerStatus();
            if (status?.process)
                updateHandlerStatus(status);
            else {
                updateHandlerStatus(status);
                clearInterval(interval);
            }
        }, 1500)
    }

    const handleFileUpload = async (isDetailed) => {
        if (token) {
            const formData = new FormData();
            formData.append('file', selectedFile);
            // добавление параметров
            formData.append('isDetailed', isDetailed);
            setSelectedFile(null);
            try {
                checkStatus();
                const answer = await router.sendPost('files/upload-file',
                    formData,
                    {
                        'Content-Type': 'multipart/form-data',
                        'AuthorizationToken': `${token}`
                    }
                );
                if (answer) {
                    window.location.reload();
                }
            } catch (e) {
                console.log(e);
            }

        }
    };

    return (
        <div className="upload-container">
            {
                !handlerStatus?.process ?
                    <div className="btn-file">
                        Выбрать файл
                        <input type="file"
                            onChange={handleFileChange} />
                    </div>
                    :
                    <div>
                        <span>{handlerStatus?.tableName}: {handlerStatus.process}</span>
                    </div>
            }
            {selectedFile &&
                <div>
                    <button className="btn-standard"
                        onClick={() => handleFileUpload(false)}
                    >Стандартный</button>
                    <button className="btn-deep"
                        onClick={() => handleFileUpload(true)}
                    >Глубокий</button>
                </div>
            }
        </div >
    );
};

export default FileUpload;