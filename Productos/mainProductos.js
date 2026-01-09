const router = require('express').Router();
const db = require('../conexion');
const path = require('path');
const fs = require("fs");

// Directorio para imágenes 
const directorio = path.join(__dirname, "..", "uploads");

// Verificar que el directorio existe
if (!fs.existsSync(directorio)) {
    console.log('Creando directorio uploads:', directorio);
    fs.mkdirSync(directorio, { recursive: true });
}

// GET obtener producto por id
router.get('/:id', function(req, res, next) {
  const { id } = req.params;
  
  const sql = "SELECT id_producto, nombre, descripcion, precio, stock, imagen_url FROM productos WHERE id_producto = ?";
  
  db.query(sql, [id])
    .then(([productos]) => {
      if (productos.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      res.json(productos[0]);
    })
    .catch((error) => {
      console.error("Error en GET /:id:", error);
      res.status(500).json({ error: "Error del servidor" });
    });
});

// GET /productos - Obtener todos los productos
router.get('/', function(req, res, next) {
  const sql = "SELECT id_producto, nombre, descripcion, precio, stock, imagen_url FROM productos ORDER BY id_producto DESC";
  
  db.query(sql)
    .then(([productos]) => {
      res.json(productos);
    })
    .catch((error) => {
      console.error("Error en GET /:", error);
      res.status(500).json({ error: "Error del servidor" });
    });
<<<<<<< HEAD

=======
>>>>>>> develop_orosco
});

// Ruta para obtener imagen 
router.get("/imagen/:nombre", function(req, res, next){
  const {nombre} = req.params;

  const filepath = path.join(directorio, nombre);

  if (!fs.existsSync(filepath)){
    console.error("No existe");
    return res.status(404).send("Archivo no existe");
  }

  res.sendFile(filepath);
});

// POST /productos  Crear producto con imagen (COMO EN TU EJEMPLO)
router.post('/', function(req, res, next) {
  console.log("Recibiendo solicitud POST /productos");
  
  if (!req.files || !req.files.imagen) {
    console.error("No se subió imagen");
    return res.status(400).json({ error: "Debe subir una imagen" });
  }

  const imagen = req.files.imagen;
  console.log("Archivo recibido:", imagen.name);
  
  // Validar extensión (IGUAL QUE EN TU EJEMPLO)
  const extension = path.extname(imagen.name);
  
  if (extension !== ".jpg" && extension !== ".jpeg" && extension !== ".png") {
    console.error("Archivo no permitido");
    return res.status(403).json({ error: "Solo se permiten imágenes JPG, PNG" });
  }

  const filepath = path.join(directorio, imagen.name);

  // Mover imagen (IGUAL QUE EN TU EJEMPLO)
  imagen.mv(filepath, function(error){ 
    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Ocurrió un error al guardar la imagen" });
    }
    
    // Leer los datos del formulario
    const { nombre, descripcion, precio, stock } = req.body;
    
    // Validar campos requeridos
    if (!nombre || !precio || !stock) {
      console.error("Campos faltantes");
      return res.status(400).json({ error: "Faltan campos requeridos: nombre, precio, stock" });
    }
    
    // Guardar en base de datos
    const imagen_url = '/uploads/' + imagen.name;
    const sql = "INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url) VALUES (?, ?, ?, ?, ?)";  
    
    db.query(sql, [nombre, descripcion || '', precio, stock, imagen_url])
      .then(([result]) => {
        res.json({
          mensaje: "Producto creado correctamente",
          id: result.insertId
        });
      })
      .catch(function(error){
        console.error(error);
        res.status(500).json({ error: "Error del servidor" });
      });
  });
});

// PUT actualizar producto
router.put('/:id', function(req, res, next) {
  const { id } = req.params;
  const { nombre, descripcion, precio, stock } = req.body;
  
  // Si se sube nueva imagen
  if (req.files && req.files.imagen) {
    const imagen = req.files.imagen;
    
    // Validar extensión
    const extension = path.extname(imagen.name);
    
    if (extension !== ".jpg" && extension !== ".jpeg" && extension !== ".png") {
      console.error("Archivo no permitido");
      return res.status(403).json({ error: "Solo se permiten imágenes JPG, PNG" });
    }
    
    const filepath = path.join(directorio, imagen.name);
    const imagen_url = '/uploads/' + imagen.name;
    
    // Mover nueva imagen
    imagen.mv(filepath, function(error) {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: "Ocurrió un error al guardar la imagen" });
      }
      
      // Actualizar en base de datos
      const sql = "UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, imagen_url = ? WHERE id_producto = ?";
      
      db.query(sql, [nombre, descripcion || '', precio, stock, imagen_url, id])
      .then(() => {
        res.json({ mensaje: "Producto actualizado correctamente" });
      })
      .catch((error) => {
        console.error(error);
        res.status(500).json({ error: "Error del servidor" });
      });
    });
  } else {
    // Si no hay nueva imagen, mantener la anterior
    const sql = "UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ? WHERE id_producto = ?";
    
    db.query(sql, [nombre, descripcion || '', precio, stock, id])
    .then(() => {
      res.json({ mensaje: "Producto actualizado correctamente" });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Error del servidor" });
    });
  }
});

// DELETE Eliminar producto por id
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