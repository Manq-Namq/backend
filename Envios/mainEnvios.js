const express = require('express');
const router = express.Router();
const db = require('../conexion'); 

// GET - Obtener todos los envíos
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                e.*,
                COALESCE(e.nombre_usuario, u.nombre) as nombre,
                COALESCE(e.apellido_usuario, u.apellido) as apellido,
                COALESCE(e.email_usuario, u.email) as email,
                COALESCE(e.telefono_usuario, u.telefono) as telefono,
                c.estado as estado_carrito
            FROM envios e
            LEFT JOIN usuarios u ON e.id_usuario = u.id_usuario
            LEFT JOIN carritos c ON e.id_carrito = c.id_carrito
            ORDER BY e.id_envio DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error cargando envíos" });
    }
});

// POST - Crear envío
router.post('/', async (req, res) => {
    const { id_usuario, direccion, estado, ciudad, codigo_postal, id_carrito } = req.body;

    try {
        // Obtener datos del usuario
        const [usuarios] = await db.query('SELECT nombre, apellido, email, telefono FROM usuarios WHERE id_usuario = ?', [id_usuario]);
        
        if (usuarios.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        
        const usuario = usuarios[0];
        
        const sql = `
            INSERT INTO envios (id_usuario, direccion, estado, ciudad, codigo_postal, id_carrito, nombre_usuario, apellido_usuario, email_usuario, telefono_usuario, fecha)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const [result] = await db.query(sql, [
            id_usuario,
            direccion,
            estado,
            ciudad,
            codigo_postal,
            id_carrito,
            usuario.nombre,
            usuario.apellido,
            usuario.email,
            usuario.telefono
        ]);

        res.json({ mensaje: "Envío creado", id_envio: result.insertId });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error creando envío" });
    }
});

// PUT - Editar envío
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { direccion, estado, ciudad, codigo_postal } = req.body;

    try {
        const sql = `
            UPDATE envios 
            SET direccion = ?, estado = ?, ciudad = ?, codigo_postal = ?
            WHERE id_envio = ?
        `;

        await db.query(sql, [
            direccion,
            estado,
            ciudad,
            codigo_postal,
            id
        ]);

        res.json({ mensaje: "Envío actualizado" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error actualizando envío" });
    }
});

// DELETE - Eliminar envío
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await db.query("DELETE FROM envios WHERE id_envio = ?", [id]);
        res.json({ mensaje: "Envío eliminado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error eliminando envío" });
    }
});

module.exports = router;
