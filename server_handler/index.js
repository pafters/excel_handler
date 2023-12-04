require('dotenv').config();

const express = require('express'); //Строка 1
const app = express(); //Строка 2

const PORT = process.env.SERVER_PORT || 5060; //Строка 3
const cors = require('cors');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');

const baseRouter = require('./application/routes/baseRouter');

app.use(cors({
    'allowedHeaders': ['sessionId', 'Content-Type', 'AuthorizationToken'],
    'exposedHeaders': ['sessionId'],
    'origin': '*',

    'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
    'preflightContinue': false
}));

app.use(bodyParser.json({ limit: "500mb" }))
app.use(bodyParser.urlencoded({ limit: "500mb", extended: true, parameterLimit: 500000 }))


app.use('/api', baseRouter);

app.use(fileUpload({
    createParentPath: true
}));

const start = async () => {
    try {
        app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
    } catch (err) {
        console.log(err);
    }
}

start();