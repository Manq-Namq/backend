const express = require("express");
const router = express.Router();
const conexion = require("../conexion");

// Obtener todos los envíos
router.get("/", (req, res) => {
  const sql = "SELECT * FROM envios";

  conexion.query(sql, (err, results) => {
    if (err) {
      console.error("Error obteniendo envíos:", err);
      return res.status(500).json({ error: "Error al obtener envíos" });
    }
    res.json(results);
  });
});

// Crear un nuevo envío
router.post("/", (req, res) => {
  const { id_usuario, direccion, ciudad, codigo_postal, estado } = req.body;

  const sql = `
    INSERT INTO envios (id_usuario, direccion, ciudad, codigo_postal, estado)
    VALUES (?, ?, ?, ?, ?)
  `;

  conexion.query(
    sql,
    [id_usuario, direccion, ciudad, codigo_postal, estado],
    (err, result) => {
      if (err) {
        console.error("Error creando envío:", err);
        return res.status(500).json({ error: "Error al crear envío" });
      }
      res.json({ message: "Envío creado", id_envio: result.insertId });
    }
  );
});

// Actualizar un envío
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { direccion, ciudad, codigo_postal, estado } = req.body;

  const sql = `
    UPDATE envios 
    SET direccion = ?, ciudad = ?, codigo_postal = ?, estado = ?
    WHERE id_envio = ?
  `;

  conexion.query(
    sql,
    [direccion, ciudad, codigo_postal, estado, id],
    (err, result) => {
      if (err) {
        console.error("Error actualizando envío:", err);
        return res.status(500).json({ error: "Error al actualizar envío" });
      }
      res.json({ message: "Envío actualizado" });
    }
  );
});

// Eliminar un envío
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM envios WHERE id_envio = ?";

  conexion.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error eliminando envío:", err);
      return res.status(500).json({ error: "Error al eliminar envío" });
    }
    res.json({ message: "Envío eliminado" });
  });
});

module.exports = router;
