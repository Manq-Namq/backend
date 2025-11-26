// Backend/usuarios/users.js
const router = require('express').Router();
const db = require('../conexion');

// GET /usuarios - Obtener todos los usuarios (para admin)
router.get('/', function(req, res, next) {
  const sql = "SELECT id_usuario, nombre, apellido, email, telefono, direccion, fecha_registro, id_rol FROM usuarios";
  
  db.query(sql)
    .then(([usuarios]) => {
      res.json(usuarios);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Error del servidor" });
    });
});

// GET /usuarios/:id - Obtener usuario específico
router.get('/:id', function(req, res, next) {
  const { id } = req.params;
  const sql = "SELECT id_usuario, nombre, apellido, email, telefono, direccion, fecha_registro, id_rol FROM usuarios WHERE id_usuario = ?";
  
  db.query(sql, [id])
    .then(([usuarios]) => {
      if (usuarios.length > 0) {
        res.json(usuarios[0]);
      } else {
        res.status(404).json({ error: "Usuario no encontrado" });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Error del servidor" });
    });
});

// PUT /usuarios/:id - Actualizar usuario
router.put('/:id', function(req, res, next) {
  const { id } = req.params;
  const { nombre, apellido, email, telefono, direccion } = req.body;
  
  const sql = "UPDATE usuarios SET nombre = ?, apellido = ?, email = ?, telefono = ?, direccion = ? WHERE id_usuario = ?";
  
  db.query(sql, [nombre, apellido, email, telefono, direccion, id])
    .then(() => {
      res.json({ mensaje: "Usuario actualizado correctamente" });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Error del servidor" });
    });
});

// DELETE /usuarios/:id - Eliminar usuario
router.delete('/:id', function(req, res, next) {
  const { id } = req.params;
  const sql = "DELETE FROM usuarios WHERE id_usuario = ?";
  
  db.query(sql, [id])
    .then(() => {
      res.json({ mensaje: "Usuario eliminado correctamente" });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Error del servidor" });
    });
});

module.exports = router;