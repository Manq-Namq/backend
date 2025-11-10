const express = require('express');
const router = express.Router();
const { getUsuarios, login, register } = require('../Controles/usuariosCon');
const { auth, adminAuth } = require('../Middelware/auth');

router.get('/', auth, adminAuth, getUsuarios);
router.post('/login', login);
router.post('/register', register); // Nueva ruta de registro

module.exports = router;