const XLSX = require('xlsx');
const Excel = require('exceljs');
const stringSimilarity = require('string-similarity');
const { sendPost } = require('./router');

class FileManager {

    constructor() {
        this.time = Date.now();
        this.units = [
            'мм', 'милиметр', 'см', 'сантиметр', 'м', 'метр', 'км', 'километр', 'д', 'дюйм', 'дюймов', 'дюйма', '"',
            'мл', 'милилитр', 'л', 'литр', 'литров', 'литра', 'барель',
            'шт', 'штука', 'штук',
            'гр', 'грамм', 'кг', 'килограмм', 'т', 'тонн',
            'р', 'рубль', 'доллар', 'евро'
        ];
        this.similarityThreshold = 0.99;
        this.folder = 'data/';
        this.folderMain = 'data/main';
        this.status = {};
    }

    cleanString = (str) => {
        return str.toLowerCase().replace(/[^a-zA-Zа-яА-Я0-9\sёЁ]/g, '').trim();
    }

    getWordsArray = (str) => {
        return this.cleanString(str).split(/\s+/);
    }

    sendStatus = async (filter, process, ms) => {
        if (Date.now() - this.time > ms) {
            try {
                this.time = Date.now();
                await sendPost('files/update-handler-status', {
                    status: {
                        filter, process
                    }
                })
            } catch (e) {
                console.log(e);
            }
        }
    }

    removeFileName = (str) => {
        let bracket = 0;
        for (let i = 0; i < str.length; i++) {
            const symb = str[str.length - i - 1];
            if (symb === ')')
                bracket += 1
            if (symb === '(') {
                bracket -= 1;
                if (bracket == 0) {
                    return str.substring(0, str.length - i - 2);
                }
            }
        }
    }

    async updateStatus(process) {
        try {
            const answer = await sendPost(
                'files/update-status',
                {
                    process: process
                },
                {}
            );
            return answer;
        } catch (e) {
            console.log(e);
        }

    }

    removeDuplicates = async (products, mainArray, isDetailed) => {
        let uniqueProducts = Array.from(new Set(products.map((product, i) => {
            return product.product_name;
        })));
        let filteredProducts = mainArray[0] ? mainArray : [];
        for (let i = 0; i < uniqueProducts.length; i++) {
            if (Date.now() - this.time > 10000) {
                this.time = Date.now();
                const answer = await this.updateStatus(`[Этап 1: ${i}/${uniqueProducts.length}]`);
            }
            const product = uniqueProducts[i];
            const product_clean = mainArray[0] ? this.removeFileName(product) : null; //очищенный от файлов
            const isSimilar = isDetailed ? filteredProducts.some(prev => {

                const prev_clean = mainArray[0] ? this.removeFileName(prev) : null; //подчищенный от файлов
                const similarity = stringSimilarity.
                    compareTwoStrings(product_clean ? product_clean : product,
                        prev_clean ? prev_clean : prev);

                return similarity >= this.similarityThreshold;
            }) : false;
            if (!isSimilar) {
                const wordsArray = this.getWordsArray(product_clean ? product_clean : product); // Получаем массив слов для текущего продукта
                if (!filteredProducts.some(prev => {
                    const prev_clean = mainArray[0] ? this.removeFileName(prev) : null; //подчищенный от файлов
                    const itemWordsArray = this.getWordsArray(prev_clean ? prev_clean : prev); // Получаем массив слов для предыдущего продукта
                    return wordsArray.every(word => itemWordsArray.includes(word)); // Проверяем, содержатся ли все слова из wordsArray в itemWordsArray
                })) {
                    filteredProducts.push(product); // Добавляем продукт в filteredProducts, если он уникален
                }
            }
        }

        return filteredProducts;
    }


    getGroups = (strings) => { //Распределить по секциям
        const sections = {};

        strings.forEach(async (str, i) => {
            const step = 25;
            const addCountWords = str.length - step <= 0 ? 0 : Math.floor(1.5 * (str.length - step) / step);
            const numWords = 2 + addCountWords;
            const ban = ['#', '№'];
            const ban2 = ['м', 'мм', 'мл', 'л', 'хч', 'хх', 'х'];
            let words = [];
            words = str.split(' ').filter(word => !ban.some(symbol => word.includes(symbol)));

            let prefix = words.slice(0, numWords).join(' ')
                .replace(/[\s,%]/g, ' ')
                .replace(/[а-я]*\d+[А-Я]*/gi, '')
                .replace(/\b[\dх№]+\b/g, '')
                .replace(/\b\w{1,2}\b/g, '')
                .replace(/[^а-яА-Я\sёЁ]/g, ' ')
                .replace(/\s+/g, " ");

            const words2 = prefix.split(' ').filter(word => {
                return !ban2.some(bannedWord => word === bannedWord);
            });

            prefix = words2.slice(0, numWords).join(' ').trim();
            const sectionName = prefix.split(' ')[0].toLowerCase();

            if (!sections[sectionName]) {
                sections[sectionName] = {};
            }

            const keys = Object.keys(sections[sectionName]);
            let indexValue = null;

            keys.forEach((key, i) => {
                const wordCounts = key.toLowerCase().split(' ').length;
                const similarity = stringSimilarity.compareTwoStrings(key.toLowerCase(), prefix.trim().toLowerCase().split(' ').slice(0, wordCounts + 1).join(' '));
                if (numWords <= 4 ? similarity > 0.85 : similarity > 0.9) {
                    indexValue = i;
                }
            });

            if (indexValue !== null) {
                sections[sectionName][keys[indexValue]].push(str);
            } else {
                sections[sectionName][prefix.trim()] = [str];
            }
            if (Date.now() - this.time > 5000) {
                this.time = Date.now();
                const answer = await this.updateStatus(`[Этап 2: ${i}/${strings.length}]`);
            }
        });

        console.log('Время конца: ', new Date().toLocaleTimeString());
        return sections;
    }

    getUnitListFromStr = (str) => {
        const words = str.split(' ');
        let result = [];

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            let isDublicate = this.units.some((unit) => {
                return (word.toLowerCase().indexOf(unit) >= 0 && ((word.length > unit.length && !isNaN(parseInt(word[0]))) || word.length == unit.length)) &&
                    ((!isNaN(parseInt(word[0]))) || (!isNaN(parseInt(words[i - 1])) && isNaN(parseInt(word[0]))))
            });
            if (isDublicate) {
                if (!isNaN(parseInt(word[0])))
                    result.push(word);
                if (!isNaN(parseInt(words[i - 1])) && isNaN(parseInt(word[0])))
                    result.push(words[i - 1] + ' ' + word);
            }
        }

        return result.join(' ');
    }

    convertExcelToJson = (table) => {
        try {
            const workbook = XLSX.readFile(Uint8Array.from(table.buffer).buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0]; // Получаем имя первого листа
            const worksheet = workbook.Sheets[sheetName];
            const tableData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (tableData)
                return { msg: { tableData }, status: 200 };
            else return { msg: { err: 'Что то пошло не так' }, status: 500 }
        } catch (e) {
            console.log(e);
            return { msg: { err: 'Что то пошло не так' }, status: 500 }
        }
    }

    convertExcelToJsonByFilePath(filePath) {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0]; // Получаем имя первого листа
            const worksheet = workbook.Sheets[sheetName];
            const tableData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (tableData)
                return { msg: { tableData }, status: 200 };
            else return { msg: { err: 'Что то пошло не так' }, status: 500 }
        } catch (e) {
            return { msg: { err: 'Что то пошло не так' }, status: 500 }
        }

    }

    fileUpload = async (data, isDetailed) => {
        // Чтение данных из Excel файла
        // const workbook = XLSX.read(uploadedFile.buffer, { type: 'buffer' });
        // const sheetName = workbook.SheetNames[0];
        // const sheet = workbook.Sheets[sheetName];
        // const data = XLSX.utils.sheet_to_json(sheet);

        let mainArray = [];

        console.log('Время начала: ', new Date().toLocaleTimeString())
        mainArray = await this.removeDuplicates(data, mainArray, isDetailed);
        const groups = await this.getGroups(mainArray);

        if (groups)
            return { msg: { groups }, status: 200 };
        else return { msg: { err: 'Ошибка обработки' }, status: 500 };
    }

    getProductNames(array, index = 2) {
        if (!index) {
            let maxLen = 0;
            for (let i = 0; i < 3; i++) {
                if (array[i].length > maxLen) {
                    maxLen = array[i].length;
                    for (let j = 0; j < array[i].length; j++) {
                        if (array[i][j]) {
                            console.log(array[i][j], j);
                            index = j;
                            break;
                        }
                    }
                }
            }
        }
        return array.map(item => {
            if (item[index]) {
                return {
                    product_name: item[index]
                };
            }
        }).filter(item => item !== undefined);
    }

    getNames(array) {
        return array.map(item => {
            if (item[2]) {
                return item[2];
            }
        }).filter(item => item !== undefined);
    }

    addToMainTable = async ({ tableNameMain, tableDataMain }, { tableNameForeign, tableDataForeign }) => {
        const newTableDataMain = this.getNames(tableDataMain)
        const newTableDataForeign = this.getProductNames(tableDataForeign);
        const mainArray = await this.removeDuplicates(newTableDataForeign, newTableDataMain, true);
        const groups = await this.getGroups(mainArray);
        if (groups)
            return { msg: { groups }, status: 200 };
        else return { msg: { err: 'Ошибка обработки' }, status: 500 };
    }

}

module.exports = new FileManager();