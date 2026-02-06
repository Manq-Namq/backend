const express = require('express');
const router = express.Router();
const db = require('../conexion'); 

// GET - Obtener todos los envíos
router.get('/', function(req, res) {
    const sql = "SELECT * FROM envios ORDER BY id_envio DESC";
    
    db.query(sql)
        .then(([rows]) => {
            res.json(rows);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: "Error cargando envíos" });
        });
});

// POST - Crear envío
router.post('/', function(req, res) {
    const { id_usuario, direccion, estado, ciudad, codigo_postal } = req.body;
    
    if (!id_usuario || !direccion) {
        return res.status(400).json({ error: "Faltan datos requeridos" });
    }
    
    const sql = `
        INSERT INTO envios (id_usuario, direccion, estado, ciudad, codigo_postal, fecha)
        VALUES (?, ?, ?, ?, ?, NOW())
    `;

    db.query(sql, [id_usuario, direccion, estado, ciudad, codigo_postal])
        .then(([result]) => {
            res.json({ 
                mensaje: "Envío creado", 
                id_envio: result.insertId 
            });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: "Error creando envío" });
        });
});

// PUT - Editar envío
router.put('/:id', function(req, res) {
    const { id } = req.params;
    const { direccion, estado, ciudad, codigo_postal } = req.body;

    const sql = `
        UPDATE envios 
        SET direccion = ?, estado = ?, ciudad = ?, codigo_postal = ?
        WHERE id_envio = ?
    `;

    db.query(sql, [direccion, estado, ciudad, codigo_postal, id])
        .then(() => {
            res.json({ mensaje: "Envío actualizado" });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: "Error actualizando envío" });
        });
});

// DELETE - Eliminar envío
router.delete('/:id', function(req, res) {
    const { id } = req.params;

    db.query("DELETE FROM envios WHERE id_envio = ?", [id])
        .then(() => {
            res.json({ mensaje: "Envío eliminado" });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: "Error eliminando envío" });
        });
});

module.exports = router;