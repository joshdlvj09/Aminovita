// =======================================================
// MODELO DE PROVEEDOR (SISTEMA PRIVADO)
// Archivo: backend/models/Proveedor.js
// =======================================================

const mongoose = require('mongoose');

// 💡 Forzamos la carga previa del esquema de productos 
// para que Mongoose lo reconozca al hacer el .populate()
require('./product.js'); 

const ProveedorSchema = new mongoose.Schema({
    empresa: {
        type: String,
        required: true,
        trim: true
    },
    contacto: {
        type: String,
        required: true,
        trim: true
    },
    // 👇 CORREGIDO: Cambiado a required: false para permitir registros opcionales 👇
    email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true,
        default: ''
    },
    // 👇 CORREGIDO: Cambiado a required: false para permitir registros opcionales 👇
    telefono: {
        type: String,
        required: false,
        default: ''
    },
    direccion: {
        type: String,
        trim: true,
        default: ''
    },
    // Vinculación: Guardamos un arreglo de IDs que apunta a 'Product'
    productos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product' // 👈 Coincide exactamente con tu modelo de compuestos
    }],
    // CAMPOS ADICIONALES Y FISCALES (OPCIONALES)
    emailSecundario: {
        type: String,
        trim: true,
        lowercase: true,
        default: ''
    },
    telefonoSecundario: {
        type: String,
        trim: true,
        default: ''
    },
    rfc: {
        type: String,
        trim: true,
        uppercase: true, // Forzar almacenamiento en mayúsculas a nivel base de datos
        default: ''
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Proveedor', ProveedorSchema);