const express = require('express');
const router = express.Router();
const db = require('../conexion'); // <-- ajusta si tu archivo se llama distinto

// GET - Obtener todos los envíos
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM envios ORDER BY id_envio DESC");
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error cargando envíos" });
    }
});

// POST - Crear envío
router.post('/', async (req, res) => {
    const { id_usuario, direccion, estado, ciudad, codigo_postal } = req.body;

    try {
        const sql = `
            INSERT INTO envios (id_usuario, direccion, estado, ciudad, codigo_postal, fecha)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;

        const [result] = await db.query(sql, [
            id_usuario,
            direccion,
            estado,
            ciudad,
            codigo_postal
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
