const express = require('express');
const router = express.Router();
// 👇 AQUÍ ESTÁ LA CLAVE: Debe importar 'productoController'
const productoController = require('../controllers/productoController');
const auth = require('../middleware/auth');

// api/productos
router.get('/', productoController.obtenerProductos);
router.get('/:id', productoController.obtenerProductoPorId); // Para detalles
router.post('/', auth, productoController.crearProducto);
router.put('/:id', auth, productoController.actualizarProducto);   // Para editar
router.delete('/:id', auth, productoController.eliminarProducto);  // Para borrar

module.exports = router;