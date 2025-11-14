// backend/Routers/productos.js
const express = require('express');
const router = express.Router();
const productosController = require('../Controles/productosCon');

// Obtener todos los productos
router.get('/', productosController.getProductos);

// Buscar productos
router.get('/buscar', productosController.buscarProductos);

// Obtener producto por ID
router.get('/:id', productosController.getProductoById);

module.exports = router;