const express = require('express');
const router = express.Router();
const db = require('../conexion');

// GET - Obtener todas las ventas (usando compra_productos)
router.get('/', function(req, res, next) {
  const sql = `
    SELECT 
      cp.id_compra_productos,
      cp.cantidad,
      cp.precio_unitario,
      cp.id_carrito,
      p.nombre as producto_nombre,
      p.descripcion,
      u.nombre as usuario_nombre,
      u.apellido as usuario_apellido,
      u.email,
      c.fecha_creacion as fecha_compra
    FROM compra_productos cp
    JOIN productos p ON cp.id_producto = p.id_producto
    JOIN carrito c ON cp.id_carrito = c.id_carrito
    JOIN usuarios u ON c.id_usuario = u.id_usuario
    ORDER BY c.fecha_creacion DESC
  `;
  
  db.query(sql)
    .then(([ventas]) => {
      res.json(ventas);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Error del servidor" });
    });
});

// GET - Ventas de hoy
router.get('/hoy', function(req, res, next) {
  const sql = `
    SELECT 
      COUNT(cp.id_compra_productos) as total_ventas,
      SUM(cp.cantidad * cp.precio_unitario) as monto_total
    FROM compra_productos cp
    JOIN carrito c ON cp.id_carrito = c.id_carrito
    WHERE DATE(c.fecha_creacion) = CURDATE()
  `;
  
  db.query(sql)
    .then(([result]) => {
      res.json({
        total_ventas: result[0].total_ventas || 0,
        monto_total: result[0].monto_total || 0
      });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Error del servidor" });
    });
});

// GET - Ventas del mes actual
router.get('/mes', function(req, res, next) {
  const sql = `
    SELECT 
      COUNT(cp.id_compra_productos) as total_ventas,
      SUM(cp.cantidad * cp.precio_unitario) as monto_total
    FROM compra_productos cp
    JOIN carrito c ON cp.id_carrito = c.id_carrito
    WHERE MONTH(c.fecha_creacion) = MONTH(CURDATE()) 
    AND YEAR(c.fecha_creacion) = YEAR(CURDATE())
  `;
  
  db.query(sql)
    .then(([result]) => {
      res.json({
        total_ventas: result[0].total_ventas || 0,
        monto_total: result[0].monto_total || 0
      });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Error del servidor" });
    });
});

// GET - Obtener ventas pendientes (si tienes columna estado en carrito)
router.get('/pendientes', function(req, res, next) {
  const sql = `
    SELECT COUNT(cp.id_compra_productos) as total_pendientes
    FROM compra_productos cp
    JOIN carrito c ON cp.id_carrito = c.id_carrito
    WHERE c.estado = 'pendiente' OR c.estado IS NULL
  `;
  
  db.query(sql)
    .then(([result]) => {
      res.json({
        total_pendientes: result[0].total_pendientes || 0
      });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Error del servidor" });
    });
});

// GET - Estadísticas generales
router.get('/estadisticas', function(req, res, next) {
  const sql = `
    SELECT 
      COUNT(cp.id_compra_productos) as total_ventas,
      SUM(cp.cantidad) as total_productos_vendidos,
      SUM(cp.cantidad * cp.precio_unitario) as ingreso_total,
      AVG(cp.cantidad * cp.precio_unitario) as promedio_venta,
      DATE(c.fecha_creacion) as fecha
    FROM compra_productos cp
    JOIN carrito c ON cp.id_carrito = c.id_carrito
    GROUP BY DATE(c.fecha_creacion)
    ORDER BY fecha DESC
    LIMIT 7
  `;
  
  db.query(sql)
    .then(([estadisticas]) => {
      res.json(estadisticas);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Error del servidor" });
    });
});

module.exports = router;