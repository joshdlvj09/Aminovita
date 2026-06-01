let paginaActual = 1;
let misFavoritos = []; 
let timeoutBusqueda = null; 
let terminoBusqueda = '';
let categoriaActual = ''; // 👈 NUEVA VARIABLE

const Toast = Swal.mixin({
    toast: true, position: 'top-end', showConfirmButton: false,
    timer: 2000, timerProgressBar: true
});

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (token) await cargarMisFavoritos();

    const rol = localStorage.getItem('usuarioRol');
    if (rol === 'admin') {
        const btnAdmin = document.getElementById('btnAdminAgregar');
        if(btnAdmin) btnAdmin.classList.remove('d-none');
    }
    cargarProductos(paginaActual);
});

async function cargarMisFavoritos() {
    try {
        const res = await fetch('http://localhost:4000/api/auth/favoritos', { headers: { 'x-auth-token': localStorage.getItem('token') } });
        if(res.ok) {
            const data = await res.json();
            misFavoritos = data.map(prod => prod._id);
        }
    } catch (error) {}
}

// --- BUSCADOR Y FILTROS ---
function buscarProductos() {
    const input = document.getElementById('inputBusqueda');
    document.getElementById('btnLimpiar').style.display = input.value.length > 0 ? 'block' : 'none';
    clearTimeout(timeoutBusqueda);
    timeoutBusqueda = setTimeout(() => {
        terminoBusqueda = input.value;
        paginaActual = 1; 
        cargarProductos(paginaActual);
    }, 400); 
}

function limpiarBusqueda() {
    document.getElementById('inputBusqueda').value = '';
    document.getElementById('btnLimpiar').style.display = 'none';
    terminoBusqueda = '';
    paginaActual = 1;
    cargarProductos(paginaActual);
}

function filtrarCategoria(categoria, btnElement) {
    // Cambiar estilos visuales de los botones
    document.querySelectorAll('.btn-filtro').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    
    // Asignar categoría y recargar
    categoriaActual = categoria;
    paginaActual = 1;
    cargarProductos(paginaActual);
}

// --- CARGAR Y RENDERIZAR (NUEVO DISEÑO SIN IMÁGENES) ---
async function cargarProductos(pagina) {
    try {
        // 👇 Mandamos la categoría en la URL
        const url = `http://localhost:4000/api/productos?page=${pagina}&search=${terminoBusqueda}&categoria=${categoriaActual}`;
        const res = await fetch(url);
        if(!res.ok) throw new Error("Error al conectar");
        const data = await res.json();
        
        renderizarProductos(data.productos);
        renderizarPaginacion(data.totalPaginas, data.paginaActual);
    } catch (error) {
        document.getElementById('contenedor-productos').innerHTML = '<div class="col-12 text-center text-danger"><p>Error de conexión.</p></div>';
    }
}

function renderizarProductos(productos) {
    const contenedor = document.getElementById('contenedor-productos');
    contenedor.innerHTML = ''; 

    if(productos.length === 0) {
        contenedor.innerHTML = `<div class="col-12 text-center py-5 text-muted"><i class="bi bi-box fs-1 opacity-25"></i><p class="mt-3">No hay productos en esta categoría.</p></div>`;
        return;
    }

    const estaLogueado = !!localStorage.getItem('token');
    const esAdmin = localStorage.getItem('usuarioRol') === 'admin'; 

    productos.forEach(prod => {
        const esFavorito = misFavoritos.includes(prod._id);
        const iconoHeart = esFavorito ? 'bi-heart-fill text-danger' : 'bi-heart';

        // Determinar diseño por categoría
        let claseCat = 'cat-general';
        let iconCat = 'bi-box';
        
        if(prod.categoria === 'Farmacéutica') { claseCat = 'cat-farmaceutica'; iconCat = 'bi-capsule'; }
        if(prod.categoria === 'Alimentos') { claseCat = 'cat-alimentos'; iconCat = 'bi-egg-fried'; }
        if(prod.categoria === 'Cosmética') { claseCat = 'cat-cosmetica'; iconCat = 'bi-stars'; }

        // 👇 NUEVO HTML: Tarjeta horizontal pequeña y limpia 👇
        const html = `
        <div class="col-12 col-md-6 col-xl-4">
            <div class="item-producto ${claseCat} p-3 d-flex align-items-center position-relative">
                
                ${estaLogueado ? `
                <button onclick="toggleLike('${prod._id}', this)" class="btn btn-link p-0 position-absolute top-0 end-0 m-2 border-0 text-decoration-none shadow-none">
                    <i class="${iconoHeart} fs-6"></i>
                </button>` : ''}

                <div class="icono-cat me-3 flex-shrink-0">
                    <i class="${iconCat}"></i>
                </div>
                
                <div class="flex-grow-1 min-w-0" style="padding-right: 25px;">
                    <h6 class="fw-bold mb-1 text-truncate" style="color: #0b2639;" title="${prod.titulo}">${prod.titulo}</h6>
                    <small class="text-muted d-block text-truncate">${prod.categoria || 'Uso General'}</small>
                </div>
                
                <div class="ms-2 flex-shrink-0">
                    ${esAdmin ? `
                        <a href="./detalles.html?id=${prod._id}" class="btn btn-light btn-sm text-dark border"><i class="bi bi-gear-fill"></i></a>
                    ` : `
                        <button onclick="verDetallesCliente('${prod._id}', '${prod.categoria || 'General'}', \`${prod.titulo}\`, \`${prod.descripcion}\`)" class="btn btn-light btn-sm text-primary fw-bold border">Ver</button>
                    `}
                </div>
            </div>
        </div>
        `;
        contenedor.innerHTML += html;
    });
}

// --- VER DETALLES ---
function verDetallesCliente(id, cat, titulo, desc) {
    document.getElementById('clienteModalCategoria').innerText = cat;
    document.getElementById('clienteModalTitulo').innerText = titulo;
    document.getElementById('clienteModalDesc').innerText = desc;
    new bootstrap.Modal(document.getElementById('modalDetallesCliente')).show();
}

// --- FAVORITOS Y PAGINACIÓN (Siguen igual) ---
async function toggleLike(idProducto, btn) {
    const icono = btn.querySelector('i');
    const eraFavorito = icono.classList.contains('bi-heart-fill');
    
    if(eraFavorito) {
        icono.classList.remove('bi-heart-fill', 'text-danger');
        icono.classList.add('bi-heart');
        misFavoritos = misFavoritos.filter(id => id !== idProducto);
        Toast.fire({ icon: 'info', title: 'Eliminado' });
    } else {
        icono.classList.remove('bi-heart');
        icono.classList.add('bi-heart-fill', 'text-danger', 'heart-bounce'); 
        setTimeout(() => icono.classList.remove('heart-bounce'), 300);
        misFavoritos.push(idProducto);
        Toast.fire({ icon: 'success', title: 'Guardado' });
    }

    try {
        await fetch('http://localhost:4000/api/auth/favoritos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('token') },
            body: JSON.stringify({ productoId: idProducto })
        });
    } catch (error) {}
}

function renderizarPaginacion(total, actual) {
    const paginacion = document.getElementById('paginacion');
    paginacion.innerHTML = '';
    if(total <= 1) return; // Ocultar si solo hay 1 página
    
    paginacion.innerHTML += `<li class="page-item ${actual===1?'disabled':''}"><button class="page-link shadow-none text-dark" onclick="cambiarPagina(${actual-1})">&laquo;</button></li>`;
    for(let i=1; i<=total; i++) {
        paginacion.innerHTML += `<li class="page-item ${i===actual?'active':''}"><button class="page-link shadow-none ${i===actual?'bg-dark border-dark':''}" onclick="cambiarPagina(${i})">${i}</button></li>`;
    }
    paginacion.innerHTML += `<li class="page-item ${actual===total?'disabled':''}"><button class="page-link shadow-none text-dark" onclick="cambiarPagina(${actual+1})">&raquo;</button></li>`;
}
function cambiarPagina(n) { paginaActual = n; cargarProductos(n); }

// --- CREAR NUEVO PRODUCTO (SIN IMÁGENES) ---
document.addEventListener('DOMContentLoaded', () => {
    const formProducto = document.getElementById('formProducto');
    
    if (formProducto) {
        formProducto.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!formProducto.checkValidity()) {
                e.stopPropagation();
                formProducto.classList.add('was-validated'); 
                return; 
            }

            Swal.fire({ title: 'Guardando...', didOpen: () => Swal.showLoading(), heightAuto: false });

            try {
                // Ya no leemos la imagen, leemos la categoría
                const nuevoProducto = {
                    titulo: document.getElementById('prodTitulo').value,
                    categoria: document.getElementById('prodCategoria').value,
                    descripcion: document.getElementById('prodDesc').value
                };

                const res = await fetch('http://localhost:4000/api/productos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('token') },
                    body: JSON.stringify(nuevoProducto)
                });

                if (res.ok) {
                    Swal.fire({ icon: 'success', title: 'Guardado', timer: 1500, showConfirmButton: false })
                        .then(() => location.reload());
                } else {
                    Swal.fire({ icon: 'error', title: 'Error al guardar' });
                }
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Error de conexión' });
            }
        });
    }
});