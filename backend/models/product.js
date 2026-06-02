// =======================================================
// MODELO DE PRODUCTO (MATERIAS PRIMAS)
// Archivo: backend/models/product.js
// =======================================================

const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    titulo: { 
        type: String, 
        required: true 
    },
    descripcion: { 
        type: String, 
        required: true 
    },
    // 👇 MODIFICADO: Ahora es un Arreglo [ ] para permitir múltiples categorías por producto 👇
    categoria: { 
        type: [String], 
        required: true, 
        enum: ['Farmacéutica', 'Alimentos', 'Cosmética', 'Veterinario', 'Agroquímico', 'General'],
        default: ['General']
    },
    // La imagen ya no es requerida (mantenida por compatibilidad si quedan hilos en Base64)
    imagen: { 
        type: String 
    }, 
    notas: { 
        type: String 
    },
    fecha: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Product', ProductSchema);