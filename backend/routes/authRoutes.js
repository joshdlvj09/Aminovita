const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Rutas de Registro y Login
router.post('/register', authController.registrarUsuario);
router.post('/send-code', authController.enviarCodigoRegistro);
router.post('/login', authController.iniciarSesion);

// Rutas de Recuperación de Contraseña
router.post('/olvide-password', authController.olvidePassword);
router.post('/nuevo-password', authController.guardarNuevoPassword); // 👈 ESTA ES LA NUEVA RUTA NECESARIA

// Rutas Privadas (Perfil y Favoritos)
router.get('/perfil', auth, authController.obtenerPerfil);
router.post('/favoritos', auth, authController.toggleFavorito);
router.get('/favoritos', auth, authController.obtenerFavoritos);

module.exports = router;