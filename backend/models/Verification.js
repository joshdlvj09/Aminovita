const mongoose = require('mongoose');

const VerificationSchema = new mongoose.Schema({
    email: { type: String, required: true },
    code: { type: String, required: true },
    createdAt: { 
        type: Date, 
        default: Date.now, 
        expires: 600 // 🔥 El documento se borra solo después de 600 segundos (10 min)
    }
});

module.exports = mongoose.model('Verification', VerificationSchema);