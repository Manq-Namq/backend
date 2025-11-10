const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Importar rutas
const categoriasRouter = require('./Routers/categorias');
const productosRouter = require('./Routers/productos');
const usuariosRouter = require('./Routers/usuarios');

// Usar rutas
app.use('/categorias', categoriasRouter);
app.use('/productos', productosRouter);
app.use('/usuarios', usuariosRouter);

app.get('/', (req, res) => {
    res.json({ 
        message: 'API de TejidosMiki funcionando',
        rutas: {
            categorias: '/categorias',
            productos: '/productos',
            usuarios: '/usuarios'
        }
    });
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});