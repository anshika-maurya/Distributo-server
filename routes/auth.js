const express = require('express');
const { login, register, getMe } = require('../controllers/auth');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();


router.post('/register', register);


router.post('/login', login);


router.get('/me', requireAuth, getMe);

module.exports = router; 