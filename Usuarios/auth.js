// Backend/usuarios/auth.js
const router = require('express').Router();
const db = require('../conexion');
const { generarToken } = require('@damianegreco/hashpass');

const { TOKEN_SECRET } = process.env;

// POST /usuarios/login
router.post('/login', function(req, res, next) {
  const { email, password } = req.body;

  const sql = "SELECT id_usuario, nombre, apellido, email, password, id_rol FROM usuarios WHERE email = ?";

  db.query(sql, [email])
  .then(([usuarios]) => {
    if (usuarios && usuarios.length === 1) {
      const usuario = usuarios[0];
      
      if (password === usuario.password) {
        // CAMBIA ESTO: de 4 a 24 horas (o más)
        const token = generarToken(TOKEN_SECRET, 24, { // 24 horas en lugar de 4
          id: usuario.id_usuario, 
          nombre: usuario.nombre, 
          apellido: usuario.apellido,
          email: usuario.email,
          rol: usuario.id_rol
        });

        res.json({
          token: token,
          usuario: {
            id_usuario: usuario.id_usuario,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            id_rol: usuario.id_rol
          }
        });
      } else {
        res.status(401).json({ error: "Credenciales incorrectas" });
      }
    } else {
      res.status(401).json({ error: "Credenciales incorrectas" });
    }
  })
  .catch((error) => {
    console.error(error);
    res.status(500).json({ error: "Error del servidor" });
  });
});

// POST /usuarios/register
router.post('/register', function(req, res, next) {
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
      
      // Generar token
      const token = generarToken(TOKEN_SECRET, 4, {
        id: usuario.id_usuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.id_rol
      });

      res.json({
        token: token,
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