const express = require('express');
const router = express.Router();
const db = require('../conexion');
const middleware = require('../middleware');

// GET, todos los carritos
router.get('/', middleware, (req, res) => {
  const userId = req.user.id_usuario;
  const userRole = req.user.id_rol;
  
  // Si es admin, ver todos los carritos. Si no, solo los suyos
  const whereClause = userRole === 1 ? '' : 'WHERE c.id_usuario = ?';
  const params = userRole === 1 ? [] : [userId];
  
  const sql = `
    SELECT 
      c.id_carrito,
      c.id_usuario,
      DATE_FORMAT(c.fecha_creacion, '%d/%m/%Y %H:%i') as fecha_creacion,
      u.nombre as usuario_nombre,
      u.apellido as usuario_apellido
    FROM carritos c
    LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
    ${whereClause}
    ORDER BY c.fecha_creacion DESC
  `;
  
  db.query(sql, params)
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
  
  console.log('Creando carrito para usuario autenticado:', id_usuario);
  
  const sql = `INSERT INTO carritos (id_usuario) VALUES (?)`;
  
  db.query(sql, [id_usuario])
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
router.put('/:id', middleware, (req, res) => {
  const idCarrito = req.params.id;
  const { estado } = req.body;
  const userId = req.user.id_usuario;
  const userRole = req.user.id_rol;
  
  console.log('Actualizando carrito', idCarrito, 'a estado:', estado);
  
  // Verificar que el carrito pertenece al usuario o es admin
  const checkSql = userRole === 1 ? 'SELECT 1' : 'SELECT 1 FROM carritos WHERE id_carrito = ? AND id_usuario = ?';
  const checkParams = userRole === 1 ? [] : [idCarrito, userId];
  
  db.query(checkSql, checkParams)
    .then(([checkResult]) => {
      if (checkResult.length === 0) {
        return res.status(403).json({ error: "No tienes permiso para modificar este carrito" });
      }
      
      const sql = `UPDATE carritos SET estado = ? WHERE id_carrito = ?`;
      
      return db.query(sql, [estado, idCarrito]);
    })
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