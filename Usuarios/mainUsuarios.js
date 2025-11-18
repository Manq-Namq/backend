const express = require('express');
const router = express.Router();
const db = require('../conexion');

// GET - Obtener todos los usuarios
router.get('/', function (req, res, next) {
    const sql = "SELECT * FROM usuarios";
    db.query(sql)
        .then(([usuarios]) => {
            // Se ejecutó correctamente
            res.status(200).json(usuarios);
        })
        .catch((error) => {
            // Ocurrió un error
            console.error(error);
            res.status(500).send("Ocurrió un error");
        });
});

// POST - Login de usuario
router.post('/login', function (req, res, next) {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).send("Email y password son requeridos");
    }

    const sql = "SELECT id_usuario, nombre, apellido, email, id_rol FROM usuarios WHERE email = ? AND password = ?";
    db.query(sql, [email, password])
        .then(([users]) => {
            if (users.length > 0) {
                res.json({
                    status: 'ok',
                    usuario: users[0],
                    token: 'token_generado' // En producción usa JWT
                });
            } else {
                res.status(401).json({ error: 'Credenciales incorrectas' });
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Ocurrió un error");
        });
});

// POST - Registrar usuario
router.post('/register', function (req, res, next) {
    const { nombre, apellido, email, password, telefono, direccion } = req.body;
    
    if (!nombre || !email || !password) {
        return res.status(400).send("Nombre, email y password son requeridos");
    }

    // Primero verificar si el usuario ya existe
    const checkSql = "SELECT id_usuario FROM usuarios WHERE email = ?";
    db.query(checkSql, [email])
        .then(([existingUsers]) => {
            if (existingUsers.length > 0) {
                throw new Error('El usuario ya existe');
            }
            
            // Insertar nuevo usuario
            const insertSql = "INSERT INTO usuarios (nombre, apellido, email, password, telefono, direccion, fecha_registro, id_rol) VALUES (?, ?, ?, ?, ?, ?, CURDATE(), 2)";
            return db.query(insertSql, [nombre, apellido, email, password, telefono, direccion]);
        })
        .then(([result]) => {
            res.json({
                status: 'ok',
                id: result.insertId,
                mensaje: 'Usuario registrado exitosamente'
            });
        })
        .catch((error) => {
            console.error(error);
            if (error.message === 'El usuario ya existe') {
                res.status(400).send(error.message);
            } else {
                res.status(500).send("Ocurrió un error");
            }
        });
});

// PUT - Actualizar usuario
router.put('/:id', function (req, res, next) {
    const { id } = req.params;
    const { nombre, email, telefono, direccion } = req.body;
    
    const sql = "UPDATE usuarios SET nombre = ?, email = ?, telefono = ?, direccion = ? WHERE id_usuario = ?";
    db.query(sql, [nombre, email, telefono, direccion, id])
        .then(([result]) => {
            res.json({
                status: 'ok',
                mensaje: 'Usuario actualizado'
            });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Ocurrió un error");
        });
});

module.exports = router;