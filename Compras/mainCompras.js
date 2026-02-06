const express = require('express');
const router = express.Router();
const db = require('../conexion');

// GET  Obtener todas las compras
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      cp.id_compra_productos,
      cp.id_carrito,
      cp.id_producto,
      cp.cantidad,
      cp.precio_unitario,
      p.nombre as producto_nombre,
      p.stock as stock_actual,
      u.nombre as usuario_nombre,
      u.apellido as usuario_apellido,
      c.estado as estado_carrito,
      (cp.cantidad * cp.precio_unitario) as total
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

// POST  Registra compra con validación de stock
router.post('/', (req, res) => {
  const { id_carrito, id_producto, cantidad, precio_unitario } = req.body;
  
  console.log('Validando stock para compra...');
  
  // Primero verificar stock disponible
  const checkStockSql = `SELECT stock, nombre FROM productos WHERE id_producto = ?`;
  
  db.query(checkStockSql, [id_producto])
    .then(([productoData]) => {
      if (productoData.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      
      const stockDisponible = productoData[0].stock;
      const nombreProducto = productoData[0].nombre;
      
      // Validar que la cantidad no supere el stock
      if (cantidad > stockDisponible) {
        const mensaje = `No hay suficiente stock. Producto: "${nombreProducto}". Disponible: ${stockDisponible}, Solicitado: ${cantidad}`;
        console.log(mensaje);
        return res.status(400).json({ 
          error: mensaje,
          stock_disponible: stockDisponible,
          cantidad_solicitada: cantidad,
          producto: nombreProducto
        });
      }
      
      // Si hay stock suficiente, registrar la compra en el carrito
      const sql = `INSERT INTO compra_productos (id_carrito, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)`;
      
      return db.query(sql, [id_carrito, id_producto, cantidad, precio_unitario])
        .then(([result]) => {
          console.log(`Producto añadido al carrito: ${nombreProducto}, cantidad: ${cantidad}`);
          res.json({
            id_compra_productos: result.insertId,
            mensaje: 'Producto añadido al carrito',
            producto: nombreProducto,
            cantidad: cantidad
          });
        });
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al procesar la compra" });
    });
});

module.exports = router;