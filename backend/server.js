const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// --- 1. MIDDLEWARES (Configuraciones) ---
app.use(cors()); 

// Aumentamos el límite a 50mb para que quepan las imágenes en texto (Base64)
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- 2. CONEXIÓN A BASE DE DATOS (Directa) ---
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aminovita')
    .then(() => console.log("✅ Base de Datos Conectada Exitosamente"))
    .catch(err => console.error("❌ Error al conectar BD:", err));

// --- 3. RUTAS ---

// A. Autenticación (Login, Registro, Perfil)
app.use('/api/auth', require('./routes/authRoutes'));

// B. Productos (Catálogo y Administración)
app.use('/api/productos', require('./routes/productoRoutes')); 

// C. Contacto 👇 ¡ACTIVADO Y DESCOMENTADO AQUÍ! 👇
app.use('/api/contacto', require('./routes/contacto'));

// D. Proveedores (Administración Privada)
app.use('/api/proveedores', require('./routes/proveedores'));


// --- 4. ARRANCAR SERVIDOR ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});