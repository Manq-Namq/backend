const express = require('express');
const router = express.Router();
const db = require('../conexion');

// GET - TODAS las ventas (para la tabla)
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      v.id_venta,
      DATE_FORMAT(v.fecha_venta, '%d/%m/%Y %H:%i') as fecha_venta,
      IFNULL(v.estado, 'completada') as estado,
      cp.cantidad,
      cp.precio_unitario,
      (cp.cantidad * cp.precio_unitario) as total,
      IFNULL(p.nombre, 'Producto') as producto_nombre,
      IFNULL(u.nombre, 'Usuario') as usuario_nombre,
      IFNULL(u.apellido, '') as usuario_apellido
    FROM ventas v
    JOIN compra_productos cp ON v.id_compra_productos = cp.id_compra_productos
    LEFT JOIN productos p ON cp.id_producto = p.id_producto
    LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
    ORDER BY v.fecha_venta DESC
  `;
  
  db.query(sql)
    .then(([ventas]) => {
      console.log(`Ventas obtenidas: ${ventas.length} registros`);
      res.json(ventas);
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al obtener ventas" });
    });
});

// POST - Crear venta (ESTA ES LA RUTA QUE FALTA)
router.post('/', (req, res) => {
  const { id_compra_productos, id_usuario } = req.body;
  
  console.log('Creando venta:', { id_compra_productos, id_usuario });
  
  if (!id_compra_productos || !id_usuario) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }
  
  const sql = `
    INSERT INTO ventas (id_compra_productos, id_usuario, fecha_venta, estado)
    VALUES (?, ?, NOW(), 'completada')
  `;
  
  db.query(sql, [id_compra_productos, id_usuario])
    .then(([result]) => {
      console.log('Venta creada ID:', result.insertId);
      res.json({
        id_venta: result.insertId,
        mensaje: "Venta creada"
      });
    })
    .catch((error) => {
      console.error('Error al crear venta:', error);
      res.status(500).json({ 
        error: "Error al crear venta",
        detalles: error.message
      });
    });
});

// GET - Ventas de HOY (NUEVA RUTA)
router.get('/hoy', (req, res) => {
  const sql = `
    SELECT COUNT(*) as total_ventas 
    FROM ventas 
    WHERE DATE(fecha_venta) = CURDATE()
  `;
  
  db.query(sql)
    .then(([result]) => {
      const total = result[0].total_ventas || 0;
      console.log(`Ventas hoy (${new Date().toLocaleDateString()}): ${total}`);
      res.json({ total_ventas: total });
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al obtener ventas de hoy" });
    });
});

// GET - Ventas del MES
router.get('/mes', (req, res) => {
  const sql = `
    SELECT COUNT(*) as total_ventas 
    FROM ventas 
    WHERE MONTH(fecha_venta) = MONTH(CURDATE()) 
      AND YEAR(fecha_venta) = YEAR(CURDATE())
  `;
  
  db.query(sql)
    .then(([result]) => {
      const total = result[0].total_ventas || 0;
      console.log(` Ventas mes: ${total}`);
      res.json({ total_ventas: total });
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al obtener ventas del mes" });
    });
});

// DELETE - Eliminar venta
router.delete('/:id', (req, res) => {
  const ventaId = req.params.id;
  
  const sql = `DELETE FROM ventas WHERE id_venta = ?`;
  
  db.query(sql, [ventaId])
    .then(() => {
      res.json({ mensaje: 'Venta eliminada' });
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al eliminar venta" });
    });
});

module.exports = router;