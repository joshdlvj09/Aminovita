const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true, 
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    empresa: {
        type: String,
        required: false 
    },
    role: {
        type: String,
        default: 'user', 
        enum: ['user', 'admin'] 
    },
    
    // --- PASO 1: EL BOLSILLO DE FAVORITOS ---
    favoritos: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Producto' // Importante: Esto conecta con tu modelo de Productos
    }],
    // ----------------------------------------

    fechaRegistro: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);