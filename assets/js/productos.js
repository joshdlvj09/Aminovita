/* =====================================================
   AMINOVITA - Lógica Avanzada del Catálogo
   Página: productos.html
   Archivo: ../assets/js/productos.js
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
        
        // 👇 Muestra el botón de exportación a Excel solo si es Administrador 👇
        const btnExportar = document.getElementById('btnAdminExportar');
        if(btnExportar) btnExportar.classList.remove('d-none');
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

    // 🚀 OPTIMIZACIÓN: Variable intermedia para acumular el HTML en memoria
    let htmlAcumulado = '';

    productos.forEach(prod => {
        const esFavorito = misFavoritos.includes(prod._id);
        const iconoHeart = esFavorito ? 'bi-heart-fill text-danger' : 'bi-heart';

        // Procesamos categorías como array
        const categoriesArray = Array.isArray(prod.categoria) ? prod.categoria : (prod.categoria ? [prod.categoria] : []);
        
        let claseCat = 'cat-general';
        let iconCat = 'bi-box-seam';

        // --- LÓGICA DINÁMICA DE CATEGORÍA ---
        if (categoriesArray.length > 1 && categoriaActual === '') {
            claseCat = 'cat-varios';
            iconCat = 'bi-layers-half'; 
        } else {
            const catEval = (categoriaActual !== '') ? categoriaActual.toLowerCase() : categoriesArray.join(' ').toLowerCase();
            
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

        const textoCategorias = categoriesArray.join(' | ');

        // 👇 CORREGIDO: Inyección con justificación flex-space-between y blindaje anti-desbordamiento nativo 👇
        htmlAcumulado += `
        <div class="col-12 col-md-6 col-xl-4">
            <div class="item-producto ${claseCat} p-3 d-flex align-items-center justify-content-between position-relative" style="min-height: 100px;">
                ${estaLogueado ? `
                <button onclick="toggleLike('${prod._id}', this)" class="btn btn-link p-0 position-absolute top-0 end-0 m-2 border-0 text-decoration-none shadow-none" style="z-index: 5;">
                    <i class="${iconoHeart} fs-6"></i>
                </button>` : ''}

                <div class="d-flex align-items-center gap-3 min-w-0 flex-grow-1" style="padding-right: 10px;">
                    <div class="icono-cat flex-shrink-0">
                        <i class="${iconCat}"></i>
                    </div>
                    
                    <div class="min-w-0 flex-grow-1">
                        <h6 class="fw-bold mb-1 text-truncate" style="color: #0b2639; font-size: 0.85rem; letter-spacing: 0.5px;" title="${prod.titulo}">${prod.titulo}</h6>
                        <small class="text-muted d-block text-truncate" style="font-size: 0.72rem;" title="${textoCategorias}">${textoCategorias}</small>
                    </div>
                </div>
                
                <div class="flex-shrink-0 ms-2">
                    ${esAdmin ? `
                        <a href="./detalles.html?id=${prod._id}" class="btn btn-light btn-sm text-dark border shadow-sm d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;"><i class="bi bi-gear-fill"></i></a>
                    ` : `
                        <button onclick="verDetallesCliente('${prod._id}', '${textoCategorias}', \`${prod.titulo}\`, \`${prod.descripcion}\`)" class="btn btn-light btn-sm text-primary fw-bold border shadow-sm">Ver</button>
                    `}
                </div>
            </div>
        </div>
        `;
    });

    // 🚀 UNA SOLA INYECCIÓN: Pintamos todo el catálogo de un solo golpe
    contenedor.innerHTML = htmlAcumulado;
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

    formProducto.replaceWith(formProducto.cloneNode(true));
    
    const formFiltrado = document.getElementById('formProducto');
    formFiltrado.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!formFiltrado.checkValidity()) {
            e.stopPropagation();
            formFiltrado.classList.add('was-validated'); 
            return; 
        }

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

// --- 📊 EXPORTACIÓN DEL CATÁLOGO COMPLETO DE PRODUCTOS A EXCEL (XLSX) ---
async function exportarProductosExcel() {
    // 1. Bloqueo estricto de seguridad en el Frontend
    const rol = localStorage.getItem('usuarioRol');
    if (rol !== 'admin') {
        Swal.fire({
            icon: 'error',
            title: 'Acceso Denegado',
            text: 'No tienes los permisos administrativos requeridos para descargar el inventario químico de la empresa.',
            confirmButtonText: 'Entendido',
            heightAuto: false
        });
        return;
    }

    Swal.fire({
        title: 'Generando Reporte...',
        text: 'Consultando base de datos masiva de compuestos.',
        didOpen: () => Swal.showLoading(),
        heightAuto: false
    });

    try {
        const res = await fetch('http://localhost:4000/api/productos?limit=1000', {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        
        if (!res.ok) throw new Error('Error al conectar con el servidor');
        const data = await res.json();
        
        const productosAExportar = data.productos || data;

        if (!productosAExportar || productosAExportar.length === 0) {
            Swal.close();
            Swal.fire({
                icon: 'warning',
                title: 'Operación Cancelada',
                text: 'No se encontraron registros químicos en el catálogo para exportar.',
                heightAuto: false
            });
            return;
        }

        // 2. Mapeo simétrico de las columnas deseadas para la hoja de Excel
        const datosEstructurados = productosAExportar.map((prod, index) => {
            const industriasTexto = Array.isArray(prod.categoria) 
                ? prod.categoria.join(', ') 
                : (prod.categoria || 'General');

            return {
                'N°': index + 1,
                'Compuesto Químico / Materia Prima': prod.titulo,
                'Industrias Asociadas (Categorías)': industriasTexto,
                'Descripción Técnica / Notas de Suministro': prod.descripcion || 'Sin descripción disponible',
                'ID Interno MongoDB': prod._id
            };
        });

        // 3. Compilación binaria con la librería SheetJS
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(datosEstructurados);

        const anchosColumnas = Object.keys(datosEstructurados[0]).map(key => ({
            wch: Math.max(key.length + 2, ...datosEstructurados.map(row => (row[key] ? row[key].toString().length + 2 : 10)))
        }));
        ws['!cols'] = anchosColumnas;

        XLSX.utils.book_append_sheet(wb, ws, "Catálogo Productos");
        XLSX.writeFile(wb, "Catálogo_Productos_Aminovita.xlsx");

        Swal.close();
        Swal.fire({
            icon: 'success',
            title: 'Reporte Descargado',
            text: 'El catálogo de materias primas se exportó con éxito (.xlsx).',
            timer: 1500,
            showConfirmButton: false,
            heightAuto: false
        });

    } catch (error) {
        console.error("Error al exportar a Excel:", error);
        Swal.close();
        Swal.fire({
            icon: 'error',
            title: 'Error de Exportación',
            text: 'Ocurrió un fallo en la comunicación o al compilar el binario de SheetJS.',
            heightAuto: false
        });
    }
}