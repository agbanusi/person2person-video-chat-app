require('dotenv').config();
const routes = require('./scripts/routes')
const express = require("express");
const app = express()
const bodyParser = require('body-parser');
const mongo = require("mongodb").MongoClient;
const ObjectId = require('mongodb').ObjectID
const bcrypt = require('bcrypt');
const id = require('shortid')
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const sockets = require('./scripts/sockets');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/view', express.static(process.cwd() + "/view"))

mongo.connect(process.env.DB, { useUnifiedTopology: true }, (err, client) => {
    let db = client.db('Cluster0');
    sockets(io)
    routes(app, db, bcrypt, id, ObjectId)
    http.listen(3000, () => {
        console.log('listening on port 3000');
    })
    
    
})