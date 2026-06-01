/* =====================================================
   AMINOVITA - Lógica de Mis Favoritos
   Página: favoritos.html
   ===================================================== */

// Configuración del Toast (notificación flotante)
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
});


/* ── CARGA INICIAL ────────────────────────────────── */

document.addEventListener('DOMContentLoaded', async () => {

    // Verificar que el usuario esté autenticado
    const token = localStorage.getItem('token');
    if (!token) {
        Swal.fire({
            icon: 'warning',
            title: 'Acceso Restringido',
            text: 'Debes iniciar sesión para ver tus favoritos',
            confirmButtonText: 'Ir al Login',
            allowOutsideClick: false,
            heightAuto: false
        }).then(() => {
            window.location.href = './login.html';
        });
        return;
    }

    await cargarFavoritos();
});


/* ── CARGAR FAVORITOS ─────────────────────────────── */

async function cargarFavoritos() {
    const contenedor   = document.getElementById('contenedor-favoritos');
    const estadoVacio  = document.getElementById('estado-vacio');

    try {
        const res = await fetch('http://localhost:4000/api/auth/favoritos', {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });

        if (!res.ok) throw new Error('Error al cargar');

        const productos = await res.json();
        contenedor.innerHTML = ''; // Limpiar spinner

        if (productos.length === 0) {
            estadoVacio.classList.remove('d-none');
            return;
        }

        productos.forEach(prod => {
            if (!prod) return;

            contenedor.innerHTML += `
                <div class="col-12 col-md-4 mb-4" id="card-${prod._id}">
                    <div class="card h-100 shadow-sm border-0 position-relative">

                        <button onclick="quitarFavorito('${prod._id}')"
                            class="btn btn-light rounded-circle shadow-sm position-absolute top-0 end-0 m-2"
                            title="Quitar de favoritos"
                            style="z-index:10; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
                            <i class="bi bi-heart-fill text-danger fs-5"></i>
                        </button>

                        <img src="${prod.imagen}" class="card-img-top" alt="${prod.titulo}"
                            style="height: 200px; object-fit: cover;">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title fw-bold">${prod.titulo}</h5>
                            <p class="card-text text-truncate text-muted">${prod.descripcion}</p>
                            <button onclick="verDetallesCliente('${prod._id}')"
                                class="btn btn-outline-primary btn-sm mt-auto">
                                Ver Detalles
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = '<div class="col-12 text-center text-danger"><p>Error al cargar tus favoritos.</p></div>';
    }
}


/* ── VER DETALLES (MODAL) ─────────────────────────── */

async function verDetallesCliente(idProducto) {
    try {
        const res = await fetch(`http://localhost:4000/api/productos/${idProducto}`, {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });

        if (!res.ok) throw new Error('No se pudo cargar el producto');

        const prod = await res.json();

        document.getElementById('clienteModalImg').src         = prod.imagen;
        document.getElementById('clienteModalTitulo').innerText = prod.titulo;
        document.getElementById('clienteModalDesc').innerText   = prod.descripcion;

        const modal = new bootstrap.Modal(document.getElementById('modalDetallesCliente'));
        modal.show();

    } catch (error) {
        console.error(error);
        Toast.fire({ icon: 'error', title: 'No se pudieron cargar los detalles' });
    }
}


/* ── QUITAR FAVORITO ──────────────────────────────── */

async function quitarFavorito(idProducto) {
    // 1. Efecto visual inmediato (la card se encoge)
    const card = document.getElementById(`card-${idProducto}`);
    if (card) {
        card.classList.add('fade-out');
        setTimeout(() => card.remove(), 500);
    }

    Toast.fire({ icon: 'info', title: 'Eliminado de favoritos' });

    // 2. Petición al backend
    try {
        await fetch('http://localhost:4000/api/auth/favoritos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ productoId: idProducto })
        });

        // 3. Mostrar estado vacío si no quedan favoritos
        const contenedor = document.getElementById('contenedor-favoritos');
        setTimeout(() => {
            if (contenedor.children.length === 0) {
                document.getElementById('estado-vacio').classList.remove('d-none');
            }
        }, 550);

    } catch (error) {
        console.error('Error al eliminar favorito:', error);
    }
}
