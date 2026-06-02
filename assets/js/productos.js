/* =====================================================
   AMINOVITA - Lógica Avanzada del Catálogo
   Página: productos.html
   ===================================================== */

let paginaActual = 1;
let misFavoritos = []; 
let timeoutBusqueda = null; 
let terminoBusqueda = '';
let categoriaActual = ''; 

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
    inicializarFormularioProducto(); // Inicializa el submit de forma segura al cargar el DOM
});

async function cargarMisFavoritos() {
    try {
        const res = await fetch('http://localhost:4000/api/auth/favoritos', { 
            headers: { 'x-auth-token': localStorage.getItem('token') } 
        });
        if(res.ok) {
            const data = await res.json();
            misFavoritos = data.map(prod => prod._id);
        }
    } catch (error) {
        console.error("Error al obtener caché de favoritos:", error);
    }
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
    document.querySelectorAll('.btn-filtro').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    
    categoriaActual = categoria;
    paginaActual = 1;
    cargarProductos(paginaActual);
}

// --- CARGAR Y RENDERIZAR REFACTORIZADO A MULTI-ARREGLOS ---
async function cargarProductos(pagina) {
    try {
        const url = `http://localhost:4000/api/productos?page=${pagina}&search=${terminoBusqueda}&categoria=${categoriaActual}`;
        const res = await fetch(url);
        if(!res.ok) throw new Error("Error al conectar");
        const data = await res.json();
        
        renderizarProductos(data.productos);
        renderizarPaginacion(data.totalPaginas, data.paginaActual);
    } catch (error) {
        document.getElementById('contenedor-productos').innerHTML = '<div class="col-12 text-center text-danger"><p>Error de conexión al cargar catálogo.</p></div>';
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

        // Procesamos categorías como array
        const categoriasArray = Array.isArray(prod.categoria) ? prod.categoria : (prod.categoria ? [prod.categoria] : []);
        
        let claseCat = 'cat-general';
        let iconCat = 'bi-box-seam';

        // --- LÓGICA DINÁMICA DE CATEGORÍA ---
        // Si hay más de una categoría Y no estamos filtrando por una en específico, estilo "Varios"
        if (categoriasArray.length > 1 && categoriaActual === '') {
            claseCat = 'cat-varios';
            iconCat = 'bi-layers-half'; 
        } else {
            // Evaluamos la categoría activa o la primera del producto
            const catEval = (categoriaActual !== '') ? categoriaActual.toLowerCase() : categoriasArray.join(' ').toLowerCase();
            
            if (catEval.includes('farma')) { 
                claseCat = 'cat-farmaceutica'; iconCat = 'bi-capsule'; 
            } else if (catEval.includes('alim')) { 
                claseCat = 'cat-alimentos'; iconCat = 'bi-egg-fried'; 
            } else if (catEval.includes('cosm')) { 
                claseCat = 'cat-cosmetica'; iconCat = 'bi-stars'; 
            } else if (catEval.includes('veterin') || catEval.includes('vet') || catEval.includes('anim')) { 
                claseCat = 'cat-veterinario'; iconCat = 'bi-heart-pulse'; 
            } else if (catEval.includes('agro')) { 
                claseCat = 'cat-agroquimico'; iconCat = 'bi-tree'; 
            }
        }

        const textoCategorias = categoriasArray.join(' | ');

        const html = `
        <div class="col-12 col-md-6 col-xl-4">
            <div class="item-producto ${claseCat} p-3 d-flex align-items-center position-relative" style="min-height: 90px;">
                ${estaLogueado ? `
                <button onclick="toggleLike('${prod._id}', this)" class="btn btn-link p-0 position-absolute top-0 end-0 m-2 border-0 text-decoration-none shadow-none" style="z-index: 5;">
                    <i class="${iconoHeart} fs-6"></i>
                </button>` : ''}

                <div class="icono-cat me-3 flex-shrink-0">
                    <i class="${iconCat}"></i>
                </div>
                
                <div class="flex-grow-1 min-w-0" style="padding-right: 15px;">
                    <h6 class="fw-bold mb-1 text-truncate" style="color: #0b2639;" title="${prod.titulo}">${prod.titulo}</h6>
                    <small class="text-muted d-block text-wrap" style="font-size: 0.75rem; line-height: 1.2; max-height: 2.8em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;" title="${textoCategorias}">${textoCategorias}</small>
                </div>
                
                <div class="ms-2 flex-shrink-0">
                    ${esAdmin ? `
                        <a href="./detalles.html?id=${prod._id}" class="btn btn-light btn-sm text-dark border shadow-sm"><i class="bi bi-gear-fill"></i></a>
                    ` : `
                        <button onclick="verDetallesCliente('${prod._id}', '${textoCategorias}', \`${prod.titulo}\`, \`${prod.descripcion}\`)" class="btn btn-light btn-sm text-primary fw-bold border shadow-sm">Ver</button>
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

// --- FAVORITOS Y PAGINACIÓN ---
async function toggleLike(idProducto, btn) {
    const icono = btn.querySelector('i');
    const eraFavorito = icono.classList.contains('bi-heart-fill');
    
    if(eraFavorito) {
        icono.classList.remove('bi-heart-fill', 'text-danger');
        icono.classList.add('bi-heart');
        misFavoritos = misFavoritos.filter(id => id !== idProducto);
        Toast.fire({ icon: 'info', title: 'Eliminado de favoritos' });
    } else {
        icono.classList.remove('bi-heart');
        icono.classList.add('bi-heart-fill', 'text-danger', 'heart-bounce'); 
        setTimeout(() => icono.classList.remove('heart-bounce'), 300);
        misFavoritos.push(idProducto);
        Toast.fire({ icon: 'success', title: 'Guardado en favoritos' });
    }

    try {
        await fetch('http://localhost:4000/api/auth/favoritos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('token') },
            body: JSON.stringify({ productoId: idProducto })
        });
    } catch (error) {
        console.error("Error al procesar petición toggle de favoritos:", error);
    }
}

function renderizarPaginacion(total, actual) {
    const paginacion = document.getElementById('paginacion');
    paginacion.innerHTML = '';
    if(total <= 1) return; 
    
    paginacion.innerHTML += `<li class="page-item ${actual===1?'disabled':''}"><button class="page-link shadow-none text-dark" onclick="cambiarPagina(${actual-1})">&laquo;</button></li>`;
    for(let i=1; i<=total; i++) {
        paginacion.innerHTML += `<li class="page-item ${i===actual?'active':''}"><button class="page-link shadow-none ${i===actual?'bg-dark border-dark':''}" onclick="cambiarPagina(${i})">${i}</button></li>`;
    }
    paginacion.innerHTML += `<li class="page-item ${actual===total?'disabled':''}"><button class="page-link shadow-none text-dark" onclick="cambiarPagina(${actual+1})">&raquo;</button></li>`;
}
function cambiarPagina(n) { paginaActual = n; cargarProductos(n); }


// --- 🛠️ REGISTRO COMPLETO DE PRODUCTOS (REFACTORIZADO Y BLINDADO) ───
function inicializarFormularioProducto() {
    const formProducto = document.getElementById('formProducto');
    if (!formProducto) return;

    // Removemos cualquier listener previo duplicado para evitar doble peticion
    formProducto.replaceWith(formProducto.cloneNode(true));
    
    const formFiltrado = document.getElementById('formProducto');
    formFiltrado.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!formFiltrado.checkValidity()) {
            e.stopPropagation();
            formFiltrado.classList.add('was-validated'); 
            return; 
        }

        // Corrección del Scope: Buscamos los checkboxes específicamente encasillados en este formulario
        const categoriasMarcadas = Array.from(formFiltrado.querySelectorAll('.chk-categoria-prod:checked')).map(chk => chk.value);
        
        if (categoriasMarcadas.length === 0) {
            Swal.fire({ 
                icon: 'warning', 
                title: 'Atención', 
                text: 'Debes asociar la materia prima a por lo menos una industria.', 
                heightAuto: false 
            });
            return;
        }

        Swal.fire({ title: 'Guardando...', didOpen: () => Swal.showLoading(), heightAuto: false });

        try {
            const nuevoProducto = {
                titulo: document.getElementById('prodTitulo').value,
                categoria: categoriasMarcadas, 
                descripcion: document.getElementById('prodDesc').value
            };

            const res = await fetch('http://localhost:4000/api/productos', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'x-auth-token': localStorage.getItem('token') 
                },
                body: JSON.stringify(nuevoProducto)
            });

            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Guardado', timer: 1500, showConfirmButton: false })
                    .then(() => {
                        formFiltrado.reset();
                        location.reload();
                    });
            } else {
                const errData = await res.json();
                Swal.fire({ icon: 'error', title: 'Error', text: errData.msg || 'Error al guardar el compuesto químico.' });
            }
        } catch (error) {
            console.error(error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Error de conexión con el backend de Aminovita.' });
        }
    });
}