/* =====================================================
   AMINOVITA - Lógica de Mis Favoritos (Materia Prima)
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


/* ── CARGAR FAVORITOS (CON NUEVOS ICONOS Y BORDES) ── */

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

        estadoVacio.classList.add('d-none');

        productos.forEach(prod => {
            if (!prod) return;

            // 🛠️ MAPEAR CLASES VISUALES E ICONOS POR CATEGORÍA (IGUAL AL CATÁLOGO)
            let claseCat = 'border-secondary';
            let icono = 'bi-box-seam';
            const categoria = prod.categoria ? prod.categoria.toLowerCase() : '';

            if (categoria.includes('farma')) {
                claseCat = 'cat-farmaceutica';
                icono = 'bi-capsule';
            } else if (categoria.includes('alim')) {
                claseCat = 'cat-alimentos';
                icono = 'bi-egg-fried';
            } else if (categoria.includes('cosm')) {
                claseCat = 'cat-cosmetica';
                icono = 'bi-stars';
            }

            // Inyectamos las tarjetas interactivas alineadas a la grilla Bootstrap en fila d-flex
            contenedor.innerHTML += `
                <div class="col-12 col-md-6 col-lg-4 mb-3" id="card-${prod._id}">
                    <div class="item-producto p-3 d-flex align-items-center justify-content-between position-relative h-100 ${claseCat}">
                        
                        <div class="d-flex align-items-center gap-3 style="cursor: pointer;" onclick="verDetallesCliente('${prod._id}')">
                            <div class="icono-cat">
                                <i class="bi ${icono}"></i>
                            </div>
                            <div>
                                <h5 class="fw-bold text-dark mb-1 fs-6 text-uppercase" style="letter-spacing: 0.5px;">${prod.titulo}</h5>
                                <span class="text-muted small">${prod.categoria || 'Uso General'}</span>
                            </div>
                        </div>

                        <div class="d-flex align-items-center gap-1 pe-1">
                            <button onclick="quitarFavorito('${prod._id}')" 
                                    class="btn btn-sm btn-outline-light border-0 text-danger" 
                                    title="Quitar de favoritos"
                                    style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
                                <i class="bi bi-heart-fill fs-5"></i>
                            </button>
                        </div>

                    </div>
                </div>
            `;
        });

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = '<div class="col-12 text-center text-danger py-4"><i class="bi bi-exclamation-triangle fs-3"></i><p class="mt-2">Error al cargar tus favoritos de Aminovita.</p></div>';
    }
}


/* ── VER DETALLES (MODAL ADAPTADO SIN IMAGEN) ─────── */

async function verDetallesCliente(idProducto) {
    try {
        const res = await fetch(`http://localhost:4000/api/productos/${idProducto}`, {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });

        if (!res.ok) throw new Error('No se pudo cargar el producto');

        const prod = await res.json();

        // 🛠️ CORREGIDO: Inyectamos los textos directamente. Ya no se busca 'clienteModalImg'
        document.getElementById('clienteModalCategoria').innerText = prod.categoria || 'Uso General';
        document.getElementById('clienteModalTitulo').innerText    = prod.titulo;
        document.getElementById('clienteModalDesc').innerText      = prod.descripcion;

        const modal = new bootstrap.Modal(document.getElementById('modalDetallesCliente'));
        modal.show();

    } catch (error) {
        console.error(error);
        Toast.fire({ icon: 'error', title: 'No se pudieron cargar los detalles' });
    }
}


/* ── QUITAR FAVORITO ──────────────────────────────── */

async function quitarFavorito(idProducto) {
    // 1. Efecto visual inmediato (la card se remueve suavemente)
    const card = document.getElementById(`card-${idProducto}`);
    if (card) {
        card.style.transition = 'all 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        setTimeout(() => card.remove(), 300);
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

        // 3. Mostrar estado vacío si no quedan favoritos en la vista
        const contenedor = document.getElementById('contenedor-favoritos');
        setTimeout(() => {
            // Evaluamos si el contenedor quedó limpio de tarjetas
            if (!contenedor.querySelector('.item-producto')) {
                document.getElementById('estado-vacio').classList.remove('d-none');
            }
        }, 350);

    } catch (error) {
        console.error('Error al eliminar favorito:', error);
    }
}