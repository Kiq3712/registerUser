const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "user_register"
})

connection.connect((err) => {
    if (err) {
        console.log("Error connecting to the database: " + err.stack);
        return;
    }
    console.log("Connected to the database");
});

module.exports = connection;