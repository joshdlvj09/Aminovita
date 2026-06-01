/* =====================================================
   AMINOVITA - Lógica del Formulario de Contacto
   Página: contacto.html
   ===================================================== */

const formContacto = document.getElementById('formContacto');

if (formContacto) {
    formContacto.addEventListener('submit', async (e) => {

        // 1. Validación visual de Bootstrap
        if (!formContacto.checkValidity()) {
            e.preventDefault();
            e.stopPropagation();
            formContacto.classList.add('was-validated');
            return;
        }

        e.preventDefault();
        formContacto.classList.add('was-validated');

        // 2. Capturar valores del formulario
        const nombre   = document.getElementById('nombre').value;
        const email    = document.getElementById('emailContacto').value;
        const telefono = document.getElementById('telefono').value;
        const empresa  = document.getElementById('empresaInput').value;
        const mensaje  = document.getElementById('mensaje').value;

        // 3. Mostrar estado de carga en el botón
        const btnSubmit    = formContacto.querySelector('button');
        const textoOriginal = btnSubmit.innerHTML;
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';

        try {
            const respuesta = await fetch('http://localhost:4000/api/contacto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, email, telefono, empresa, mensaje })
            });

            const datos = await respuesta.json();

            if (respuesta.ok) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Mensaje Enviado!',
                    text: 'Gracias por contactarnos. Te responderemos a la brevedad.',
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#1a1a1a',
                    heightAuto: false
                });
                formContacto.reset();
                formContacto.classList.remove('was-validated');
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: datos.msg || 'Hubo un error al enviar el mensaje.',
                    heightAuto: false
                });
            }

        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Error de Conexión',
                text: 'No pudimos contactar con el servidor. Verifica tu conexión.',
                heightAuto: false
            });
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = textoOriginal;
        }
    });
}
