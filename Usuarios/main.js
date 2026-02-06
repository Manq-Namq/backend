const router = require('express').Router();
const authRoutes = require('./auth');
const userRoutes = require('./users');
// Uso de  rutas de autenticación
router.use('/', authRoutes); //Rutas públicas sin autenticación

// Uso de  rutas de gestión de usuarios
router.use('/', userRoutes); // Rutas protegidas para usuarios autenticados

module.exports = router;