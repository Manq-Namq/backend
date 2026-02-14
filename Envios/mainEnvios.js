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
            e.nombre_usuario,
            DATE_FORMAT(e.fecha, '%d/%m/%Y %H:%i') as fecha,
            e.estado
        FROM envios e
        ORDER BY e.fecha DESC
    `;
    
    db.query(sql)
        .then(([rows]) => res.json(rows))
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: "Error cargando envíos" });
        });
});

// POST - Crear envío manualmente (desde el formulario)
router.post('/', function(req, res) {
    const { direccion, estado, codigo_postal, nombre_usuario } = req.body;
    
    if (!direccion || !nombre_usuario) {
        return res.status(400).json({ error: "Faltan datos requeridos" });
    }
    
    // Buscar el id_usuario basado en el nombre_usuario
    const buscarUsuarioSql = `
        SELECT id_usuario, nombre, apellido 
        FROM usuarios 
        WHERE CONCAT(nombre, ' ', apellido) LIKE ? 
        OR nombre LIKE ? 
        LIMIT 1
    `;
    
    db.query(buscarUsuarioSql, [`%${nombre_usuario}%`, `%${nombre_usuario}%`])
        .then(([rows]) => {
            if (rows.length === 0) {
                return res.status(404).json({ 
                    success: false,
                    error: "Usuario no encontrado" 
                });
            }
            
            const id_usuario = rows[0].id_usuario;
            const nombreCompleto = `${rows[0].nombre} ${rows[0].apellido}`.trim();
            
            const sql = `
                INSERT INTO envios (id_usuario, direccion, codigo_postal, estado, fecha, nombre_usuario)
                VALUES (?, ?, ?, ?, NOW(), ?)
            `;

            return db.query(sql, [
                id_usuario, 
                direccion, 
                codigo_postal || '', 
                estado || 'Pendiente',
                nombreCompleto
            ]);
        })
        .then(([result]) => {
            res.json({ 
                success: true,
                message: "Envío creado", 
                id_envio: result.insertId 
            });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ 
                success: false,
                error: "Error creando envío" 
            });
        });
});

// PUT - Editar envío
router.put('/:id', function(req, res) {
    const { id } = req.params;
    const { direccion, codigo_postal, estado, nombre_usuario } = req.body;

    // Buscar el usuario basado en el nombre
    const buscarUsuarioSql = `
        SELECT id_usuario, nombre, apellido 
        FROM usuarios 
        WHERE CONCAT(nombre, ' ', apellido) LIKE ? 
        OR nombre LIKE ? 
        LIMIT 1
    `;
    
    db.query(buscarUsuarioSql, [`%${nombre_usuario}%`, `%${nombre_usuario}%`])
        .then(([rows]) => {
            if (rows.length === 0) {
                return res.status(404).json({ 
                    success: false,
                    error: "Usuario no encontrado" 
                });
            }
            
            const id_usuario = rows[0].id_usuario;
            const nombreCompleto = `${rows[0].nombre} ${rows[0].apellido}`.trim();
            
            const sql = `
                UPDATE envios 
                SET direccion = ?, 
                    codigo_postal = ?, 
                    estado = ?,
                    id_usuario = ?,
                    nombre_usuario = ?
                WHERE id_envio = ?
            `;

            return db.query(sql, [
                direccion, 
                codigo_postal || '', 
                estado || 'Pendiente', 
                id_usuario, 
                nombreCompleto, 
                id
            ]);
        })
        .then(() => {
            res.json({ 
                success: true,
                message: "Envío actualizado" 
            });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ 
                success: false,
                error: "Error actualizando envío" 
            });
        });
});

// DELETE - Eliminar envío
router.delete('/:id', function(req, res) {
    const { id } = req.params;

    db.query("DELETE FROM envios WHERE id_envio = ?", [id])
        .then(() => {
            res.json({ 
                success: true,
                message: "Envío eliminado" 
            });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ 
                success: false,
                error: "Error eliminando envío" 
            });
        });
});

module.exports = router;