const path = require('path');
const fs = require('fs');
const FormData = require('form-data');

const FileManager = require("../modules/FileManager");
const { checkToken } = require('../modules/UserManager');
const { sendPost, sendRequestToServerB } = require('../modules/router');

class FileController {

    constructor() {
        this.folder = 'data/';
    }

    async fileUpload(req, res) {
        FileManager.status = {};
        FileManager.tableName = null;
        const token = req.headers.authorizationtoken;
        const tokenInfo = checkToken(token);
        if (tokenInfo.status === 200) {
            if (!req.file) {
                return res.status(400).send('No files were uploaded.');
            }
            const tableNamesInfo = await FileManager.getTablenames(true);
            const MainTableStatus = tableNamesInfo.msg.files[0] ? true : false;
            const uploadedFile = req.file;
            const isDetailed = req.body.isDetailed;
            const formData = new FormData();
            formData.append('file', uploadedFile.buffer, { filename: uploadedFile.originalname });
            formData.append('isDetailed', isDetailed);
            try {
                FileManager.tableName = uploadedFile.originalname;
                const answer = await sendPost('files/upload-file', formData,
                    {
                        'Content-Type': 'multipart/form-data',
                    }
                );
                if (answer.data) {
                    const groups = answer.data.groups;

                    const file = await FileManager.fileUpload(groups, isDetailed, uploadedFile, MainTableStatus, false);
                    FileManager.status = {};
                    FileManager.tableName = null;
                    res.status(file.status).send(file.msg);
                } else res.status(500).send({ err: 'Что то пошло не так' });
            } catch (e) {
                FileManager.tableName = null;
                FileManager.status = {}
                console.log(e);
            }
        } else res.status(tokenInfo.status).send({});
    }

    async getTablenames(req, res) {
        const token = req?.headers?.authorizationtoken;
        if (token) {
            const tokenInfo = checkToken(token);
            if (tokenInfo.status === 200) {
                const tableNames = await FileManager.getTablenames();
                const tableNamesMain = await FileManager.getTablenames(true);
                const status = tableNames.status == 200 || tableNamesMain.status == 200 ? 200 : 500;
                const tablesAllInfo = { msg: { files: [tableNamesMain.msg?.files[0] ? tableNamesMain.msg?.files[0] : null, ...tableNames.msg?.files] }, status }
                res.status(tablesAllInfo.status).send(tablesAllInfo.msg);
            } else res.status(tokenInfo.status).send(tokenInfo.msg);
        } else res.status(500).send({ err: 'Ошибка авторизации. Сессия прервана' });

    }

    async getTableJson(req, res) {
        const token = req?.headers?.authorizationtoken;
        if (token) {
            const tokenInfo = checkToken(token);
            if (tokenInfo.status === 200) {
                const { tableName, main } = req.query;
                const data = FileManager.convertExcelToJsonByFilePath(tableName, main)
                res.status(data.status).json(data.msg);
            } else res.status(tokenInfo.status).send(tokenInfo.msg);
        } else res.status(500).send({ err: 'Ошибка авторизации. Сессия прервана' });
    }

    async deleteTable(req, res) {
        const token = req?.headers?.authorizationtoken;
        if (token) {
            const tokenInfo = checkToken(token);
            if (tokenInfo.status === 200) {
                const { tableName, main } = req.body;
                const deleteTableInfo = await FileManager.deleteTable(tableName, main);
                res.status(deleteTableInfo.status).send(deleteTableInfo.msg);
            } else res.status(tokenInfo.status).send(tokenInfo.msg);
        } else res.status(500).send({ err: 'Ошибка авторизации. Сессия прервана' });
    }

    async getFile(req, res) {
        const token = req?.headers?.authorizationtoken;
        if (token) {
            const tokenInfo = checkToken(token);
            if (tokenInfo.status === 200) {
                const tableNamesMain = await FileManager.getTablenames(true);
                if (tableNamesMain.msg?.files[0]) {
                    const filename = req.params.filename;
                    const fileInfo = await FileManager.getFile(filename, tableNamesMain.msg.files[0] == filename ? true : false);

                    res.set({
                        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'Content-Disposition': `attachment; filename="${filename}"`
                    });

                    res.status(fileInfo.status).send(fileInfo.msg);
                } else res.status(500).send('Ошибка при поиске таблицы');
            } else res.status(tokenInfo.status).send(tokenInfo.msg);
        } else res.status(500).send({ err: 'Ошибка авторизации. Сессия прервана' });
    }

    async addToMainTable(req, res) {
        FileManager.status = {};
        FileManager.tableName = null;
        const token = req?.headers?.authorizationtoken;
        if (token) {
            const tokenInfo = checkToken(token);
            if (tokenInfo.status === 200) {
                const tableNameMainInfo = await FileManager.getTablenames(true);
                if (tableNameMainInfo.msg?.files[0]) {
                    const tableNameForeign = req.body.tableName;
                    const tableNameMain = tableNameMainInfo.msg.files[0];
                    FileManager.tableName = tableNameForeign.substring(0, 7) + '... -> ' + tableNameMain.substring(0, 7) + '...';
                    const answerTableForeign = FileManager.convertExcelToJsonByFilePath(tableNameForeign, false);
                    const answerMainTable = FileManager.convertExcelToJsonByFilePath(tableNameMain, true);

                    const tableDataForeign = answerTableForeign.msg.tableData;
                    const tableDataMain = answerMainTable.msg.tableData;
                    try {
                        const answer = await sendPost('files/add-to-main-table',
                            {
                                mainTable: {
                                    tableNameMain,
                                    tableDataMain
                                },
                                foreignTable: {
                                    tableNameForeign,
                                    tableDataForeign
                                }
                            },
                            {
                            }
                        );
                        if (answer.data) {
                            const groups = answer.data?.groups;

                            const file = await FileManager.fileUpload(groups, true, tableNameMain, false, true);
                            FileManager.tableName = null;
                            FileManager.status = {}
                            res.status(file.status).send(file.msg);
                        }
                    } catch (e) {
                        FileManager.tableName = null;
                        FileManager.status = {}
                        console.log(e);
                    }
                } else res.status(500).send({ err: 'Главная таблица не найдена' })

            } else res.status(tokenInfo.status).send(tokenInfo.msg);
        } else res.status(500).send({ err: 'Ошибка авторизации. Сессия прервана' });
    }

    async switchMainTable(req, res) {
        const token = req?.headers?.authorizationtoken;
        if (token) {
            const tokenInfo = checkToken(token);
            if (tokenInfo.status === 200) {
                const { tableName } = req.body;

                const tableAnswer = await FileManager.getTablenames(true);
                const mainTableName = tableAnswer.msg?.files[0] ? tableAnswer.msg?.files[0] : null;

                const tableNameMainInfo = await FileManager.switchMainTable(tableName, mainTableName);

                res.status(tableNameMainInfo.status).send(tableNameMainInfo.msg);
            } else res.status(tokenInfo.status).send(tokenInfo.msg);
        } else res.status(500).send({ err: 'Ошибка авторизации. Сессия прервана' });
    }

    /* ПРО СТАТУС ОБРАБОТКИ ТАБЛИЦ */

    async updateHandlerStatus(req, res) {
        const process = req.body.process;
        FileManager.status = {
            tableName: FileManager.tableName,
            process: process
        }
        res.status(200).send({});
    }


    async getHadlerStatus(req, res) {
        const token = req?.headers?.authorizationtoken;
        if (token) {
            const tokenInfo = checkToken(token);
            if (tokenInfo.status === 200) {
                res.status(200).send({ status: FileManager.status });
            } else res.status(tokenInfo.status).send(tokenInfo.msg);
        } else res.status(500).send({ err: 'Ошибка авторизации. Сессия прервана' });
    }
}

module.exports = new FileController();