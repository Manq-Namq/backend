const { verificarToken } = require('@damianegreco/hashpass');

const { TOKEN_SECRET } = process.env;

function auth(req, res, next) {
  const token = req.headers.authorization;

  if (token === undefined || token === null) {
    return res.status(401).send("Token no proporcionado");
  }

  const verificacion = verificarToken(token, TOKEN_SECRET);

  if (verificacion && verificacion.data) {
    req.user = verificacion.data;
    next();
  } else {
    res.status(401).send("Sin autorización");
  }
}

function adminAuth(req, res, next) {
  // Asumimos que el rol de administrador es 1
  if (req.user.rol !== 1) {
    return res.status(403).send("Se requieren permisos de administrador");
  }
  next();
}

module.exports = { auth, adminAuth };