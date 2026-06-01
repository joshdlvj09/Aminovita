/* =====================================================
   AMINOVITA - Lógica de Inicio de Sesión
   Página: login.html
   ===================================================== */


/* ── FORMULARIO DE LOGIN ──────────────────────────── */

const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!loginForm.checkValidity()) {
            e.stopPropagation();
            loginForm.classList.add('was-validated');
            return;
        }
        loginForm.classList.add('was-validated');

        const email    = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Mostrar estado de carga en el botón
        const btn          = loginForm.querySelector('button[type="submit"]');
        const textoOriginal = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Verificando...';
        btn.disabled  = true;

        try {
            const respuesta = await fetch('http://localhost:4000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const datos = await respuesta.json();

            if (respuesta.ok) {
                // Guardar sesión en localStorage
                localStorage.setItem('token',        datos.token);
                localStorage.setItem('usuarioNombre', datos.usuario.nombre || datos.usuario.email);
                localStorage.setItem('usuarioRol',    datos.usuario.role || datos.usuario.rol);

                await Swal.fire({
                    icon: 'success',
                    title: `¡Hola, ${datos.usuario.nombre || datos.usuario.email}!`,
                    text: 'Inicio de sesión exitoso',
                    timer: 1500,
                    showConfirmButton: false,
                    confirmButtonColor: '#8A8AF6'
                });

                window.location.href = './index.html';
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: datos.msg || 'Credenciales incorrectas',
                    confirmButtonColor: '#8A8AF6'
                });
            }

        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo conectar con el servidor',
                confirmButtonColor: '#8A8AF6'
            });
        } finally {
            btn.innerHTML = textoOriginal;
            btn.disabled  = false;
        }
    });
}


/* ── RECUPERAR CONTRASEÑA ─────────────────────────── */

async function enviarRecuperacion() {
    const inputEmail = document.getElementById('emailRecuperarInput');
    const email      = inputEmail.value;

    if (!email) {
        Swal.fire({
            icon: 'warning',
            title: 'Atención',
            text: 'Por favor ingresa tu correo.',
            confirmButtonColor: '#6CDBE3'
        });
        return;
    }

    const btnEnviar    = document.querySelector('#modalRecuperar .btn-glow');
    const textoOriginal = btnEnviar.innerHTML;
    btnEnviar.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Enviando...';
    btnEnviar.disabled  = true;

    try {
        const res  = await fetch('http://localhost:4000/api/auth/olvide-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await res.json();

        if (res.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Correo Enviado',
                text: data.msg || 'Revisa tu bandeja de entrada.',
                confirmButtonColor: '#8A8AF6'
            });

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalRecuperar'));
            modal.hide();
            inputEmail.value = '';
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.msg || 'No pudimos enviar el correo.',
                confirmButtonColor: '#8A8AF6'
            });
        }

    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'Inténtalo más tarde.',
            confirmButtonColor: '#8A8AF6'
        });
    } finally {
        btnEnviar.innerHTML = textoOriginal;
        btnEnviar.disabled  = false;
    }
}
