const db = require('../Configuracion/database');

const getProductos = async (req, res) => {
    try {
        const [productos] = await db.execute('SELECT id_producto, nombre, descripcion, precio, stock, categoria_id FROM productos');
        res.json(productos);
    } catch (error) {
        console.error('Error en getProductos:', error);
        res.status(500).send("Ocurrió un error");
    }
};

module.exports = {
    getProductos
};