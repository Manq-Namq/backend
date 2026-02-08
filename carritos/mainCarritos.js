const express = require('express');
const router = express.Router();
const db = require('../conexion');

// GET, todos los carritos
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      c.id_carrito,
      c.id_usuario,
      DATE_FORMAT(c.fecha_creacion, '%d/%m/%Y %H:%i') as fecha_creacion,
      u.nombre as usuario_nombre,
      u.apellido as usuario_apellido
    FROM carritos c
    LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
    ORDER BY c.fecha_creacion DESC
  `;
  
  db.query(sql)
    .then(([carritos]) => {
      console.log(`Carritos obtenidos: ${carritos.length} registros`);
      res.json(carritos);
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al obtener carritos" });
    });
});

// POST, Crear carrito (SIN dirección aquí)
router.post('/', (req, res) => {
  const { id_usuario } = req.body;
  
  console.log('Creando carrito para usuario:', id_usuario);
  
  const sql = `INSERT INTO carritos (id_usuario) VALUES (?)`;
  
  db.query(sql, [id_usuario || 1])
    .then(([result]) => {
      res.json({
        id_carrito: result.insertId,
        mensaje: 'Carrito creado'
      });
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al crear carrito" });
    });
});

// PUT, Actualizar estado de carrito
router.put('/:id', (req, res) => {
  const idCarrito = req.params.id;
  const { estado } = req.body;
  
  console.log('Actualizando carrito', idCarrito, 'a estado:', estado);
  
  const sql = `UPDATE carritos SET estado = ? WHERE id_carrito = ?`;
  
  db.query(sql, [estado, idCarrito])
    .then(() => {
      res.json({ 
        mensaje: 'Estado del carrito actualizado',
        estado: estado
      });
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al actualizar carrito" });
    });
});

module.exports = router;