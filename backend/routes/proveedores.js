// =======================================================
// RUTAS PARA EL CONTROL DE PROVEEDORES
// Archivo: backend/routes/proveedores.js
// =======================================================

const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');
const auth = require('../middleware/auth'); // Middleware que valida el JWT (x-auth-token)

// ── RUTA GENERAL: /api/proveedores ───────────────────────

// POST: api/proveedores -> Crear un nuevo proveedor privado
router.post('/', auth, proveedorController.crearProveedor);

// GET: api/proveedores -> Obtener la lista completa de proveedores
router.get('/', auth, proveedorController.obtenerProveedores);


// ── RUTAS ESPECÍFICAS: /api/proveedores/:id ──────────────

// GET: api/proveedores/:id -> 👇 NUEVO: Obtener los detalles de un único proveedor para precargar el modal 👇
router.get('/:id', auth, proveedorController.obtenerProveedorPorId);

// PUT: api/proveedores/:id -> 👇 NUEVO: Actualizar la información completa de un proveedor existente 👇
router.put('/:id', auth, proveedorController.actualizarProveedor);

// DELETE: api/proveedores/:id -> Eliminar un proveedor de la base de datos
router.delete('/:id', auth, proveedorController.eliminarProveedor);


module.exports = router;