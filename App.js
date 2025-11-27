const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Importar rutas
const usuariosRouter = require('./usuarios/main');
const productosRouter = require('./Productos/mainProductos');
const categoriasRouter = require('./Categorias/mainCategorias');
const enviosRouter = require('./Envios/mainEnvios');



// Usar rutas
app.use('/usuarios', usuariosRouter);
app.use('/api/productos', productosRouter);
app.use('/api/categorias', categoriasRouter);
app.use('/api/envios', enviosRouter);

// ruta test
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Backend de TejidosMiki funcionando',
        timestamp: new Date().toISOString()
    });
});
//ruta raiz
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Bienvenido a la API de TejidosMiki'
    });
});

app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});