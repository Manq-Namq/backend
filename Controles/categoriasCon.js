const db = require('../Configuracion/database');

const getCategorias = async (req, res) => {
    try {
        const [categorias] = await db.execute('SELECT id_categoria, nombre FROM categorias');
        res.json(categorias);
    } catch (error) {
        console.error('Error en getCategorias:', error);
        res.status(500).send("Ocurrió un error");
    }
};

module.exports = {
    getCategorias
};