/* =====================================================
   AMINOVITA - Lógica de Registro de Usuario
   Página: registro.html
   ===================================================== */


/* ── ENVIAR CÓDIGO DE VERIFICACIÓN ───────────────── */

async function enviarCodigo() {
    const emailInput = document.getElementById('email');
    const email      = emailInput.value;

    if (!email || !email.includes('@')) {
        emailInput.parentElement.parentElement.style.borderColor = '#ff6b6b';
        Swal.fire({
            icon: 'warning',
            title: 'Correo inválido',
            text: 'Por favor escribe un correo válido primero.',
            confirmButtonColor: '#6CDBE3'
        });
        return;
    }

    const btn           = document.getElementById('btnEnviarCodigo');
    const originalText  = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled  = true;

    try {
        const res  = await fetch('http://localhost:4000/api/auth/send-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await res.json();

        if (res.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Código Enviado',
                text: `Hemos enviado un código a ${email}. Cópialo y pégalo.`,
                confirmButtonColor: '#8A8AF6'
            });

            // Mostrar campo de código
            document.getElementById('campoCodigo').classList.remove('d-none');
            document.getElementById('codigo').required = true;
            emailInput.readOnly = true;

            // Actualizar botón para indicar que ya fue enviado
            btn.innerHTML          = 'Enviado ✓';
            btn.style.borderColor  = '#2ecc71';
            btn.style.color        = '#2ecc71';

        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.msg,
                confirmButtonColor: '#8A8AF6'
            });
            btn.disabled  = false;
            btn.innerHTML = originalText;
        }

    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo conectar con el servidor',
            confirmButtonColor: '#8A8AF6'
        });
        btn.disabled  = false;
        btn.innerHTML = originalText;
    }
}


/* ── FORMULARIO DE REGISTRO ───────────────────────── */

document.getElementById('registroForm').addEventListener('submit', async function (e) {

    if (!this.checkValidity()) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add('was-validated');
        return;
    }

    e.preventDefault();
    this.classList.add('was-validated');

    const nombre   = document.getElementById('nombre').value;
    const empresa  = document.getElementById('empresa').value;
    const email    = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const code     = document.getElementById('codigo').value;

    if (!code) {
        return Swal.fire({
            icon: 'warning',
            title: 'Falta el código',
            text: 'Debes enviar y escribir el código de verificación.',
            confirmButtonColor: '#6CDBE3'
        });
    }

    const btn          = this.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Creando cuenta...';
    btn.disabled  = true;

    try {
        const res  = await fetch('http://localhost:4000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, empresa, email, password, code })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('token',        data.token);
            localStorage.setItem('usuarioNombre', data.usuario.nombre || email);
            localStorage.setItem('usuarioRol',    data.usuario.rol);

            Swal.fire({
                icon: 'success',
                title: '¡Bienvenido!',
                text: 'Cuenta verificada y creada correctamente.',
                showConfirmButton: false,
                timer: 2000,
                confirmButtonColor: '#8A8AF6'
            }).then(() => {
                window.location.href = './index.html';
            });

        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.msg,
                confirmButtonColor: '#8A8AF6'
            });
            btn.innerHTML = originalText;
            btn.disabled  = false;
        }

    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Fallo de conexión',
            confirmButtonColor: '#8A8AF6'
        });
        btn.innerHTML = originalText;
        btn.disabled  = false;
    }
});
