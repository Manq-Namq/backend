const express = require('express');
const router = express.Router();
const db = require('../conexion');

// POST - Crear pago CON DIRECCIÓN
router.post('/', (req, res) => {
  const { id_carrito, monto, metodo, direccion } = req.body; 
  
  console.log('Creando pago con dirección:', { id_carrito, monto, metodo, direccion });
  
  const sql = `INSERT INTO pagos (id_carrito, monto, fecha, metodo, estado, direccion) VALUES (?, ?, NOW(), ?, 'pendiente', ?)`;
  
  db.query(sql, [id_carrito, monto, metodo, direccion || ''])
    .then(([result]) => {
      res.json({ id_pago: result.insertId, mensaje: 'Pago creado' });
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al crear pago" });
    });
});

// GET - TODOS los pagos CON DIRECCIÓN
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      p.id_pago, p.monto, DATE_FORMAT(p.fecha, '%d/%m/%Y %H:%i') as fecha,
      p.metodo, p.estado, p.id_carrito, p.direccion,
      COALESCE(u.nombre, 'Usuario') as usuario_nombre,
      COALESCE(u.apellido, '') as usuario_apellido,
      GROUP_CONCAT(DISTINCT pr.nombre SEPARATOR ', ') as productos_nombres,
      COUNT(DISTINCT cp.id_producto) as cantidad_productos
    FROM pagos p
    LEFT JOIN carritos c ON p.id_carrito = c.id_carrito
    LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
    LEFT JOIN compra_productos cp ON p.id_carrito = cp.id_carrito
    LEFT JOIN productos pr ON cp.id_producto = pr.id_producto
    GROUP BY p.id_pago
    ORDER BY p.fecha DESC
  `;
  
  db.query(sql)
    .then(([pagos]) => res.json(pagos))
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al obtener pagos" });
    });
});

// PUT - Actualizar estado de pago (MODIFICADO para incluir nombre_usuario)
router.put('/:id', (req, res) => {
  const idPago = req.params.id;
  const { estado } = req.body;
  
  // Primero obtener el estado actual y la dirección del pago
  const getPagoSql = `SELECT estado, direccion, id_carrito FROM pagos WHERE id_pago = ?`;
  
  db.query(getPagoSql, [idPago])
    .then(([pagoData]) => {
      if (pagoData.length === 0) {
        return res.status(404).json({ error: "Pago no encontrado" });
      }
      
      const estadoActual = pagoData[0].estado;
      const direccionPago = pagoData[0].direccion;
      const idCarrito = pagoData[0].id_carrito;
      
      if (estado === estadoActual) {
        return res.json({ mensaje: 'El pago ya tiene este estado' });
      }
      
      // Actualizar estado del pago
      const updatePagoSql = `UPDATE pagos SET estado = ? WHERE id_pago = ?`;
      
      return db.query(updatePagoSql, [estado, idPago])
        .then(() => {
          // Función para manejar envíos (MODIFICADA)
          const manejarEnvios = (accion) => {
            if (accion === 'crear') {
              // Obtener el usuario asociado al carrito con su nombre COMPLETO
              const getUsuarioSql = `
                SELECT c.id_usuario, u.nombre, u.apellido 
                FROM carritos c 
                JOIN usuarios u ON c.id_usuario = u.id_usuario 
                WHERE c.id_carrito = ?
              `;
              
              return db.query(getUsuarioSql, [idCarrito])
                .then(([usuarioData]) => {
                  if (usuarioData.length === 0) {
                    return Promise.resolve();
                  }
                  
                  const idUsuario = usuarioData[0].id_usuario;
                  const nombreUsuario = usuarioData[0].nombre; // Nombre real del usuario
                  const apellidoUsuario = usuarioData[0].apellido;
                  const nombreCompleto = `${nombreUsuario} ${apellidoUsuario}`.trim();
                  
                  // Crear envío con nombre_usuario REAL
                  const crearEnvioSql = `
                    INSERT INTO envios 
                    (id_usuario, direccion, estado, fecha, nombre_usuario) 
                    VALUES (?, ?, 'procesando', NOW(), ?)
                  `;
                  
                  return db.query(crearEnvioSql, [
                    idUsuario, 
                    direccionPago || 'Dirección no especificada',
                    nombreCompleto  // <-- Nombre real del usuario
                  ]);
                });
            }
            return Promise.resolve();
          };
          
          // Función para actualizar stock
          const actualizarStock = (operacion) => {
            return db.query(`
              UPDATE productos p
              JOIN compra_productos cp ON p.id_producto = cp.id_producto
              SET p.stock = p.stock ${operacion} cp.cantidad
              WHERE cp.id_carrito = ?
            `, [idCarrito]);
          };
          
          // CASO 1: Aprobando un pago
          if (estado === 'aprobado' && (estadoActual === 'pendiente' || estadoActual === 'rechazado')) {
            return actualizarStock('-')
              .then(() => {
                // Crear venta
                return db.query(`
                  INSERT INTO ventas (id_compra_productos, id_usuario, fecha_venta, estado) 
                  SELECT cp.id_compra_productos, c.id_usuario, NOW(), 'completada'
                  FROM compra_productos cp
                  JOIN carritos c ON cp.id_carrito = c.id_carrito
                  WHERE cp.id_carrito = ?
                  AND NOT EXISTS (
                    SELECT 1 FROM ventas v WHERE v.id_compra_productos = cp.id_compra_productos
                  )
                `, [idCarrito]);
              })
              .then(() => manejarEnvios('crear'))
              .then(() => {
                res.json({ mensaje: 'Pago aprobado, stock actualizado, venta y envío creados' });
              });
          }
          
          // CASO 2: Rechazando un pago aprobado
          if (estado === 'rechazado' && estadoActual === 'aprobado') {
            return actualizarStock('+')
              .then(() => {
                // Eliminar ventas
                return db.query(`
                  DELETE FROM ventas 
                  WHERE id_compra_productos IN (
                    SELECT cp.id_compra_productos 
                    FROM compra_productos cp
                    WHERE cp.id_carrito = ?
                  )
                `, [idCarrito]);
              })
              .then(() => {
                res.json({ mensaje: 'Pago rechazado, stock devuelto y ventas eliminadas' });
              });
          }
          
          // CASOS RESTANTES
          if (estado === 'pendiente' && estadoActual === 'aprobado') {
            return actualizarStock('+')
              .then(() => {
                return db.query(`
                  DELETE FROM ventas 
                  WHERE id_compra_productos IN (
                    SELECT cp.id_compra_productos 
                    FROM compra_productos cp
                    WHERE cp.id_carrito = ?
                  )
                `, [idCarrito]);
              })
              .then(() => {
                res.json({ mensaje: 'Pago pendiente, stock devuelto y ventas eliminadas' });
              });
          }
          
          if ((estado === 'pendiente' && estadoActual === 'rechazado') || 
              (estado === 'rechazado' && estadoActual === 'pendiente')) {
            return db.query(`
              DELETE FROM ventas 
              WHERE id_compra_productos IN (
                SELECT cp.id_compra_productos 
                FROM compra_productos cp
                WHERE cp.id_carrito = ?
              )
            `, [idCarrito])
              .then(() => {
                res.json({ mensaje: `Pago ${estado}. Ventas eliminadas si existían.` });
              });
          }
          
          res.json({ mensaje: 'Estado actualizado' });
        });
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al actualizar pago" });
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