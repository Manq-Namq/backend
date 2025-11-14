// backend/Controles/productosCon.js
const db = require('../Configuracion/database');

const getProductos = async (req, res) => {
    try {
        const [productos] = await db.execute(`
            SELECT 
                p.id_producto as id,
                p.nombre, 
                p.descripcion, 
                p.precio, 
                p.stock,
                p.imagen,
                c.nombre as categoria,
                p.material,
                p.caracteristicas,
                p.rating,
                p.reviews,
                p.envio_gratis as envioGratis,
                p.destacado
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id_categoria
        `);
        
        // Convertir características de JSON string a array si es necesario
        const productosFormateados = productos.map(producto => ({
            ...producto,
            caracteristicas: producto.caracteristicas ? JSON.parse(producto.caracteristicas) : [],
            precio: Number(producto.precio),
            stock: Number(producto.stock),
            rating: Number(producto.rating),
            reviews: Number(producto.reviews),
            envioGratis: Boolean(producto.envioGratis),
            destacado: Boolean(producto.destacado)
        }));

        res.json(productosFormateados);
    } catch (error) {
        console.error('Error en getProductos:', error);
        res.status(500).json({ error: "Ocurrió un error al obtener los productos" });
    }
};

const getProductoById = async (req, res) => {
    try {
        const { id } = req.params;
        const [productos] = await db.execute(`
            SELECT 
                p.id_producto as id,
                p.nombre, 
                p.descripcion, 
                p.precio, 
                p.stock,
                p.imagen,
                c.nombre as categoria,
                p.material,
                p.caracteristicas,
                p.rating,
                p.reviews,
                p.envio_gratis as envioGratis,
                p.destacado
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id_categoria
            WHERE p.id_producto = ?
        `, [id]);

        if (productos.length === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        const producto = productos[0];
        // Formatear el producto individual
        const productoFormateado = {
            ...producto,
            caracteristicas: producto.caracteristicas ? JSON.parse(producto.caracteristicas) : [],
            precio: Number(producto.precio),
            stock: Number(producto.stock),
            rating: Number(producto.rating),
            reviews: Number(producto.reviews),
            envioGratis: Boolean(producto.envioGratis),
            destacado: Boolean(producto.destacado)
        };

        res.json(productoFormateado);
    } catch (error) {
        console.error('Error en getProductoById:', error);
        res.status(500).json({ error: "Ocurrió un error al obtener el producto" });
    }
};

const buscarProductos = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({ error: "Parámetro de búsqueda requerido" });
        }

        const [productos] = await db.execute(`
            SELECT 
                p.id_producto as id,
                p.nombre, 
                p.descripcion, 
                p.precio, 
                p.stock,
                p.imagen,
                c.nombre as categoria,
                p.caracteristicas,
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id_categoria
            WHERE p.nombre LIKE ? OR p.descripcion LIKE ? 
        `, [`%${q}%`, `%${q}%`]);
        const productosFormateados = productos.map(producto => ({
            ...producto,
            caracteristicas: producto.caracteristicas ? JSON.parse(producto.caracteristicas) : [],
            precio: Number(producto.precio),
            stock: Number(producto.stock),
            rating: Number(producto.rating),
            reviews: Number(producto.reviews),
            envioGratis: Boolean(producto.envioGratis),
            destacado: Boolean(producto.destacado)
        }));

        res.json(productosFormateados);
    } catch (error) {
        console.error('Error en buscarProductos:', error);
        res.status(500).json({ error: "Ocurrió un error en la búsqueda" });
    }
};

module.exports = {
    getProductos,
    getProductoById,
    buscarProductos
};