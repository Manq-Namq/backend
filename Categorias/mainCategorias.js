const express = require('express');
const router = express.Router();
const db = require('../conexion');

// GET - Obtener todas las categorías
router.get('/', function (req, res, next) {
    const sql = "SELECT * FROM categorias";
    db.query(sql)
        .then(([categorias]) => {
            res.status(200).json(categorias);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Ocurrió un error");
        });
});

module.exports = router;