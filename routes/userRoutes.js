const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/signIn', userController.getUser);

router.post('/signUp', userController.insertUser);

router.put('/updateUser', userController.updateUser);

module.exports = router;
