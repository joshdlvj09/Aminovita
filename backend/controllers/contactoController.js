const nodemailer = require('nodemailer');

// 1. Cargamos las variables de entorno (por seguridad)
// Si ya tienes require('dotenv').config() en tu server.js, esta línea es opcional,
// pero dejarla aquí no hace daño y asegura que funcione si pruebas este archivo solo.
require('dotenv').config(); 

exports.enviarCorreo = async (req, res) => {
    // Recibimos los datos del formulario
    const { nombre, email, empresa, mensaje } = req.body;

    try {
        // 2. Configuración del Transporte
        // Aquí es donde leemos los datos "secretos" del archivo .env
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Al poner esto, Node sabe que debe usar smtp.gmail.com y el puerto 465 automáticamente
            auth: {
                user: process.env.EMAIL_USER, // Leemos joshdlvj09@gmail.com del .env
                pass: process.env.EMAIL_PASS  // Leemos la contraseña de aplicación del .env
            }
        });

        // 3. Configuración del Email
        const mailOptions = {
            from: `"Aminovita Web" <${process.env.EMAIL_USER}>`, 
            to: process.env.EMAIL_USER, // Se envía a ti mismo (al dueño)
            
            replyTo: email, // El truco: Al responder, le respondes al cliente
            
            subject: `Nuevo Mensaje de: ${nombre}`,
            html: `
                <h3>Tienes un nuevo prospecto</h3>
                <p><strong>Nombre:</strong> ${nombre}</p>
                <p><strong>Correo:</strong> ${email}</p>
                <p><strong>Empresa:</strong> ${empresa || 'No especificada'}</p>
                <hr>
                <p><strong>Mensaje:</strong></p>
                <p>${mensaje}</p>
            `
        };

        // 4. Enviar
        await transporter.sendMail(mailOptions);
        res.status(200).json({ msg: '¡Correo enviado con éxito!' });

    } catch (error) {
        console.error('Error enviando correo:', error);
        res.status(500).json({ msg: 'Error al enviar el correo' });
    }
};