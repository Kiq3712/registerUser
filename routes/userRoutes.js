const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/signIn', userController.getUser);

module.exports = router;
