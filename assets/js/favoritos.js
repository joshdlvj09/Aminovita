/* =====================================================
   AMINOVITA - Lógica de Mis Favoritos (Materia Prima)
   Página: favoritos.html
   ===================================================== */

// Arreglos y estados globales para el filtrado reactivo en el cliente
let productosFavoritos = [];
let categoriaSeleccionada = ''; // Guarda el filtro de categoría actual

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


/* ── CARGAR FAVORITOS (PERSISTENCIA Y RENDERIZADO) ── */

async function cargarFavoritos() {
    const contenedor   = document.getElementById('contenedor-favoritos');

    try {
        const res = await fetch('http://localhost:4000/api/auth/favoritos', {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });

        if (!res.ok) throw new Error('Error al cargar');

        // Guardamos los productos en el arreglo global
        productosFavoritos = await res.json();
        
        // Renderizamos inicialmente aplicando lógica de combinación
        aplicarFiltrosCombinados();

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = '<div class="col-12 text-center text-danger py-4"><i class="bi bi-exclamation-triangle fs-3"></i><p class="mt-2">Error al cargar tus favoritos de Aminovita.</p></div>';
    }
}


/* ── NÚCLEO DE FILTRADO: COMBINA CATEGORÍA + BUSCADOR ── */

function aplicarFiltrosCombinados() {
    const contenedor = document.getElementById('contenedor-favoritos');
    const inputBusqueda = document.getElementById('inputBusqueda');
    const textoTermino = inputBusqueda ? inputBusqueda.value.toLowerCase().trim() : '';

    // 1. Filtrar en cascada sobre el arreglo original en memoria
    let productosFiltrados = productosFavoritos;

    // Filtro A: Por categoría seleccionada
    if (categoriaSeleccionada !== '') {
        productosFiltrados = productosFiltrados.filter(prod => {
            const categoriasTexto = Array.isArray(prod.categoria) 
                ? prod.categoria.join(' ').toLowerCase() 
                : (prod.categoria ? prod.categoria.toLowerCase() : '');
            return categoriasTexto.includes(categoriaSeleccionada.toLowerCase());
        });
    }

    // Filtro B: Por término de búsqueda (Título o categoría)
    if (textoTermino !== '') {
        productosFiltrados = productosFiltrados.filter(prod => {
            const titulo = prod.titulo ? prod.titulo.toLowerCase() : '';
            const categoriasTexto = Array.isArray(prod.categoria) 
                ? prod.categoria.join(' ').toLowerCase() 
                : (prod.categoria ? prod.categoria.toLowerCase() : '');
            return titulo.includes(textoTermino) || categoriasTexto.includes(textoTermino);
        });
    }

    // 2. Controlar visualmente los estados de la interfaz
    manejarEstadoVacio(productosFiltrados.length, textoTermino !== '');

    // 3. Renderizar las tarjetas resultantes
    renderizarTarjetas(productosFiltrados);
}


/* ── RENDERIZAR INTERFAZ TARJETAS ─────────────────── */

function renderizarTarjetas(productos) {
    const contenedor = document.getElementById('contenedor-favoritos');
    contenedor.innerHTML = ''; // Limpiar spinner o tarjetas anteriores

    productos.forEach(prod => {
        if (!prod) return;

        // Mapear clases visuales e iconos por categoría
        let claseCat = 'border-secondary';
        let icono = 'bi-box-seam';

        const categoriasTexto = Array.isArray(prod.categoria) 
            ? prod.categoria.join(' ').toLowerCase() 
            : (prod.categoria ? prod.categoria.toLowerCase() : '');

        if (categoriasTexto.includes('farma')) {
            claseCat = 'cat-farmaceutica';
            icono = 'bi-capsule';
        } else if (categoriasTexto.includes('alim')) {
            claseCat = 'cat-alimentos';
            icono = 'bi-egg-fried';
        } else if (categoriasTexto.includes('cosm')) {
            claseCat = 'cat-cosmetica';
            icono = 'bi-stars';
        } else if (categoriasTexto.includes('veterin')) { 
            claseCat = 'cat-veterinario';
            icono = 'bi-paw';
        } else if (categoriasTexto.includes('agro')) {      
            claseCat = 'cat-agroquimico';
            icono = 'bi-tree';
        }

        const textoCategorias = Array.isArray(prod.categoria) ? prod.categoria.join(' | ') : (prod.categoria || 'Uso General');

        contenedor.innerHTML += `
            <div class="col-12 col-md-6 col-lg-4 mb-3" id="card-${prod._id}">
                <div class="item-producto p-3 d-flex align-items-center justify-content-between position-relative h-100 ${claseCat}">
                    
                    <div class="d-flex align-items-center gap-3" style="cursor: pointer;" onclick="verDetallesCliente('${prod._id}')">
                        <div class="icono-cat">
                            <i class="bi ${icono}"></i>
                        </div>
                        <div>
                            <h5 class="fw-bold text-dark mb-1 fs-6 text-uppercase" style="letter-spacing: 0.5px;">${prod.titulo}</h5>
                            <span class="text-muted small">${textoCategorias}</span>
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
}


/* ── CONTROL DINÁMICO DE ESTADO VACÍO O SIN RESULTADOS ── */

function manejarEstadoVacio(cantidadProductos, tieneBusquedaActiva) {
    const estadoVacio      = document.getElementById('estado-vacio');
    const tituloVacio      = document.getElementById('texto-vacio-titulo');
    const descVacio        = document.getElementById('texto-vacio-desc');
    const btnVacioAccion   = document.getElementById('btn-vacio-accion');

    if (cantidadProductos === 0) {
        estadoVacio.classList.remove('d-none');
        
        if (tieneBusquedaActiva || categoriaSeleccionada !== '') {
            // El usuario buscó algo pero no hubo coincidencias
            tituloVacio.innerText = 'Sin compuestos encontrados';
            descVacio.innerText = 'Prueba ajustando los filtros o revisando la ortografía de la materia prima.';
            if (btnVacioAccion) btnVacioAccion.classList.add('d-none');
        } else {
            // La lista está vacía en su totalidad (no hay data en la BD)
            tituloVacio.innerText = 'Aún no tienes favoritos';
            descVacio.innerText = 'Explora nuestro catálogo y marca los productos que te interesen.';
            if (btnVacioAccion) btnVacioAccion.classList.remove('d-none');
        }
    } else {
        estadoVacio.classList.add('d-none');
    }
}


/* ── EJECUCIÓN DESDE EL HTML: FILTRO POR CATEGORÍA ── */

function filtrarCategoriaFavoritos(categoria, botonActivo) {
    const botones = document.querySelectorAll('.btn-filtro');
    botones.forEach(btn => btn.classList.remove('active'));
    botonActivo.classList.add('active');

    // Seteamos la categoría seleccionada globalmente y procesamos
    categoriaSeleccionada = categoria;
    aplicarFiltrosCombinados();
}


/* ── EJECUCIÓN DESDE EL HTML: INPUT BUSCADOR (KEYUP) ── */

function buscarFavoritos() {
    const inputBusqueda = document.getElementById('inputBusqueda');
    const btnLimpiar = document.getElementById('btnLimpiar');

    // Mostrar/ocultar botón 'X' de limpiar según el input
    if (inputBusqueda.value.length > 0) {
        if (btnLimpiar) btnLimpiar.style.display = 'block';
    } else {
        if (btnLimpiar) btnLimpiar.style.display = 'none';
    }

    aplicarFiltrosCombinados();
}


/* ── EJECUCIÓN DESDE EL HTML: BOTÓN LIMPIAR BUSQUEDA (X) ── */

function limpiarBusquedaFavoritos() {
    const inputBusqueda = document.getElementById('inputBusqueda');
    const btnLimpiar = document.getElementById('btnLimpiar');

    if (inputBusqueda) inputBusqueda.value = '';
    if (btnLimpiar) btnLimpiar.style.display = 'none';

    aplicarFiltrosCombinados();
}


/* ── VER DETALLES (MODAL ADAPTADO SIN IMAGEN) ─────── */

async function verDetallesCliente(idProducto) {
    try {
        const res = await fetch(`http://localhost:4000/api/productos/${idProducto}`, {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });

        if (!res.ok) throw new Error('No se pudo cargar el producto');

        const prod = await res.json();
        const categoriaModal = Array.isArray(prod.categoria) ? prod.categoria.join(' | ') : (prod.categoria || 'Uso General');

        document.getElementById('clienteModalCategoria').innerText = categoriaModal;
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
    // 1. Efecto visual inmediato
    const card = document.getElementById(`card-${idProducto}`);
    if (card) {
        card.style.transition = 'all 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        setTimeout(() => card.remove(), 300);
    }

    Toast.fire({ icon: 'info', title: 'Eliminado de favoritos' });

    // 2. Modificar el arreglo global en memoria
    productosFavoritos = productosFavoritos.filter(prod => prod._id !== idProducto);

    // Re-evaluar filtros vigentes tras remover el compuesto
    setTimeout(() => aplicarFiltrosCombinados(), 350);

    // 3. Petición al backend
    try {
        await fetch('http://localhost:4000/api/auth/favoritos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ productoId: idProducto })
        });
    } catch (error) {
        console.error('Error al eliminar favorito:', error);
    }
}