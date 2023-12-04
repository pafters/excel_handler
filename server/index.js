require('dotenv').config();

const express = require('express'); //Строка 1
const app = express(); //Строка 2

const PORT = process.env.SERVER_PORT || 5000; //Строка 3
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fileUpload = require('express-fileupload');


const baseRouter = require('./application/routes/baseRouter');

app.use(cors({
    'allowedHeaders': ['sessionId', 'Content-Type', 'AuthorizationToken'],
    'exposedHeaders': ['sessionId'],
    'origin': '*',

    'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
    'preflightContinue': false
}));

app.use(bodyParser.json({ limit: "5000mb" }))
app.use(bodyParser.urlencoded({ limit: "5000mb", extended: true, parameterLimit: 5000000 }))

app.use('/api', baseRouter);

app.use(fileUpload({
    createParentPath: true
}));

app.use('/api/files/data', express.static(path.join(__dirname, 'data')));

app.get('/api/', (req, res) => {
    res.status(200).json({ message: 'All right!' })
});

const start = async () => {
    try {
        app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
    } catch (err) {
        console.log(err);
    }
}

start();