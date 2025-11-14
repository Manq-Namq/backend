const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configurar CORS para permitir tu frontend
app.use(cors({
    origin: 'http://localhost:3000', // o el puerto donde corre tu React
    credentials: true
}));

app.use(express.json());

// Importar rutas
const categoriasRouter = require('./Routers/categorias');
const productosRouter = require('./Routers/productos');
const usuariosRouter = require('./Routers/usuarios');

// Usar rutas
app.use('/api/categorias', categoriasRouter);  // Agregar /api
app.use('/api/productos', productosRouter);    // Agregar /api  
app.use('/api/usuarios', usuariosRouter);      // Agregar /api

app.get('/', (req, res) => {
    res.json({ 
        message: 'API de TejidosMiki funcionando',
        rutas: {
            categorias: '/api/categorias',
            productos: '/api/productos',
            usuarios: '/api/usuarios'
        }
    });
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
});

app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});