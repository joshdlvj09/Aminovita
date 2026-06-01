const mongoose = require('mongoose');
require('dotenv').config(); // Para leer el .env

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Base de Datos Conectada Exitosamente 🌿');
    } catch (error) {
        console.error('Error conectando a la base de datos:', error);
        process.exit(1); // Detiene la app si no hay base de datos
    }
};

module.exports = connectDB;