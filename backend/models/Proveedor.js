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
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    telefono: {
        type: String,
        required: true
    },
    direccion: {
        type: String,
        trim: true
    },
    // Vinculación: Guardamos un arreglo de IDs que apunta a 'Product'
    productos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product' // 👈 CAMBIADO A 'Product' para coincidir exactamente con tu modelo
    }],
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Proveedor', ProveedorSchema);