const FileManager = require("../modules/FileManager");

class FileController {

    async fileUpload(req, res) {
        if (!req.file) {
            return res.status(400).send('No files were uploaded.');
        }
        const uploadedFile = req.file;
        const tableDataInfo = FileManager.convertExcelToJson(uploadedFile);
        if (tableDataInfo.msg) {
            const tableDataObj = FileManager.getProductNames(tableDataInfo.msg.tableData, null);
            const data = await FileManager.fileUpload(tableDataObj);
            if (data) {
                res.status(data.status).send(data.msg);
            } else res.status(500).send({ err: 'Что то пошло не так' });
        } else res.status(tableDataInfo.status).send(tableDataInfo.msg)
    }

    async addToMainTable(req, res) {
        const { mainTable, foreignTable } = req.body;
        const data = await FileManager.addToMainTable(mainTable, foreignTable);
        if (data) {
            res.status(data.status).send(data.msg);
        } else res.status(500).send({ err: 'Что то пошло не так' });
    }
}

module.exports = new FileController();