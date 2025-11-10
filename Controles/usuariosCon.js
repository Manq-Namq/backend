const db = require('../Configuracion/database');
const { verificarPass, generarToken, hashPass } = require('@damianegreco/hashpass');

const { TOKEN_SECRET } = process.env;

const getUsuarios = async (req, res) => {
    try {
        const [usuarios] = await db.execute('SELECT id_usuario, nombre, apellido, email, telefono, direccion, fecha_registro, id_rol FROM usuarios');
        res.json(usuarios);
    } catch (error) {
        console.error('Error en getUsuarios:', error);
        res.status(500).send("Ocurrió un error");
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (email === undefined || password === undefined) {
            return res.status(400).send("Email y password son requeridos");
        }

        // Ajustamos la consulta para que coincida con tus columnas
        const [users] = await db.execute(
            'SELECT id_usuario, nombre, apellido, email, password, id_rol FROM usuarios WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            console.error("Usuario no encontrado");
            return res.status(401).send("Usuario y/o contraseña incorrecto");
        }

        const usuario = users[0];

        if (verificarPass(password, usuario.password)) {
            // Generamos el token con los datos del usuario, incluyendo el id_rol
            const token = generarToken(
                TOKEN_SECRET, 
                4, 
                { 
                    id: usuario.id_usuario, 
                    nombre: usuario.nombre,
                    apellido: usuario.apellido,
                    email: usuario.email,
                    rol: usuario.id_rol // Aquí usamos id_rol
                }
            );

            res.status(200).json({
                token,
                rol: usuario.id_rol, 
                nombre: usuario.nombre,
                apellido: usuario.apellido
            });
        } else {
            console.error("Contraseña incorrecta");
            res.status(401).send("Usuario y/o contraseña incorrecto");
        }
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).send("Ocurrió un error");
    }
};

// Agregamos una función de registro para crear usuarios
const register = async (req, res) => {
    try {
        const { nombre, apellido, email, password, telefono, direccion, id_rol } = req.body;

        if (nombre === undefined || email === undefined || password === undefined) {
            return res.status(400).send("Nombre, email y password son requeridos");
        }

        // Verificar si el usuario ya existe
        const [existingUsers] = await db.execute(
            'SELECT id_usuario FROM usuarios WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).send("El usuario ya existe");
        }

        const passHash = hashPass(password);

        // Insertar el nuevo usuario, ajustando a las columnas de tu tabla
        const [result] = await db.execute(
            'INSERT INTO usuarios (nombre, apellido, email, password, telefono, direccion, fecha_registro, id_rol) VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?)',
            [nombre, apellido, email, passHash, telefono, direccion, id_rol || 2] // Si no se proporciona id_rol, por defecto 2 (usuario común)
        );

        res.json({ 
            mensaje: 'Usuario registrado', 
            id_usuario: result.insertId 
        });
    } catch (error) {
        console.error('Error en register:', error);
        res.status(500).send("Ocurrió un error");
    }
};

module.exports = {
    getUsuarios,
    login,
    register
};