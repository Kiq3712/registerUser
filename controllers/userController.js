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
