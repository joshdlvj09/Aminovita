const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    descripcion: { type: String, required: true },
    // 👇 NUEVO CAMPO DE CATEGORÍA 👇
    categoria: { 
        type: String, 
        required: true, 
        enum: ['Farmacéutica', 'Alimentos', 'Cosmética', 'General'],
        default: 'General'
    },
    // La imagen ya no es requerida (o puedes borrar esta línea por completo)
    imagen: { type: String }, 
    notas: { type: String },
    fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);