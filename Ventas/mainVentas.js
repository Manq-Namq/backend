const express = require('express');
const router = express.Router();
const db = require('../conexion');

// POST para registrar venta y actualizar stock
router.post('/', (req, res) => {
  const { id_compra_productos, id_usuario } = req.body;
  
  console.log('Iniciando registro de venta...');
  
  // Obtener detalles completos de la compra
  const getCompraSql = `
    SELECT cp.id_producto, cp.cantidad, p.nombre, p.stock
    FROM compra_productos cp 
    JOIN productos p ON cp.id_producto = p.id_producto
    WHERE cp.id_compra_productos = ?
  `;
  
  db.query(getCompraSql, [id_compra_productos])
    .then(([compraData]) => {
      if (compraData.length === 0) {
        return res.status(404).json({ error: "Compra no encontrada" });
      }
      
      const compra = compraData[0];
      
      // Validar stock
      if (Number(compra.cantidad) > Number(compra.stock)) {
        return res.status(400).json({ 
          error: `Stock insuficiente para "${compra.nombre}". Disponible: ${compra.stock}, Solicitado: ${compra.cantidad}`,
          stock_disponible: compra.stock,
          cantidad_solicitada: compra.cantidad
        });
      }
      
      // Calcular nuevo stock
      const nuevoStock = Number(compra.stock) - Number(compra.cantidad);
      
      // Actualizar stock en productos
      const updateStockSql = `UPDATE productos SET stock = ? WHERE id_producto = ?`;
      
      return db.query(updateStockSql, [nuevoStock, compra.id_producto])
        .then(() => {
          // Registrar la venta
          const insertVentaSql = `
            INSERT INTO ventas (id_compra_productos, id_usuario, fecha_venta, estado) 
            VALUES (?, ?, NOW(), 'completada')
          `;
          
          return db.query(insertVentaSql, [id_compra_productos, id_usuario])
            .then(([result]) => {
              res.json({
                id_venta: result.insertId,
                mensaje: 'Venta registrada correctamente',
                producto: compra.nombre,
                stock_actual: nuevoStock,
                unidades_vendidas: compra.cantidad
              });
            });
        });
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al procesar la venta" });
    });
});

// DELETE - Eliminar venta y restaurar stock (SOLO UN DELETE)
router.delete('/:id', (req, res) => {
  const ventaId = req.params.id;
  
  // Obtener información de la venta
  const getVentaSql = `
    SELECT cp.id_producto, cp.cantidad, p.nombre
    FROM ventas v
    JOIN compra_productos cp ON v.id_compra_productos = cp.id_compra_productos
    JOIN productos p ON cp.id_producto = p.id_producto
    WHERE v.id_venta = ?
  `;
  
  db.query(getVentaSql, [ventaId])
    .then(([ventaData]) => {
      if (ventaData.length === 0) {
        return res.status(404).json({ error: "Venta no encontrada" });
      }
      
      const venta = ventaData[0];
      
      // Restaurar stock
      const restoreStockSql = `UPDATE productos SET stock = stock + ? WHERE id_producto = ?`;
      
      return db.query(restoreStockSql, [venta.cantidad, venta.id_producto])
        .then(() => {
          // Eliminar la venta
          const deleteSql = `DELETE FROM ventas WHERE id_venta = ?`;
          
          return db.query(deleteSql, [ventaId])
            .then(() => {
              res.json({ 
                mensaje: 'Venta eliminada y stock restaurado',
                producto: venta.nombre,
                cantidad_restaurada: venta.cantidad
              });
            });
        });
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al eliminar venta" });
    });
});

// GET todas las ventas
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      v.id_venta,
      DATE_FORMAT(v.fecha_venta, '%d/%m/%Y %H:%i') as fecha_venta,
      v.estado,
      cp.cantidad,
      cp.precio_unitario,
      (cp.cantidad * cp.precio_unitario) as total,
      p.nombre as producto_nombre,
      u.nombre as usuario_nombre,
      u.apellido as usuario_apellido
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

// GET Ventas de hoy
router.get('/hoy', (req, res) => {
  const sql = `
    SELECT COUNT(*) as total_ventas 
    FROM ventas 
    WHERE DATE(fecha_venta) = CURDATE()
  `;
  
  db.query(sql)
    .then(([result]) => {
      const total = result[0].total_ventas || 0;
      res.json({ total_ventas: total });
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al obtener ventas de hoy" });
    });
});

// GET Ventas del mes
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
      res.json({ total_ventas: total });
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al obtener ventas del mes" });
    });
});

module.exports = router;