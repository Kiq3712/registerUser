const connection = require('../config/db');
const bcrypt = require('bcrypt');

// This function is responsible for retrieving the user name from the database
// It receives the request and response as parameters
exports.getUser = (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) { // Check if email and password are filled in
        return res.status(400).send("Email and password are required");
    }

    connection.query("SELECT NAME, PASSWORD FROM TB_USER WHERE EMAIL = ?", [email], (err, result) => {
        if (err) {
            return res.status(500).send("Error retrieving data from database");
        }
        if (result.length === 0) {
            return res.status(404).send("User not found");
        }
        const hashedPassword = result[0].PASSWORD; // Get the hashed password from the database

        // Compare the password entered with the hashed password in the database
        bcrypt.compare(password, hashedPassword, (err, match) => {
            if (err) {
                return res.status(500).send("Error comparing passwords" + err);
            }
            if (!match) {
                return res.status(401).send("Incorrect password");
            }
            return res.status(200).json({ message: "User successfully authenticated", userName: result[0].NAME });
        });
    });
}


// This function is responsible for retrieving all users from the database
exports.getAll = (req, res) => {
    connection.query("SELECT * FROM TB_USER", (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Error retrieving data from database" });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }

        // Format the birth date to dd/mm/yyyy
        const formattedResult = result.map(user => {
            if (user.birth) {
                const day = String(user.birth.getDate()).padStart(2, '0'); // Get the day and format it to 2 digits
                const month = String(user.birth.getMonth() + 1).padStart(2, '0'); // Get the month and format it to 2 digits
                const year = user.birth.getFullYear(); // Get the year
                user.birth = `${day}/${month}/${year}`; // Format the date to dd/mm/yyyy
            }
            return user;
        });

        return res.status(200).json( formattedResult ); // Return the list of users
    })
}

// This function is responsible for inserting a new user into the database
// It receives the request and response as parameters
exports.insertUser = (req, res) => {
    const { name, email, phone, birth, password } = req.body;
    if (!name || !email || !phone || !birth || !password) { // Check if all fields are filled in
        return res.status(400).send("All fields are required to insert");
    }
    const hashedPassword = bcrypt.hashSync(password, 10) // Hash the password
    const [day, month, year] = birth.split("/");
    const formattedBirth = `${year}-${month}-${day}`;
    connection.query("INSERT INTO TB_USER (NAME, EMAIL, PHONE, BIRTH, PASSWORD) VALUES (?, ?, ?, ?, ?)", [name, email, phone, formattedBirth, hashedPassword], (err, result) => {
        if (err) {
            if (err.message.includes("Duplicate entry") && err.message.includes("email")) { // Check if the error is due to duplicate email entry
                return res.status(409).send("Email already registered");
            }
            if (err.message.includes("Duplicate entry") && err.message.includes("telefone")) { // Check if the error is due to duplicate phone number entry
                return res.status(409).send("Phone number already registered");
            }
            if (err.message.includes("Incorrect date value")) { // Check if the error is due to an invalid date
                return res.status(400).send("Invalid date format! Use dd/mm/yyyy");
            }
            return res.status(500).send("Error inserting data into database" + err);
        }
        return res.status(201).send("User successfully inserted");
    })
}

// This function is responsible for update user data in the database
// It receives the request and response as parameters
exports.updateUser = (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) { // Check if email and password are filled in
        return res.status(400).send("Email and password are required to update");
    }
    const { name, phone, birth, newEmail, newPassword } = req.body;
    const updates = { name, phone, email: newEmail }; // Create an object with the fields to be updated
    // Check if the birth date is filled in
    if (birth) {
        const [day, month, year] = birth.split("/");
        updates.birth = `${year}-${month}-${day}`; // Change the date format and add it to the updates object
    }
    connection.query("SELECT ID_TB_USER, PASSWORD FROM TB_USER WHERE EMAIL = ?", [email], (err, result) => {
        if (err) {
            return res.status(500).send("Error retrieving data from database");
        }
        if (result.length === 0) {
            return res.status(404).send("User not found or incorrect email/password");
        }
        const userId = result[0].ID_TB_USER; // Get the user ID
        const currentEmail = result[0].EMAIL; // Get the current email
        const hashedPassword = result[0].PASSWORD; // Get the current password

        if (newEmail && newEmail !== currentEmail) { // Check if the email is different from the current one
            updates.email = newEmail; // Add the new email to the updates object
        }

        bcrypt.compare(password, hashedPassword, (err, match) => {
            if (err) {
                return res.status(500).send("Error comparing passwords" + err);
            }
            if (!match) {
                return res.status(401).send("Invalid email/password");
            }
            if (newPassword) {
                bcrypt.hash(newPassword, 10, (err, hashedNewPassword) => {
                    if (err) {
                        return res.status(500).send("Error hashing new password");
                    }
                    updates.password = hashedNewPassword;
                    updateDatabase(userId, updates, res);
                });
            }
            else {
                updateDatabase(userId, updates, res); // Call the function to update the database
            }

        })
    });
}

// This function is responsible for deleting a user from the database
exports.deleteUser = (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) { // Check if email and password are filled in
        return res.status(400).send("Email and password are required to delete user");
    }
    connection.query("SELECT ID_TB_USER, PASSWORD FROM TB_USER WHERE EMAIL = ?", [ email ], (err, result) => {
        if (err) {
            return res.status(500).send("Error retrieving data from database");
        }
        if (result.length === 0) {
            return res.status(404).send("User not found or incorrect email/password");
        }
        const userId = result[0].ID_TB_USER; // Get the user ID
        const currentPassword = result[0].PASSWORD; // Get the current password

        bcrypt.compare(password, currentPassword, (err, match) => {
            if (err) {
                return res.status(500).send("Error comparing passwords" + err);
            }
            if (!match) {
                return res.status(401).send("Invalid email/password");
            }
            connection.query("DELETE FROM TB_USER WHERE ID_TB_USER = ?", [userId], (err, result) => {
                if (err) {
                    return res.status(500).send("Error deleting user from database");
                }
                return res.status(200).send("User successfully deleted");
            });
        });
    });
}

// Function to update the database
function updateDatabase(userId, updates, res) {

    // Check if the fields are filled in and different from the current ones
    const fields = Object.keys(updates).filter(key => updates[key] !== undefined && updates[key] !== "");
    if (fields.length === 0) {
        return res.status(400).send("At least one field must be filled in to update");
    }

    // Create the SET part of the SQL query
    const set = fields.map(field => `${field} = ?`).join(", "); // Create the SET part of the SQL query
    const values = fields.map(field => updates[field]); // Create the values to be updated
    const sql = `UPDATE TB_USER SET ${set} WHERE ID_TB_USER = ?`; // Create the SQL query

    values.push(userId); // Add the user ID to the values

    connection.query(sql, values, (err, result) => {
        if (err) {
            return res.status(500).send("Error updating data in database" + err);
        }
        return res.status(200).send("User successfully updated");
    });
}