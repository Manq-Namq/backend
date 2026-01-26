const express = require('express');
const path = require("path");
const cors = require('cors');
const fs = require('fs');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const fileUpload = require("express-fileupload");
const app = express();
const PORT = process.env.PORT || 5000;

//Middleware
app.use(cors({
  origin: 'http://localhost:5173', // tu URL del frontend
  credentials: true // permite el envío de cookies
}));
app.use(express.json());
app.use(cookieParser()); // Middleware para parsear cookies
app.use(fileUpload());

// Importar middleware de autenticación
const middleware = require('./middleware');

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//Crear capeta uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Carpeta uploads creada en:', uploadsDir);
}


// Importar rutas
const productosRouter = require('./Productos/mainProductos');
const usuariosRouter = require('./Usuarios/main');
const categoriasRouter = require('./Categorias/mainCategorias');
const enviosRouter = require('./Envios/mainEnvios');
const ventasRouter = require('./Ventas/mainVentas');
const comprasRouter = require('./Compras/mainCompras');
const pagosRouter = require('./Pagos/mainPagos');
const carritosRouter = require('./carritos/mainCarritos');

// Usar rutas
app.use('/api/productos', productosRouter);
app.use('/usuarios', usuariosRouter);
app.use('/api/categorias', categoriasRouter);
app.use('/api/envios', enviosRouter);
app.use('/api/ventas', ventasRouter);
app.use('/api/compras', comprasRouter);
app.use('/api/pagos', pagosRouter);
app.use('/api/carritos', carritosRouter);

// Ruta de prueba
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Backend de TejidosMiki funcionando',
        timestamp: new Date().toISOString()
    });
});

// Ruta raíz
app.get('/', function(req, res, next){
  res.json({
    status: 'ok',
    message: 'Bienvenido a la API de TejidosMiki'
  });
});

// Ruta para listar archivos en uploads (solo para desarrollo)
app.get('/uploads/', (req, res) => {
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer la carpeta uploads' });
        }
        res.json({ 
            message: 'Contenido de la carpeta uploads',
            archivos: files,
            total: files.length
        });
    });
});

app.listen(PORT, function(error) {
  if (error){
    console.error(error);
    process.exit(1);
  }
  console.log(`Escuchando en el puerto ${PORT}`);
  console.log(`Carpeta uploads: ${uploadsDir}`);
  console.log(`Acceso a uploads: http://localhost:${PORT}/uploads/`);
});