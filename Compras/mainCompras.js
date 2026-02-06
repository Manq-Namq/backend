const express = require('express');
const router = express.Router();
const db = require('../conexion');

// GET TODAS las compras_productos
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      cp.id_compra_productos,
      cp.id_carrito,
      cp.id_producto,
      cp.cantidad,
      cp.precio_unitario,
      IFNULL(p.nombre, 'Producto no disponible') as producto_nombre,
      IFNULL(u.nombre, 'Usuario') as usuario_nombre,
      IFNULL(u.apellido, '') as usuario_apellido,
      IFNULL(u.direccion, 'Sin dirección') as direccion_usuario,
      IFNULL(u.ciudad, 'Sin ciudad') as ciudad_usuario,
      IFNULL(c.estado, 'sin estado') as estado_carrito,
      (cp.cantidad * cp.precio_unitario) as total
    FROM compra_productos cp
    LEFT JOIN productos p ON cp.id_producto = p.id_producto
    LEFT JOIN carritos c ON cp.id_carrito = c.id_carrito
    LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
    ORDER BY cp.id_compra_productos DESC
  `;
  
  db.query(sql)
    .then(([compras]) => {
      console.log(` Compras obtenidas: ${compras.length} registros`);
      res.json(compras);
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: "Error al obtener compras" });
    });
});

// POST  Registrar compra y ENVÍO automáticamente
router.post('/', (req, res) => {
  const { id_carrito, id_producto, cantidad, precio_unitario, id_usuario } = req.body;
  
  console.log('Registrando compra y envío:', req.body);
  
  // 1 Primero obtenemos los datos del usuario para el envío
  const getUsuarioSql = `SELECT nombre, apellido, direccion, ciudad, codigo_postal FROM usuarios WHERE id_usuario = ?`;
  
  db.query(getUsuarioSql, [id_usuario])
    .then(([usuarios]) => {
      if (usuarios.length === 0) {
        throw new Error('Usuario no encontrado');
      }
      
      const usuario = usuarios[0];
      
      // 2 Registrar la compra
      const compraSql = `INSERT INTO compra_productos (id_carrito, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)`;
      
      return db.query(compraSql, [id_carrito, id_producto, cantidad, precio_unitario])
        .then(([result]) => {
          const idCompra = result.insertId;
          
          // 3 Registrar el envío automáticamente
          const envioSql = `
            INSERT INTO envios (id_usuario, id_compra, direccion, estado, ciudad, codigo_postal, fecha)
            VALUES (?, ?, ?, 'Pendiente', ?, ?, NOW())
          `;
          
          return db.query(envioSql, [
            id_usuario,
            idCompra,
            usuario.direccion || 'Dirección no especificada',
            usuario.ciudad || 'Ciudad no especificada',
            usuario.codigo_postal || '0000'
          ])
          .then(() => {
            return { id_compra_productos: idCompra, mensaje: 'Compra y envío registrados' };
          });
        });
    })
    .then((resultado) => {
      res.json(resultado);
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).json({ error: error.message || "Error al registrar compra y envío" });
    });
});

module.exports = router;