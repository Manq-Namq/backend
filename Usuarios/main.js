const router = require('express').Router();
const authRoutes = require('./auth');
const userRoutes = require('./users');

// Uso de  rutas de autenticación
router.use('/', authRoutes); // Esto hace que /login y /register estén en /usuarios/

// Uso de  rutas de gestión de usuarios
router.use('/', userRoutes); // Esto hace que las rutas CRUD estén en /usuarios/

module.exports = router;