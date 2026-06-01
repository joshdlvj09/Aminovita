/* =====================================================
   AMINOVITA - Lógica del Perfil de Usuario
   Página: perfil.html
   ===================================================== */

document.addEventListener('DOMContentLoaded', async () => {

    // 1. Verificar que el usuario esté autenticado
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = './login.html';
        return;
    }

    // 2. Obtener datos del perfil desde el backend
    try {
        const res = await fetch('http://localhost:4000/api/auth/perfil', {
            headers: { 'x-auth-token': token }
        });

        if (!res.ok) throw new Error('No se pudo obtener el perfil');

        const user = await res.json();

        // Rellenar información
        document.getElementById('lblEmail').textContent       = user.email;
        document.getElementById('usuario-nombre-nav').textContent = user.email;

        const textoEmpresa = user.empresa || 'Cliente Particular';
        document.getElementById('lblEmpresa').textContent        = textoEmpresa;
        document.getElementById('lblEmpresaDetalle').textContent  = textoEmpresa;
        document.getElementById('lblRol').textContent            = user.role === 'admin' ? 'Administrador' : 'Cliente';
        document.getElementById('lblId').textContent             = user._id;

        // Cambiar color del badge para administradores
        if (user.role === 'admin') {
            const badge = document.getElementById('lblRol');
            badge.classList.remove('bg-primary');
            badge.classList.add('bg-danger');
        }

        // Mostrar contenido y ocultar spinner
        document.getElementById('loading').classList.add('d-none');
        document.getElementById('info-usuario').classList.remove('d-none');
        document.getElementById('info-usuario').classList.add('d-block');

    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No pudimos cargar tu información.',
            heightAuto: false
        }).then(() => {
            localStorage.clear();
            window.location.href = './login.html';
        });
    }
});
