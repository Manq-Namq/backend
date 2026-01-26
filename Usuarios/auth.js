// Backend/usuarios/auth.js
const router = require('express').Router();
const db = require('../conexion');
const { generarToken, verificarToken } = require('@damianegreco/hashpass');

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
        const token = generarToken(TOKEN_SECRET, 4, { 
          id: usuario.id_usuario, 
          nombre: usuario.nombre, 
          apellido: usuario.apellido,
          email: usuario.email,
          rol: usuario.id_rol
        });

        // Guardar token en cookie HttpOnly (segura, no accesible desde JS)
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 4 * 60 * 60 * 1000 // 4 horas
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

      // Guardar token en cookie HttpOnly
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 4 * 60 * 60 * 1000 // 4 horas
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

// GET /usuarios/me - Verificar sesión actual
router.get('/me', function(req, res, next) {
  const token = req.cookies.token || req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: "No autenticado" });
  }

  const verificacion = verificarToken(token, TOKEN_SECRET);

  if (verificacion?.data) {
    const usuario = {
      id_usuario: verificacion.data.id,
      nombre: verificacion.data.nombre,
      apellido: verificacion.data.apellido,
      email: verificacion.data.email,
      id_rol: verificacion.data.rol
    };
    
    res.json({ usuario, token });
  } else {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
});

// POST /usuarios/logout
router.post('/logout', function(req, res, next) {
  res.clearCookie('token');
  res.json({ mensaje: 'Sesión cerrada' });
});

module.exports = router;