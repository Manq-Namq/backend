const express = require('express');
const router = express.Router();
const db = require('../conexion');

// POST, Crear pago 
router.post('/', (req, res) => {
  const { id_carrito, monto, metodo } = req.body;
  
  console.log('Creando pago:', { id_carrito, monto, metodo });
  
  const sql = `INSERT INTO pagos (id_carrito, monto, fecha, metodo, estado) VALUES (?, ?, NOW(), ?, 'pendiente')`;
  
  db.query(sql, [id_carrito, monto, metodo])
    .then(([result]) => {
      res.json({
        id_pago: result.insertId,
        mensaje: 'Pago creado exitosamente'
      });
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al crear pago" });
    });
});

// GET todos los pagos
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      p.id_pago,
      p.monto,
      DATE_FORMAT(p.fecha, '%d/%m/%Y %H:%i') as fecha,
      p.metodo,
      p.estado,
      p.id_carrito,
      COALESCE(u.nombre, 'Usuario') as usuario_nombre,
      COALESCE(u.apellido, '') as usuario_apellido
    FROM pagos p
    LEFT JOIN carritos c ON p.id_carrito = c.id_carrito
    LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
    ORDER BY p.fecha DESC
  `;
  
  db.query(sql)
    .then(([pagos]) => {
      console.log("PAGOS ENVIADOS AL FRONTEND:", pagos.length);
      res.json(pagos);
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al obtener pagos" });
    });
});

router.put('/:id', (req, res) => {
  const idPago = req.params.id;
  const { estado } = req.body;
  
  console.log('Actualizando pago', idPago, 'a estado:', estado);
  
  const sql = `UPDATE pagos SET estado = ? WHERE id_pago = ?`;
  
  db.query(sql, [estado, idPago])
    .then(() => {
      // Si se aprueba el pago, crear venta automáticamente
      if (estado === 'aprobado') {
        console.log('Pago aprobado, creando venta...');
        
        const sqlVenta = `
          INSERT INTO ventas (id_compra_productos, id_usuario, fecha_venta, estado) 
          SELECT 
            cp.id_compra_productos,
            c.id_usuario,
            NOW(),
            'completada'
          FROM pagos p
          JOIN carritos c ON p.id_carrito = c.id_carrito
          JOIN compra_productos cp ON p.id_carrito = cp.id_carrito
          WHERE p.id_pago = ?
          AND NOT EXISTS (
            SELECT 1 FROM ventas v 
            WHERE v.id_compra_productos = cp.id_compra_productos
          )
        `;
        
        return db.query(sqlVenta, [idPago])
          .then(([result]) => {
            console.log('Venta creada con ID:', result.insertId);
            
            // NUEVO: Actualizar estado del carrito a 'completado'
            const sqlUpdateCarrito = `
              UPDATE carritos 
              SET estado = 'completado' 
              WHERE id_carrito = (
                SELECT id_carrito FROM pagos WHERE id_pago = ?
              )
            `;
            
            return db.query(sqlUpdateCarrito, [idPago])
              .then(() => {
                console.log('Carrito actualizado a completado');
                res.json({ 
                  mensaje: 'Pago aprobado, venta creada y carrito completado',
                  venta_creada: true 
                });
              });
          });
      }
      
      res.json({ 
        mensaje: 'Estado actualizado',
        venta_creada: false 
      });
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al actualizar pago" });
    });
});
// DELETE, Eliminar pago
router.delete('/:id', (req, res) => {
  const pagoId = req.params.id;
  
  const sql = `DELETE FROM pagos WHERE id_pago = ?`;
  
  db.query(sql, [pagoId])
    .then(() => {
      res.json({ mensaje: 'Pago eliminado' });
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al eliminar pago" });
    });
});

module.exports = router;