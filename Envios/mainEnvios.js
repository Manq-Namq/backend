const express = require('express');
const router = express.Router();
const db = require('../conexion');

// GET - Obtener todos los envíos CON NOMBRE DE USUARIO
router.get('/', function(req, res) {
    const sql = `
        SELECT 
            e.id_envio,
            e.id_usuario,
            e.direccion,
            e.codigo_postal,
            DATE_FORMAT(e.fecha, '%d/%m/%Y %H:%i') as fecha,
            e.estado,  /* <-- Asegúrate de incluir estado */
            u.nombre as usuario_nombre,
            u.apellido as usuario_apellido
        FROM envios e
        LEFT JOIN usuarios u ON e.id_usuario = u.id_usuario
        ORDER BY e.id_envio DESC
    `;
    
    db.query(sql)
        .then(([rows]) => res.json(rows))
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: "Error cargando envíos" });
        });
});

// POST - Crear envío (AGREGAR ESTADO)
router.post('/', function(req, res) {
    const { id_usuario, direccion, estado, ciudad, codigo_postal } = req.body;
    
    if (!id_usuario || !direccion) {
        return res.status(400).json({ error: "Faltan datos requeridos" });
    }
    
    const sql = `
        INSERT INTO envios (id_usuario, direccion, codigo_postal, estado, fecha)
        VALUES (?, ?, ?, ?, NOW())
    `;

    db.query(sql, [id_usuario, direccion, codigo_postal || '', estado || 'procesando'])
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
    const { direccion, codigo_postal, estado } = req.body;  /* <-- Incluir estado */

    const sql = `
        UPDATE envios 
        SET direccion = ?, codigo_postal = ?, estado = ?
        WHERE id_envio = ?
    `;

    db.query(sql, [direccion, codigo_postal, estado || 'procesando', id])
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