const connection = require('../config/db');

// This function is responsible for retrieving the user from the database
// It receives the request and response as parameters
exports.getUser = (req, res) => {
    const { email, password} = req.body;
    connection.query("SELECT NAME FROM TB_USER WHERE EMAIL = ? AND PASSWORD = ?" , [email, password], (err, result) => {
        if (err) {
            res.status(500).send("Error retrieving data from database");
        }
        res.status(200).send(result);
    })
}

// This function is responsible for inserting a new user into the database
// It receives the request and response as parameters
exports.insertUser = (req, res) => {
    const { name, email, phone, birth, password } = req.body;
    const [ day, month, year ] = birth.split("/");
    console.log("data separada");
    const newBirth = `${year}-${month}-${day}`;
    console.log("data formatada");
    connection.query("INSERT INTO TB_USER (NAME, EMAIL, PHONE, BIRTH, PASSWORD) VALUES (?, ?, ?, ?, ?)", [name, email, phone, newBirth, password], (err, result) => {
        if (err) {
            res.status(500).send("Error inserting data into database");
        }
        res.status(201).send("User successfully inserted");
    })
}