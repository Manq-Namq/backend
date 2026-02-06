const router = require('express').Router();
const db = require('../conexion');
const middleware = require('../middleware');

// GET /usuarios - Obtener todos los usuarios (para admin)
router.get('/', middleware, function(req, res, next) {
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
router.get('/:id', middleware, function(req, res, next) {
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
  
  const sql = "UPDATE usuarios SET nombre = ?, apellido = ?, email = ?, telefono = ?, direccion = ?, id_rol = ? WHERE id_usuario = ?";
  const { id_rol } = req.body;
  
  db.query(sql, [nombre, apellido, email, telefono, direccion, id_rol, id])
    .then(() => {
      // Obtener usuario actualizado para devolverlo
      const getSql = "SELECT id_usuario, nombre, apellido, email, telefono, direccion, id_rol FROM usuarios WHERE id_usuario = ?";
      return db.query(getSql, [id]);
    })
    .then(([usuarios]) => {
      if (usuarios.length > 0) {
        res.json({
          mensaje: "Usuario actualizado correctamente",
          usuario: usuarios[0]
        });
      } else {
        res.status(404).json({ error: "Usuario no encontrado" });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Error del servidor" });
    });
});

// DELETE /usuarios/:id - Eliminar usuario (SIN verificación)
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

// POST /usuarios - Agregar usuario
router.post('/', function(req, res, next) {
  const { nombre, apellido, email, password, telefono, direccion } = req.body;

  // Verificar si el usuario ya existe
  const checkSql = "SELECT id_usuario FROM usuarios WHERE email = ?";
  db.query(checkSql, [email])
    .then(([existingUsers]) => {
      if (existingUsers.length > 0) {
        throw new Error('El usuario ya existe');
      } 
      
      // Insertar nuevo usuario con rol 2 (usuario normal)
      const insertSql = "INSERT INTO usuarios (nombre, apellido, email, password, telefono, direccion, fecha_registro, id_rol) VALUES (?, ?, ?, ?, ?, ?, CURDATE(), 2)";
      return db.query(insertSql, [nombre, apellido, email, password, telefono, direccion]);
    })
    .then(([result]) => {
      // Obtener el usuario recién creado
      const getUsuarioSql = "SELECT id_usuario, nombre, apellido, email, id_rol FROM usuarios WHERE id_usuario = ?";
      return db.query(getUsuarioSql, [result.insertId]);
    })
    .then(([newUsers]) => {
      const usuario = newUsers[0];
      res.json({
        usuario: usuario,
        mensaje: 'Usuario registrado exitosamente'
      });
    })
    .catch((error) => {
      console.error(error);
      if (error.message === 'El usuario ya existe') {
        res.status(400).send(error.message);
      } else {
        res.status(500).send("Ocurrió un error");
      }
    });
});

module.exports = router;