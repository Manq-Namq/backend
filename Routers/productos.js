const express = require('express');
const router = express.Router();
const { getProductos } = require('../Controles/productosCon');

router.get('/', getProductos);

module.exports = router;