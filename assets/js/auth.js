document.addEventListener('DOMContentLoaded', () => {
    // 1. Validar sesión en TODAS las páginas al cargar
    validarEstadoSesion();

    // 2. Lógica del Login (Solo se activa si estamos en login.html)
    configurarFormularioLogin();
});

// --------------------------------------------------------------------------------
// A. FUNCIÓN PRINCIPAL: VALIDAR ESTADO DE LA SESIÓN
// --------------------------------------------------------------------------------
function validarEstadoSesion() {
    const token = localStorage.getItem('token');
    const usuarioNombre = localStorage.getItem('usuarioNombre'); // O usuarioEmail
    const usuarioRol = localStorage.getItem('usuarioRol');

    // Referencias al DOM
    const divNoLogin = document.getElementById('botones-no-login');
    const divSiLogin = document.getElementById('botones-si-login');
    const spanNombre = document.getElementById('usuario-nombre');
    const btnAdmin = document.getElementById('btnAdminAgregar');
    
    // 👇 NUEVA REFERENCIA: El botón del dropdown de proveedores 👇
    const menuProveedores = document.getElementById('menuAdminProveedores');

    // --- ESCENARIO 1: USUARIO LOGUEADO (HAY TOKEN) ---
    if (token) {
        // 1. Mostrar menú de usuario
        if (divNoLogin) divNoLogin.classList.add('d-none');
        if (divSiLogin) {
            divSiLogin.classList.remove('d-none');
            divSiLogin.classList.add('d-flex');
        }

        // 2. Poner el nombre
        if (spanNombre && usuarioNombre) {
            spanNombre.textContent = usuarioNombre;
        }

        // 3. Mostrar herramientas de Admin si corresponde ('admin')
        if (usuarioRol === 'admin') {
            if (btnAdmin) btnAdmin.classList.remove('d-none');
            // 👇 Si es admin, mostramos el acceso a proveedores en el dropdown 👇
            if (menuProveedores) menuProveedores.classList.remove('d-none');
        } else {
            if (btnAdmin) btnAdmin.classList.add('d-none');
            // 👇 Si está logueado pero NO es admin, lo ocultamos por seguridad 👇
            if (menuProveedores) menuProveedores.classList.add('d-none');
        }
    } 
    // --- ESCENARIO 2: USUARIO NO LOGUEADO ---
    else {
        if (divSiLogin) {
            divSiLogin.classList.add('d-none');
            divSiLogin.classList.remove('d-flex');
        }
        if (divNoLogin) divNoLogin.classList.remove('d-none');
        if (btnAdmin) btnAdmin.classList.add('d-none');
        
        // 👇 Si no hay sesión iniciada, ocultamos el acceso a proveedores 👇
        if (menuProveedores) menuProveedores.classList.add('d-none');
    }
}

// --------------------------------------------------------------------------------
// B. LÓGICA DEL FORMULARIO DE LOGIN
// --------------------------------------------------------------------------------
function configurarFormularioLogin() {
    // Usamos el ID específico 'loginForm' para no confundirlo con el de contacto
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            // Nota: Si ya usaste la validación inline en el HTML del login, 
            // este preventDefault es redundante pero seguro.
            e.preventDefault(); 

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Validación básica
            if (!email || !password) return;

            // Mostrar spinner en el botón (Opcional, si no lo hiciste en el HTML)
            const btn = loginForm.querySelector('button[type="submit"]');
            const textoOriginal = btn.innerHTML;
            btn.innerHTML = 'Verificando...';
            btn.disabled = true;

            try {
                const respuesta = await fetch('http://localhost:4000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const datos = await respuesta.json();

                if (respuesta.ok) {
                    // ✅ GUARDAR DATOS CRUCIALES
                    localStorage.setItem('token', datos.token);
                    localStorage.setItem('usuarioNombre', datos.usuario.nombre || datos.usuario.email);
                    localStorage.setItem('usuarioRol', datos.usuario.role); // 'admin' o 'user'

                    await Swal.fire({
                        icon: 'success',
                        title: `¡Hola, ${datos.usuario.nombre}!`,
                        text: 'Inicio de sesión exitoso',
                        timer: 1500,
                        showConfirmButton: false,
                        heightAuto: false 
                    });
                    
                    window.location.href = './index.html'; 
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: datos.msg || 'Credenciales incorrectas',
                        heightAuto: false 
                    });
                }
            } catch (error) {
                console.error(error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error de conexión',
                    heightAuto: false 
                });
            } finally {
                btn.innerHTML = textoOriginal;
                btn.disabled = false;
            }
        });
    }
}

// --------------------------------------------------------------------------------
// C. FUNCIONES GLOBALES (Cerrar Sesión, Recuperar Pass)
// --------------------------------------------------------------------------------

window.cerrarSesion = function() {
    Swal.fire({
        title: '¿Cerrar sesión?',
        text: "Tendrás que ingresar tus datos nuevamente.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar',
        heightAuto: false 
    }).then((result) => {
        if (result.isConfirmed) {
            // Borrar TODO
            localStorage.clear();
            // Redirigir al login
            window.location.href = './login.html';
        }
    });
};

window.enviarRecuperacion = async function() {
    const emailInput = document.getElementById('emailRecuperarInput');
    if(!emailInput) return; 

    const email = emailInput.value;
    if (!email) {
        Swal.fire({ title: 'Atención', text: 'Escribe un correo.', icon: 'warning' });
        return;
    }

    Swal.fire({ title: 'Enviando...', didOpen: () => Swal.showLoading() });

    try {
        const respuesta = await fetch('http://localhost:4000/api/auth/olvide-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const datos = await respuesta.json();

        if (respuesta.ok) {
            Swal.fire({ title: '¡Enviado!', text: datos.msg, icon: 'success' });
            
            // Cerrar modal si existe bootstrap
            const modalEl = document.getElementById('modalRecuperar');
            if (typeof bootstrap !== 'undefined' && modalEl) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if(modal) modal.hide();
            }
        } else {
            Swal.fire({ title: 'Error', text: datos.msg, icon: 'error' });
        }
    } catch (error) {
        Swal.fire({ title: 'Error', text: 'Fallo de conexión', icon: 'error' });
    }
};