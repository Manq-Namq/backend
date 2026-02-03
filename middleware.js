// middleware.js
const { verificarToken } = require('@damianegreco/hashpass');
const { TOKEN_SECRET } = process.env;

function middleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send("Sin autorización - Token no proporcionado o formato inválido");
  }

  const token = authHeader.replace('Bearer ', '');

  const verificacion = verificarToken(token, TOKEN_SECRET);

  if (verificacion?.data) {
    // Normalizar la estructura del usuario desde el token
    req.user = {
      id_usuario: verificacion.data.id,
      nombre: verificacion.data.nombre,
      apellido: verificacion.data.apellido,
      email: verificacion.data.email,
      id_rol: verificacion.data.rol
    };
    next();
  } else {
    res.status(401).send("Token inválido o expirado");
  }
}

module.exports = middleware;