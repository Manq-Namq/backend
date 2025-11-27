const router = require('express').Router();
const db = require('../conexion');



// GET /productos - Obtener todos los productos
router.get('/', function(req, res, next) {
  const sql = "SELECT id_producto, nombre, descripcion, precio, stock, imagen_url FROM productos";
  
  db.query(sql)
    .then(([productos]) => {
      res.json(productos);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Error del servidor" });
    });
    
});
// POST /productos - Crear un nuevo producto
router.post('/', function(req, res, next) {
  const { nombre, descripcion, precio, stock, imagen_url } = req.body;
  const sql = "INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url) VALUES (?, ?, ?, ?, ?)";  
  db.query(sql, [nombre, descripcion, precio, stock, imagen_url])
    .then(([result]) => {
      res.json({
        mensaje: "Producto creado correctamente",
        id: result.insertId
      })
    })
    .catch((error)=>{
      console.error(error);
      res.status(500).json({ error: "Error del servidor" });
    })
});
// PUT actualizar producto
router.put('/:id', function(req, res, next) {
  const { id } = req.params;
  const { nombre, descripcion, precio, stock, imagen_url } = req.body;
  
  const sql = "UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, imagen_url = ? WHERE id_producto = ?";
  
  db.query(sql, [nombre, descripcion, precio, stock, imagen_url, id])
    .then(() => {
      res.json({ mensaje: "Producto actualizado correctamente" });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Error del servidor" });
    });
});
    
// DELETE /productos/:id - Eliminar producto
router.delete('/:id', function(req, res, next) {
  const { id } = req.params;
  const sql = "DELETE FROM productos WHERE id_producto = ?";
  
  db.query(sql, [id])
    .then(() => {
      res.json({ mensaje: "Producto eliminado correctamente" });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Error del servidor" });
    });
});

module.exports = router;