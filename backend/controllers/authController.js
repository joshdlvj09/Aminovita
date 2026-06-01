// =======================================================
// CONTROLADOR DE AUTENTICACIÓN Y USUARIOS
// Archivo: backend/controllers/authController.js
// =======================================================

const User = require('../models/user');
const Verification = require('../models/Verification');
const Product = require('../models/product'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// =======================================================
// 1. ENVIAR CÓDIGO DE VERIFICACIÓN (REGISTRO)
// =======================================================
exports.enviarCodigoRegistro = async (req, res) => {
    const { email } = req.body;

    try {
        // Verificar si ya existe
        let usuario = await User.findOne({ email });
        if (usuario) {
            return res.status(400).json({ msg: "Este correo ya está registrado. Intenta iniciar sesión." });
        }

        // Generar código de 6 dígitos
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();

        // Guardar en colección temporal (borrando anteriores si existen)
        await Verification.findOneAndDelete({ email });
        
        const nuevaVerificacion = new Verification({ email, code: codigo });
        await nuevaVerificacion.save();

        // Enviar Correo
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        await transporter.sendMail({
            from: `"Seguridad Aminovita" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🔐 Tu Código de Verificación',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #0b2639;">Verifica tu cuenta</h2>
                    <p>Usa el siguiente código para completar tu registro:</p>
                    <div style="background: #eaf6f6; padding: 15px; text-align: center; border-radius: 10px; margin: 20px 0;">
                        <h1 style="color: #2a8a58; letter-spacing: 8px; margin: 0;">${codigo}</h1>
                    </div>
                    <p style="font-size: 12px; color: #777;">Expira en 10 minutos.</p>
                </div>
            `
        });

        res.json({ msg: "Código enviado a tu correo." });

    } catch (error) {
        console.error("Error envío código:", error);
        res.status(500).json({ msg: "Hubo un error al enviar el código." });
    }
};

// =======================================================
// 2. REGISTRAR USUARIO (FINAL)
// =======================================================
exports.registrarUsuario = async (req, res) => {
    try {
        const { nombre, email, password, empresa, code } = req.body;

        if (!email || !password || !code) {
            return res.status(400).json({ msg: "Faltan datos obligatorios." });
        }

        // Validar Código
        const verificacion = await Verification.findOne({ email, code });
        if (!verificacion) {
            return res.status(400).json({ msg: "El código es incorrecto o ha expirado." });
        }

        // Validar Duplicado
        let usuario = await User.findOne({ email });
        if (usuario) {
            return res.status(400).json({ msg: "El usuario ya existe" });
        }

        // Crear Usuario
        usuario = new User({ nombre, email, password, empresa });

        // Encriptar Password
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(password, salt);

        await usuario.save();
        
        // Borrar código usado
        await Verification.findOneAndDelete({ email });

        // Crear Token (Login automático)
        const payload = { usuario: { id: usuario.id } };

        jwt.sign(payload, process.env.JWT_SECRET || 'secreto', { expiresIn: '1h' }, (error, token) => {
            if (error) throw error;
            res.status(201).json({ 
                token, 
                msg: "Usuario registrado correctamente",
                usuario: {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    email: usuario.email,
                    rol: usuario.role || 'user'
                }
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Hubo un error en el servidor" });
    }
};

// =======================================================
// 3. INICIAR SESIÓN
// =======================================================
exports.iniciarSesion = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) return res.status(400).json({ msg: "Faltan datos" });

        let usuario = await User.findOne({ email });
        if (!usuario) return res.status(400).json({ msg: "El usuario no existe" });

        const passCorrecto = await bcrypt.compare(password, usuario.password);
        if (!passCorrecto) return res.status(400).json({ msg: "Contraseña incorrecta" });

        const payload = { usuario: { id: usuario.id } };

        jwt.sign(payload, process.env.JWT_SECRET || 'secreto', { expiresIn: '1h' }, (error, token) => {
            if (error) throw error;
            res.json({ 
                token, 
                msg: "Inicio de sesión exitoso", 
                usuario: { 
                    id: usuario.id, 
                    nombre: usuario.nombre,
                    email: usuario.email, 
                    role: usuario.role || 'user' 
                } 
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
};

// =======================================================
// 4. OLVIDÉ CONTRASEÑA (GENERAR LINK)
// =======================================================
exports.olvidePassword = async (req, res) => {
    const { email } = req.body;

    try {
        const usuario = await User.findOne({ email });
        if (!usuario) return res.status(404).json({ msg: "Correo no registrado" });

        // Secreto único (si cambia la pass, el token muere)
        const secret = (process.env.JWT_SECRET || 'secreto') + usuario.password;
        const token = jwt.sign({ id: usuario._id, email: usuario.email }, secret, { expiresIn: '10m' });

        // 👇 IMPORTANTE: Asegúrate de que este puerto (5500) es donde corre tu FRONTEND (Live Server)
        const link = `http://127.0.0.1:4000/reset.html?id=${usuario._id}&token=${token}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        await transporter.sendMail({
            from: `"Soporte Aminovita" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Recuperar Contraseña',
            html: `
                <h3>Restablecer Contraseña</h3>
                <p>Haz clic en el enlace para crear una nueva clave:</p>
                <a href="${link}" style="background:#2a8a58; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Restablecer Password</a>
                <p>Expira en 10 minutos.</p>
            `
        });

        res.json({ msg: "Correo enviado. Revisa tu bandeja de entrada." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
};

// =======================================================
// 5. GUARDAR NUEVA CONTRASEÑA
// =======================================================
exports.guardarNuevoPassword = async (req, res) => {
    const { id, token, password } = req.body;

    try {
        const usuario = await User.findById(id);
        if (!usuario) return res.status(404).json({ msg: "Usuario no existe" });

        const secret = (process.env.JWT_SECRET || 'secreto') + usuario.password;
        
        try {
            jwt.verify(token, secret);
        } catch (error) {
            return res.status(400).json({ msg: "Enlace inválido o expirado" });
        }

        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(password, salt);

        await usuario.save();
        res.json({ msg: "¡Contraseña actualizada!" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al actualizar" });
    }
};

// =======================================================
// 6. TOGGLE FAVORITOS (AGREGAR / REMOVER)
// =======================================================
exports.toggleFavorito = async (req, res) => {
    const { productoId } = req.body;
    const usuarioId = req.usuario.id; 

    try {
        const user = await User.findById(usuarioId);
        const estaEnFavoritos = user.favoritos.some(id => id.toString() === productoId);

        if (estaEnFavoritos) {
            await User.findByIdAndUpdate(usuarioId, { $pull: { favoritos: productoId } });
            res.json({ msg: 'Eliminado', estado: false });
        } else {
            await User.findByIdAndUpdate(usuarioId, { $addToSet: { favoritos: productoId } });
            res.json({ msg: 'Agregado', estado: true });
        }
    } catch (error) {
        res.status(500).json({ msg: 'Error favoritos' });
    }
};

// =======================================================
// 7. OBTENER FAVORITOS (CORREGIDO PARA EVITAR ERROR 500)
// =======================================================
exports.obtenerFavoritos = async (req, res) => {
    try {
        // Buscamos al usuario usando el ID inyectado por el token JWT
        const user = await User.findById(req.usuario.id);
        
        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        // 🛠️ CORRECCIÓN: Vinculamos explícitamente la referencia al modelo cargado 'Product'
        await user.populate({
            path: 'favoritos',
            model: Product
        });

        // Aseguramos responder con una lista limpia si no hay datos guardados aún
        const misFavoritos = user.favoritos || [];
        res.json(misFavoritos); 

    } catch (error) {
        console.error("Error crítico en obtenerFavoritos:", error);
        res.status(500).json({ 
            msg: 'Error interno en el servidor al procesar el catálogo de favoritos.' 
        });
    }
};

// =======================================================
// 8. OBTENER INFORMACIÓN DEL PERFIL
// =======================================================
exports.obtenerPerfil = async (req, res) => {
    try {
        const user = await User.findById(req.usuario.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).send('Error servidor');
    }
};