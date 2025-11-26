// middleware.js
const { verificarToken } = require('@damianegreco/hashpass');
const { TOKEN_SECRET } = process.env;

function middleware(req, res, next) {
  const token = req.headers.authorization;

  const verificacion = verificarToken(token, TOKEN_SECRET);

  if (verificacion?.data) {
    req.user = verificacion.data;
    next();
  } else {
    res.status(401).send("Sin autorización");
  }
}

module.exports = middleware;