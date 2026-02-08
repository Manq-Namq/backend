// routes/mainCompras.js
const express = require('express');
const router = express.Router();
const db = require('../conexion');

// POST - Registrar compra (SIMPLE)
router.post('/', (req, res) => {
  const { id_carrito, id_producto, cantidad, precio_unitario } = req.body;
  
  console.log('Registrando compra:', req.body);
  
  const sql = `INSERT INTO compra_productos (id_carrito, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)`;
  
  db.query(sql, [id_carrito, id_producto, cantidad, precio_unitario])
    .then(([result]) => {
      res.json({
        id_compra_productos: result.insertId,
        mensaje: 'Compra registrada'
      });
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al registrar compra" });
    });
});

// GET - Obtener todas las compras
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      cp.id_compra_productos,
      cp.id_carrito,
      cp.id_producto,
      cp.cantidad,
      cp.precio_unitario,
      p.nombre as producto_nombre,
      c.id_usuario,
      u.nombre as usuario_nombre,
      u.apellido as usuario_apellido
    FROM compra_productos cp
    LEFT JOIN productos p ON cp.id_producto = p.id_producto
    LEFT JOIN carritos c ON cp.id_carrito = c.id_carrito
    LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
    ORDER BY cp.id_compra_productos DESC
  `;
  
  db.query(sql)
    .then(([compras]) => {
      console.log(`Compras obtenidas: ${compras.length} registros`);
      res.json(compras);
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al obtener compras" });
    });
});

module.exports = router;