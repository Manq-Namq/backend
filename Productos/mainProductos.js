const express = require('express');
const router = express.Router();
const db = require('../conexion');

// GET - Obtener todos los productos
router.get('/', function (req, res, next) {
    const sql = "SELECT * FROM productos";
    db.query(sql)
        .then(([productos]) => {
            res.status(200).json(productos);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Ocurrió un error");
        });
});

// GET - Obtener producto por ID
router.get('/:id', function (req, res, next) {
    const { id } = req.params;
    const sql = "SELECT * FROM productos WHERE id_producto = ?";
    db.query(sql, [id])
        .then(([productos]) => {
            if (productos.length > 0) {
                res.json(productos[0]);
            } else {
                res.status(404).json({ error: 'Producto no encontrado' });
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Ocurrió un error");
        });
});

module.exports = router;