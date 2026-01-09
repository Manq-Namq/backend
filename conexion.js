const mysql = require('mysql2/promise');

const { DBHOST, DBUSER, DBPASS, DBNAME } = process.env;

const db = mysql.createPool({
    host: DBHOST,
    user: DBUSER,
    password: DBPASS,
    database: DBNAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    
});

module.exports = db;

