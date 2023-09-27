'use strict';

const express = require('express');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();

var maintenanceMode = process.env.MAINTENANCE_MODE_NODEAPP

if (maintenanceMode==='true'){
    app.get('/', (req, res) => {
        res.sendFile(__dirname + "/offline.html");
    });
} else if (maintenanceMode==='false') {
    app.get('/', (req, res) => {
        res.sendFile(__dirname + "/index.html");
    });
} else throw new Error("the MAINTENANCE_MODE_NODEAPP env variable is not defined.");


app.listen(PORT, HOST, () => {
    console.log(`Running on http://${HOST}:${PORT}`);
});