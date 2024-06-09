import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

import './excelEditor.css';


export default function ExcelEditor({ router, token, handlerStatus, updateHandlerStatus }) {
    const [excelData, setExcelData] = useState(null);
    const [tableName, updateTableName] = useState('');
    const [tableNames, updateTableNames] = useState([]);
    const [errMessage, updErrMessage] = useState(null);
    const [isDelete, updDeleteNotice] = useState(false);
    const [main, updMain] = useState(false);
    const names = ['Секция', 'Подсекция', 'Товар', 'Характеристика'];

    useEffect(() => {
        getTablenames();
    }, [])

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

    async function getTablenames() {
        try {
            updateTableNames([]);
            try {
                const answer = await router.sendGet(
                    'files/get-table-names',
                    '',
                    {
                        'AuthorizationToken': `${token}`
                    }
                );
                if (answer.data?.files) {
                    updateTableNames(answer.data.files);
                }
            } catch (e) {
                updErrMessage(e.response.data.err)
            }

        } catch (error) {
            console.error('Произошла ошибка при получении списка файлов:', error);
        }
    }

    async function getTableJson(tablename) {
        try {
            if (token) {
                try {
                    const main = tablename === tableNames[0];
                    const answer = await router.sendGet(
                        'files/get-table',
                        `/?tableName=${tablename}&main=${main}`,
                        {
                            'AuthorizationToken': `${token}`
                        }
                    );
                    if (answer?.data?.tableData) {
                        return answer.data.tableData;
                    }

                } catch (e) {
                    console.log(e);
                    updErrMessage(e.response.data.err);
                }
            }
        } catch (error) {
            console.error('Произошла ошибка при получении списка файлов:', error);
        }
    }

    const handleGetTableData = async (name) => {
        setExcelData(null);
        updateTableName('');
        const data = await getTableJson(name) //XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (data) {
            data.forEach(element => {
                if (element.length < 4) {
                    const dif = 4 - element.length;
                    for (let i = 0; i < dif; i++) {
                        element.push('');
                    }
                }
            });
            updateTableName(name);
            setExcelData([names, ...data]);
        }
    };

    function showDelConfirm(name) {
        updateTableName(name);
        updDeleteNotice(true);
    }

    async function handleDelTable() {
        const main = tableName === tableNames[0];
        try {
            const answer = await router.sendPost(
                'files/delete-table',
                {
                    tableName: tableName,
                    main: main
                },
                {
                    'AuthorizationToken': `${token}`
                }
            );
            if (answer.status === 200) {
                getTablenames();
                updDeleteNotice(false);
                updateTableName('');
            }
        }
        catch (e) {
            getTablenames();
            updDeleteNotice(false);
            updateTableName('');
            console.log(e.response.data.err);
        }
    }

    async function downloadTable(name) {
        try {
            const answer = await router.sendGet(
                'files/data',
                `/${name}`,
                {
                    'AuthorizationToken': `${token}`
                }
            )
            if (answer?.data) {
                const file = answer.data.file.data;
                const data = Uint8Array.from(file)
                const content = new Blob([data.buffer], { type: answer.headers['content-type'] });
                const encodedUri = window.URL.createObjectURL(content);
                const link = document.createElement("a");

                link.setAttribute("href", encodedUri);
                link.setAttribute("download", name);

                link.click();
            }
        }
        catch (e) {
            //console.log(e.response.data.err);
        }
    }

    async function addToMainTable(name) {
        try {
            checkStatus();
            const answer = await router.sendPost('files/add-to-main-table',
                {
                    tableName: name
                },
                {
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

    async function switchMainTable(name) {
        try {
            const answer = await router.sendPost('files/switch-main-table',
                {
                    tableName: name
                },
                {
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

    return (
        <div>
            {isDelete &&
                <div className="delete-table-notice">
                    <div className="delete-table-container">
                        <span>Вы уверены, что хотите удалить таблицу: "{tableName}"?</span>
                        <div className="delete-table-buttons">
                            <button className="delete-table-button" onClick={() => handleDelTable(tableName)}>Да</button>
                            <button className="delete-table-button" onClick={() => {
                                updDeleteNotice(false);
                                updateTableName('');
                            }
                            }>Нет</button>
                        </div>
                    </div>
                </div>}
            {
                tableNames[1] && (
                    <div className='table-names-container'>
                        {tableNames.map((name, i) => {
                            return (
                                name && name !== 'main' && < div >
                                    <button className={name === tableNames[0] ? 'main-table-name-bttn' : 'table-name-bttn'}
                                        key={'table-name-' + i} onClick={() => handleGetTableData(name)}>{name}</button>
                                    <button className='download-table-bttn' key={'download-table-' + i}
                                        title="Скачать"
                                        onClick={() => {
                                            downloadTable(name);
                                        }}>▼</button>
                                    {
                                        name !== tableNames[0] && !handlerStatus?.process &&
                                        <button className='add-to-main-table-bttn' key={'add-to-main-table-' + i}
                                            title="Добавить содержимое в главную"
                                            onClick={() => {
                                                addToMainTable(name);
                                            }}>✚</button>
                                    }
                                    {
                                        name !== tableNames[0] &&
                                        <button className='switch-main-table-bttn' key={'switch-main-table-' + i}
                                            title="Сделать главной"
                                            onClick={() => {
                                                switchMainTable(name);
                                            }}>∎</button>
                                    }
                                    <button className='delete-table-bttn' key={'delete-table-' + i}
                                        title="Удалить"
                                        onClick={() => {
                                            showDelConfirm(name);
                                        }}>✖</button>
                                </div>
                            )
                        })}
                    </div>
                )
            }
            {
                excelData && (
                    <div>
                        <h3>{tableName}</h3>
                        <div className="excel-container">
                            <table className="excel-table">
                                <thead>
                                    <tr>
                                        {excelData[0].map((cell, index) => (
                                            <th key={'data-name-' + index}>{cell}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {excelData.slice(1).map((row, rowIndex) => (
                                        <tr key={'row-' + rowIndex}>
                                            {row.map((cell, cellIndex) => (
                                                <td key={'cell-' + cellIndex}>
                                                    {(
                                                        <p
                                                            className="excel-inp"
                                                        >{cell}</p>
                                                    )}
                                                </td>

                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }
        </div >
    );

}