const express = require('express');
const router = express.Router();
const { getCategorias } = require('../Controles/categoriasCon');

router.get('/', getCategorias);

module.exports = router;