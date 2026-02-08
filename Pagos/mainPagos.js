const express = require('express');
const router = express.Router();
const db = require('../conexion');

// POST - Crear pago con dirección
router.post('/', (req, res) => {
  const { id_carrito, monto, metodo, direccion } = req.body;
  
  const sql = `INSERT INTO pagos (id_carrito, monto, fecha, metodo, estado, direccion_envio) VALUES (?, ?, NOW(), ?, 'pendiente', ?)`;
  
  db.query(sql, [id_carrito, monto, metodo, direccion || ''])
    .then(([result]) => {
      res.json({ id_pago: result.insertId, mensaje: 'Pago creado' });
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al crear pago" });
    });
});

// GET - TODOS los pagos
router.get('/', (req, res) => {
  const sql = `
    SELECT p.id_pago, p.monto, DATE_FORMAT(p.fecha, '%d/%m/%Y %H:%i') as fecha,
           p.metodo, p.estado, p.id_carrito, p.direccion_envio,
           COALESCE(u.nombre, 'Usuario') as usuario_nombre,
           COALESCE(u.apellido, '') as usuario_apellido
    FROM pagos p
    LEFT JOIN carritos c ON p.id_carrito = c.id_carrito
    LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
    ORDER BY p.fecha DESC
  `;
  
  db.query(sql)
    .then(([pagos]) => res.json(pagos))
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al obtener pagos" });
    });
});

// PUT - Actualizar estado de pago (versión más simple)
router.put('/:id', (req, res) => {
  const idPago = req.params.id;
  const { estado } = req.body;
  
  console.log('Actualizando pago', idPago, 'a:', estado);
  
  // 1. Actualizar estado del pago
  db.query(`UPDATE pagos SET estado = ? WHERE id_pago = ?`, [estado, idPago])
    .then(() => {
      // Si se aprueba
      if (estado === 'aprobado') {
        // Obtener datos del pago
        return db.query(`SELECT id_carrito, direccion_envio FROM pagos WHERE id_pago = ?`, [idPago])
          .then(([pagoData]) => {
            if (pagoData.length === 0) {
              return res.status(404).json({ error: "Pago no encontrado" });
            }
            
            const idCarrito = pagoData[0].id_carrito;
            const direccionEnvio = pagoData[0].direccion_envio || '';
            
            // Obtener productos del carrito para actualizar stock
            return db.query(`SELECT id_producto, cantidad FROM compra_productos WHERE id_carrito = ?`, [idCarrito])
              .then(([productosData]) => {
                // Actualizar stock de cada producto
                const stockPromises = productosData.map(producto => {
                  return db.query(`UPDATE productos SET stock = stock - ? WHERE id_producto = ?`, 
                    [producto.cantidad, producto.id_producto]);
                });
                return Promise.all(stockPromises);
              })
              .then(() => {
                console.log('Stock actualizado');
                
                // Crear ventas
                return db.query(`
                  INSERT INTO ventas (id_compra_productos, id_usuario, fecha_venta, estado) 
                  SELECT cp.id_compra_productos, c.id_usuario, NOW(), 'completada'
                  FROM compra_productos cp
                  JOIN carritos c ON cp.id_carrito = c.id_carrito
                  WHERE cp.id_carrito = ?
                `, [idCarrito]);
              })
              .then(([ventaResult]) => {
                console.log('Ventas creadas:', ventaResult.affectedRows);
                
                // Actualizar estado del carrito
                return db.query(`UPDATE carritos SET estado = 'completado' WHERE id_carrito = ?`, [idCarrito]);
              })
              .then(() => {
                console.log('Carrito actualizado');
                
                // Obtener usuario para crear envío
                return db.query(`SELECT id_usuario FROM carritos WHERE id_carrito = ?`, [idCarrito]);
              })
              .then(([usuarioData]) => {
                if (usuarioData.length > 0) {
                  const idUsuario = usuarioData[0].id_usuario;
                  
                  // Crear envío
                  return db.query(`INSERT INTO envios (id_usuario, direccion, estado, fecha) VALUES (?, ?, 'procesando', NOW())`, 
                    [idUsuario, direccionEnvio]);
                }
                return Promise.resolve();
              })
              .then(() => {
                console.log('Envío creado');
                res.json({ mensaje: 'Pago aprobado. Stock, venta y envío procesados.' });
              });
          });
      }
      
      // Si se rechaza o pone pendiente
      else if (estado === 'rechazado' || estado === 'pendiente') {
        return db.query(`SELECT id_carrito FROM pagos WHERE id_pago = ?`, [idPago])
          .then(([pagoData]) => {
            if (pagoData.length > 0) {
              const idCarrito = pagoData[0].id_carrito;
              
              // Eliminar ventas asociadas
              return db.query(`
                DELETE FROM ventas 
                WHERE id_compra_productos IN (
                  SELECT id_compra_productos FROM compra_productos WHERE id_carrito = ?
                )
              `, [idCarrito])
                .then(() => {
                  res.json({ mensaje: `Pago ${estado}. Ventas eliminadas.` });
                });
            }
            res.json({ mensaje: `Pago ${estado}` });
          });
      }
      
      // Para otros estados
      else {
        res.json({ mensaje: 'Estado actualizado' });
      }
    })
    .catch((error) => {
      console.error('Error completo:', error);
      res.status(500).json({ 
        error: "Error al actualizar pago",
        detalles: error.message,
        sqlMessage: error.sqlMessage || 'Sin detalles SQL'
      });
    });
});

// DELETE - Eliminar pago
router.delete('/:id', (req, res) => {
  const pagoId = req.params.id;
  
  db.query(`DELETE FROM pagos WHERE id_pago = ?`, [pagoId])
    .then(() => res.json({ mensaje: 'Pago eliminado' }))
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al eliminar pago" });
    });
});

module.exports = router;