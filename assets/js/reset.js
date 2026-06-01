/* =====================================================
   AMINOVITA - Lógica de Restablecimiento de Contraseña
   Página: reset.html
   ===================================================== */

// Leer ID y token enviados por correo en la URL
const urlParams = new URLSearchParams(window.location.search);
const id        = urlParams.get('id');
const token     = urlParams.get('token');

// Si el enlace es inválido, redirigir inmediatamente
if (!id || !token) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Enlace inválido. Vuelve a solicitar el correo.'
    }).then(() => window.location.href = './login.html');
}


/* ── FORMULARIO DE NUEVA CONTRASEÑA ──────────────── */

document.getElementById('formReset').addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = document.getElementById('password').value;
    const confirm  = document.getElementById('confirmPassword').value;

    if (password !== confirm) {
        return Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
    }

    try {
        const res  = await fetch('http://localhost:4000/api/auth/nuevo-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, token, password })
        });

        const data = await res.json();

        if (res.ok) {
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: 'Contraseña actualizada. Inicia sesión.'
            }).then(() => window.location.href = './login.html');
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: data.msg });
        }

    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'Error de conexión', 'error');
    }
});
