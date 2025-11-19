const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// IMPORTAR las rutas de tus archivos separados
const usuariosRouter = require('./Usuarios/mainUsuarios');
const productosRouter = require('./Productos/mainProductos');
const categoriasRouter = require('./Categorias/mainCategorias');

// USAR las rutas en tu aplicación
app.use('/api/usuarios', usuariosRouter);
app.use('/api/productos', productosRouter);
app.use('/api/categorias', categoriasRouter);

// Ruta de prueba
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Backend de TejidosMiki funcionando',
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Bienvenido a la API de TejidosMiki'
    });
});

app.listen(PORT, () => {
    console.log(`Servidor backend en http://localhost:${PORT}`);
});