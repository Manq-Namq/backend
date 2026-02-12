const express = require('express');
const path = require("path");
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const fileUpload = require("express-fileupload");
const app = express();
const PORT = process.env.PORT || 5000;

// Importar conexión a base de datos
const db = require('./conexion');

//Middleware
app.use(cors());
app.use(express.json());

app.use(fileUpload());

// Importar middleware de autenticación
const middleware = require('./middleware');

app.use("/uploads", express.static(path.join(__dirname, "uploads", )));

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

// Crear tabla de comentarios si no existe
const crearTablaComentarios = async () => {
  const dropSql = `DROP TABLE IF EXISTS comentarios`;
  const createSql = `
    CREATE TABLE comentarios (
      id_comentario INT AUTO_INCREMENT PRIMARY KEY,
      id_usuario INT NOT NULL,
      id_producto INT NOT NULL,
      comentario TEXT NOT NULL,
      puntuacion INT NOT NULL,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
      FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE
    )
  `;
  
  try {
    await db.query(dropSql);
    await db.query(createSql);
    console.log('Tabla comentarios creada correctamente');
  } catch (error) {
    console.error('Error al crear tabla comentarios:', error);
  }
};

// Agregar columna id_carrito a envios si no existe
const actualizarTablaEnvios = async () => {
  try {
    console.log('Verificando tabla envios...');
    // Verificar si la columna existe
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'envios' AND COLUMN_NAME = 'id_carrito'
    `);
    
    if (columns.length === 0) {
      console.log('Agregando columna id_carrito a envios...');
      // Agregar la columna
      await db.query(`ALTER TABLE envios ADD COLUMN id_carrito INT`);
      await db.query(`ALTER TABLE envios ADD CONSTRAINT fk_envios_carrito FOREIGN KEY (id_carrito) REFERENCES carritos(id_carrito) ON DELETE SET NULL`);
      console.log('Columna id_carrito agregada a envios');
    } else {
      console.log('Columna id_carrito ya existe en envios');
    }
  } catch (error) {
    console.error('Error al actualizar tabla envios:', error);
  }
};

// Agregar columnas de dirección a usuarios si no existen
const actualizarTablaUsuarios = async () => {
  try {
    console.log('Verificando tabla usuarios...');
    const columnas = ['ciudad', 'estado', 'codigo_postal'];
    
    for (const columna of columnas) {
      const [columns] = await db.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'usuarios' AND COLUMN_NAME = ?
      `, [columna]);
      
      if (columns.length === 0) {
        console.log(`Agregando columna ${columna} a usuarios...`);
        await db.query(`ALTER TABLE usuarios ADD COLUMN ${columna} VARCHAR(255)`);
        console.log(`Columna ${columna} agregada a usuarios`);
      } else {
        console.log(`Columna ${columna} ya existe en usuarios`);
      }
    }
  } catch (error) {
    console.error('Error al actualizar tabla usuarios:', error);
  }
};

// Agregar columnas de datos de usuario a envios si no existen
const actualizarTablaEnviosDatosUsuario = async () => {
  try {
    console.log('Verificando tabla envios para datos de usuario...');
    const columnas = ['nombre_usuario', 'apellido_usuario', 'email_usuario', 'telefono_usuario'];
    
    for (const columna of columnas) {
      const [columns] = await db.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'envios' AND COLUMN_NAME = ?
      `, [columna]);
      
      if (columns.length === 0) {
        console.log(`Agregando columna ${columna} a envios...`);
        await db.query(`ALTER TABLE envios ADD COLUMN ${columna} VARCHAR(255)`);
        console.log(`Columna ${columna} agregada a envios`);
      } else {
        console.log(`Columna ${columna} ya existe en envios`);
      }
    }
  } catch (error) {
    console.error('Error al actualizar tabla envios con datos usuario:', error);
  }
};

// Inicializar base de datos y luego iniciar servidor
const iniciarServidor = async () => {
  await crearTablaComentarios();
  await actualizarTablaEnvios();
  await actualizarTablaUsuarios();
  await actualizarTablaEnviosDatosUsuario();
  
  app.listen(PORT, function(error) {
    if (error){
      console.error(error);
      process.exit(1);
    }
    console.log(`Escuchando en el puerto ${PORT}`);
    console.log(`Carpeta uploads: ${uploadsDir}`);
    console.log(`Acceso a uploads: http://localhost:${PORT}/uploads/`);
  });
};

iniciarServidor();