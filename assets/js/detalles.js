/* =====================================================
   AMINOVITA - Lógica de Administración de Producto
   Página: detalles.html
   ===================================================== */

// ID del producto tomado de la URL (?id=...)
const params     = new URLSearchParams(window.location.search);
const productoId = params.get('id');


/* ── HELPERS ──────────────────────────────────────── */

/**
 * Alterna la visibilidad entre el input de URL y el de archivo
 * según la opción de radio seleccionada.
 */
function cambiarInputImagenEdit() {
    const esUrl      = document.getElementById('opcionUrlEdit').checked;
    const divUrl     = document.getElementById('divInputUrlEdit');
    const divArchivo = document.getElementById('divInputArchivoEdit');
    const inputUrl   = document.getElementById('editImgUrl');
    const inputFile  = document.getElementById('editImgFile');

    if (esUrl) {
        divUrl.classList.remove('d-none');
        divArchivo.classList.add('d-none');
        inputUrl.setAttribute('required', '');
        inputFile.removeAttribute('required');
    } else {
        divUrl.classList.add('d-none');
        divArchivo.classList.remove('d-none');
        inputUrl.removeAttribute('required');
        inputFile.removeAttribute('required'); // No requerido si se mantiene la imagen anterior
    }
}

/**
 * Convierte un archivo local a una cadena Base64.
 * @param {File} file
 * @returns {Promise<string>}
 */
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload  = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

/**
 * Actualiza la imagen de vista previa con la URL ingresada.
 * @param {string} url
 */
function actualizarVistaPrevia(url) {
    if (url) document.getElementById('imgPreview').src = url;
}


/* ── CARGA INICIAL ────────────────────────────────── */

document.addEventListener('DOMContentLoaded', async () => {

    // Verificar que el usuario sea administrador
    const rol = localStorage.getItem('usuarioRol');
    if (rol !== 'admin') {
        Swal.fire({
            icon: 'error',
            title: 'Acceso Denegado',
            text: 'Solo administradores.',
            confirmButtonText: 'Volver',
            allowOutsideClick: false
        }).then(() => window.location.href = './productos.html');
        return;
    }

    if (!productoId) {
        Swal.fire('Error', 'No se especificó ningún producto', 'error')
            .then(() => window.location.href = './productos.html');
        return;
    }

    await cargarDatosProducto();
});


/* ── CARGAR DATOS ─────────────────────────────────── */

async function cargarDatosProducto() {
    try {
        const res = await fetch(`http://localhost:4000/api/productos/${productoId}`, {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });

        if (!res.ok) throw new Error('Error al cargar');

        const prod = await res.json();

        // Rellenar formulario con datos actuales
        document.getElementById('titulo').value       = prod.titulo;
        document.getElementById('descripcion').value  = prod.descripcion;
        document.getElementById('editImgUrl').value   = prod.imagen;
        document.getElementById('imgPreview').src     = prod.imagen;
        document.getElementById('idProd').value       = prod._id;

        const fechaObj = new Date(prod.fecha);
        document.getElementById('fecha').value = fechaObj.toLocaleDateString();

    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo cargar la información del producto', 'error');
    }
}


/* ── GUARDAR CAMBIOS ──────────────────────────────── */

document.getElementById('formEditar').addEventListener('submit', async (e) => {
    e.preventDefault();

    Swal.fire({ title: 'Guardando...', didOpen: () => Swal.showLoading() });

    try {
        // Determinar imagen final a guardar
        let imagenFinal = '';
        const esUrl = document.getElementById('opcionUrlEdit').checked;

        if (esUrl) {
            imagenFinal = document.getElementById('editImgUrl').value;
        } else {
            const fileInput = document.getElementById('editImgFile');
            if (fileInput.files.length > 0) {
                imagenFinal = await toBase64(fileInput.files[0]);
            } else {
                // Mantener la imagen actual si no se seleccionó una nueva
                imagenFinal = document.getElementById('editImgUrl').value;
            }
        }

        const datosActualizados = {
            titulo:      document.getElementById('titulo').value,
            descripcion: document.getElementById('descripcion').value,
            imagen:      imagenFinal
        };

        const res = await fetch(`http://localhost:4000/api/productos/${productoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token':  localStorage.getItem('token')
            },
            body: JSON.stringify(datosActualizados)
        });

        if (res.ok) {
            Swal.fire({
                icon: 'success',
                title: '¡Actualizado!',
                text: 'Cambios guardados con éxito',
                timer: 1500,
                showConfirmButton: false
            });
            cargarDatosProducto();
        } else {
            Swal.fire('Error', 'No se pudo actualizar', 'error');
        }

    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'Fallo de conexión o imagen muy pesada', 'error');
    }
});


/* ── ELIMINAR PRODUCTO ────────────────────────────── */

async function eliminarProducto() {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'El producto se borrará permanentemente.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            const res = await fetch(`http://localhost:4000/api/productos/${productoId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });

            if (res.ok) {
                await Swal.fire('Eliminado', 'Producto borrado.', 'success');
                window.location.href = './productos.html';
            } else {
                Swal.fire('Error', 'No se pudo eliminar', 'error');
            }

        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Fallo de conexión', 'error');
        }
    }
}