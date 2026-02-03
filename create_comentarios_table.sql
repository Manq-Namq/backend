-- Crear tabla de comentarios
CREATE TABLE IF NOT EXISTS comentarios (
  id_comentario INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_producto INT NOT NULL,
  comentario TEXT NOT NULL,
  puntuacion INT NOT NULL CHECK (puntuacion >= 1 AND puntuacion <= 5),
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_comentarios_usuario ON comentarios(id_usuario);
CREATE INDEX idx_comentarios_producto ON comentarios(id_producto);
CREATE INDEX idx_comentarios_fecha ON comentarios(fecha);