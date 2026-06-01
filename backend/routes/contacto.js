const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Ruta: POST /api/contacto
router.post('/', async (req, res) => {
    // 👇 1. AQUI AGREGAMOS 'telefono'
    const { nombre, email, telefono, empresa, mensaje } = req.body;

    // 2. Validar datos (No validamos teléfono porque es opcional)
    if (!nombre || !email || !mensaje) {
        return res.status(400).json({ msg: "Por favor completa todos los campos obligatorios." });
    }

    // 3. Configurar el Transportador
    const transporter = nodemailer.createTransport({
        service: 'gmail', 
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS  
        }
    });

    // 4. Diseño del Correo (HTML)
    const mailOptions = {
        from: `"Formulario Aminovita" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER, 
        subject: `📢 Nuevo Mensaje de: ${nombre}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #0b2639; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0;">Nuevo Cliente Interesado</h2>
                </div>
                <div style="padding: 20px; background-color: #f9f9f9;">
                    <p style="font-size: 16px; color: #333;"><strong>Has recibido una nueva consulta desde tu sitio web:</strong></p>
                    
                    <div style="background-color: white; padding: 15px; border-radius: 5px; border-left: 4px solid #0b2639; margin-bottom: 20px;">
                        <p style="margin: 5px 0;"><strong>👤 Nombre:</strong> ${nombre}</p>
                        <p style="margin: 5px 0;"><strong>✉️ Email:</strong> ${email}</p>
                        <p style="margin: 5px 0;"><strong>📞 Teléfono:</strong> ${telefono || 'No proporcionado'}</p>
                        <p style="margin: 5px 0;"><strong>🏢 Empresa:</strong> ${empresa || 'Particular'}</p>
                    </div>

                    <h3 style="color: #0b2639;">Mensaje:</h3>
                    <p style="background-color: white; padding: 15px; border-radius: 5px; color: #555; line-height: 1.6;">
                        ${mensaje}
                    </p>
                </div>
                <div style="background-color: #eee; padding: 10px; text-align: center; font-size: 12px; color: #777;">
                    Este correo fue enviado desde el formulario de contacto de Aminovita.
                </div>
            </div>
        `
    };

    // 5. Enviar el correo
    try {
        await transporter.sendMail(mailOptions);
        console.log("✅ Correo enviado con éxito a:", process.env.EMAIL_USER);
        res.json({ msg: "Mensaje enviado correctamente" });
    } catch (error) {
        console.error("❌ Error al enviar correo:", error);
        res.status(500).json({ msg: "Error al enviar el correo. Intenta más tarde." });
    }
});

module.exports = router;