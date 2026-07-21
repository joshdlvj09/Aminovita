// =======================================================
// CONTROL DE PROVEEDORES (PRIVADO - MODO ADMIN)
// Archivo: ../assets/js/proveedores.js
// =======================================================

let idProveedorEdicion = null; // Almacena el ID si estamos editando
let listaProductosGlobal = [];  // Caché local para filtrar los productos en el modal
let listaProveedoresGlobal = []; // Caché local para el buscador principal de la página
let categoriaModalActual = '';  // Almacena la categoría activa dentro del modal

// Almacena temporalmente los nombres de compuestos desabastecidos para el modal interactivo
let productosDesabastecidosNombres = []; 

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Bloqueo estricto de seguridad en el Frontend
    const rol = localStorage.getItem('usuarioRol');
    if (rol !== 'admin') {
        Swal.fire({
            icon: 'error',
            title: 'Acceso Restringido',
            text: 'Esta sección contiene notas y registros de proveedores privados.',
            confirmButtonText: 'Volver',
            allowOutsideClick: false
        }).then(() => window.location.href = './productos.html');
        return;
    }

    // 2. Ejecutar cargas reales al verificar rol válido
    await cargarProductosEnCheckboxes();
    await cargarProveedores();

    // Resetear el formulario cuando se cierre o abra el modal para evitar residuos de edición
    const modalElement = document.getElementById('modalProveedor');
    if (modalElement) {
        modalElement.addEventListener('hidden.bs.modal', () => {
            document.getElementById('formProveedor').reset();
            document.getElementById('formProveedor').classList.remove('was-validated');
            document.getElementById('modalTitulo').textContent = 'Registrar Nuevo Proveedor';
            idProveedorEdicion = null;
            
            // Resetea visualmente los botones de filtro dentro del modal al cerrar
            categoriaModalActual = '';
            document.querySelectorAll('.btn-filtro-modal').forEach(btn => btn.classList.remove('active'));
            const btnTodos = document.querySelector('.btn-filtro-modal[onclick*="\'\'"]');
            if (btnTodos) btnTodos.classList.add('active');

            // Desmarcar todos los checkboxes
            document.querySelectorAll('.chk-producto').forEach(chk => chk.checked = false);
            const inputBuscar = document.getElementById('buscarProductoModal');
            if (inputBuscar) { inputBuscar.value = ''; }
            
            // Resetear los campos opcionales del DOM
            document.getElementById('provEmailSecundario').value = '';
            document.getElementById('provTelefonoSecundario').value = '';
            document.getElementById('provRfc').value = '';
            
            // Ocultar wrappers y resetear botones al cerrar
            document.getElementById('wrapperEmailSecundario').classList.add('d-none');
            document.getElementById('wrapperTelefonoSecundario').classList.add('d-none');
            
            const btnEmail = document.getElementById('btnAgregarEmailSec');
            if(btnEmail) {
                btnEmail.classList.replace('btn-secondary', 'btn-outline-secondary');
                btnEmail.innerHTML = `<i class="bi bi-envelope-plus me-1"></i> ¿Agregar otro correo?`;
            }
            const btnTel = document.getElementById('btnAgregarTelSec');
            if(btnTel) {
                btnTel.classList.replace('btn-secondary', 'btn-outline-secondary');
                btnTel.innerHTML = `<i class="bi bi-telephone-plus me-1"></i> ¿Agregar otro celular?`;
            }
            
            // 👇 SOLUCIÓN DE SCROLL: Forzar la reactivación del desplazamiento nativo al cerrar modales 👇
            forzarScrollBody();

            // Renderizar la lista limpia completa
            renderizarCheckboxesModal(listaProductosGlobal);
        });
    }
});

// --- 👇 FUNCIÓN AUXILIAR: Garantiza scroll libre destruyendo bloqueos residuales del DOM 👇 ---
function forzarScrollBody() {
    setTimeout(() => {
        document.body.style.overflow = 'auto';
        document.body.style.paddingRight = '0px';
        document.body.classList.remove('modal-open');
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(b => b.remove());
    }, 350);
}

// --- CONTROLADORES DE INTERFAZ PARA CAMPOS COMPACTOS OPCIONALES ---
function toggleCampoOpcional(wrapperId, btnElement, textoOriginal) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;

    if (wrapper.classList.contains('d-none')) {
        wrapper.classList.remove('d-none');
        btnElement.classList.replace('btn-outline-secondary', 'btn-secondary');
        btnElement.innerHTML = `<i class="bi bi-check-lg me-1"></i> Campo Activo`;
    } else {
        wrapper.classList.add('d-none');
        btnElement.classList.replace('btn-secondary', 'btn-outline-secondary');
        const icono = wrapperId.includes('Email') ? 'bi-envelope-plus' : 'bi-telephone-plus';
        btnElement.innerHTML = `<i class="bi ${icono} me-1"></i> ${textoOriginal}`;
    }
}

// --- REMOVER CAMPOS ---
function removerCampoOpcional(wrapperId, inputId, btnId, textoOriginal) {
    const input = document.getElementById(inputId);
    const wrapper = document.getElementById(wrapperId);
    const btn = document.getElementById(btnId);

    if (input) input.value = ''; 
    if (wrapper) wrapper.classList.add('d-none'); 
    
    if (btn) {
        btn.classList.replace('btn-secondary', 'btn-outline-secondary');
        const icono = wrapperId.includes('Email') ? 'bi-envelope-plus' : 'bi-telephone-plus';
        btn.innerHTML = `<i class="bi ${icono} me-1"></i> ${textoOriginal}`;
    }
}

// --- FUNCIÓN DEL DASHBOARD OPTIMIZADA CON CLIC INTERACTIVO ---
function renderizarMetricasDashboard() {
    const contenedorProveedores = document.getElementById('contenedor-proveedores');
    if (!contenedorProveedores) return;

    let contenedorDashboard = document.getElementById('dashboard-metricas-admin');
    if (!contenedorDashboard) {
        contenedorDashboard = document.createElement('div');
        contenedorDashboard.id = 'dashboard-metricas-admin';
        contenedorDashboard.className = 'row g-3 mb-4';
        contenedorProveedores.parentNode.insertBefore(contenedorDashboard, contenedorProveedores);
    }

    const totalProductos = listaProductosGlobal.length;
    const totalProveedores = listaProveedoresGlobal.length;

    // Obtener IDs de todos los productos vinculados a algún proveedor
    const idsProductosConProveedor = new Set();
    listaProveedoresGlobal.forEach(prov => {
        if (prov.productos && prov.productos.length > 0) {
            prov.productos.forEach(p => {
                const idProd = typeof p === 'object' ? p._id : p;
                if (idProd) idsProductosConProveedor.add(idProd.toString());
            });
        }
    });

    productosDesabastecidosNombres = [];
    listaProductosGlobal.forEach(p => {
        if (p._id && !idsProductosConProveedor.has(p._id.toString())) {
            productosDesabastecidosNombres.push(p.titulo);
        }
    });

    const productosSinProveedor = productosDesabastecidosNombres.length;

    contenedorDashboard.innerHTML = `
        <div class="col-12 col-sm-6 col-lg-4">
            <div class="card border-0 shadow-sm border-start border-4 border-primary bg-white h-100 p-3">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <h6 class="text-uppercase text-muted fw-bold small mb-1" style="font-size: 0.7rem; letter-spacing: 0.5px;">Compuestos en Catálogo</h6>
                        <span class="h3 fw-bold text-dark mb-0">${totalProductos}</span>
                    </div>
                    <div class="bg-light rounded p-2 text-primary">
                        <i class="bi bi-box-seam fs-4"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-4">
            <div class="card border-0 shadow-sm border-start border-4 border-success bg-white h-100 p-3">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <h6 class="text-uppercase text-muted fw-bold small mb-1" style="font-size: 0.7rem; letter-spacing: 0.5px;">Proveedores Activos</h6>
                        <span class="h3 fw-bold text-dark mb-0">${totalProveedores}</span>
                    </div>
                    <div class="bg-light rounded p-2 text-success">
                        <i class="bi bi-people fs-4"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-12 col-md-12 col-lg-4">
            <div class="card border-0 shadow-sm border-start border-4 border-danger bg-white h-100 p-3 transition-all" 
                 onclick="mostrarDetalleDesabasto()" 
                 style="cursor: pointer; transition: transform 0.2s;"
                 onmouseenter="this.style.transform='translateY(-2px)'" 
                 onmouseleave="this.style.transform='translateY(0)'">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <h6 class="text-uppercase text-muted fw-bold small mb-1" style="font-size: 0.7rem; letter-spacing: 0.5px;">Sin Proveedor Vinculado <i class="bi bi-info-circle ms-1 small"></i></h6>
                        <span class="h3 fw-bold ${productosSinProveedor > 0 ? 'text-danger' : 'text-dark'} mb-0">${productosSinProveedor}</span>
                    </div>
                    <div class="bg-light rounded p-2 text-danger">
                        <i class="bi bi-exclamation-triangle fs-4"></i>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- DESPLEGAR VENTANA CON LA LISTA DE COMPUESTOS FALTANTES ---
function mostrarDetalleDesabasto() {
    if (productosDesabastecidosNombres.length === 0) {
        Swal.fire({
            icon: 'success',
            title: 'Cadena de Suministro Completa',
            text: '¡Excelente! Todas las materias primas del catálogo tienen al menos un proveedor asociado.',
            heightAuto: false
        }).then(() => forzarScrollBody());
        return;
    }

    const listaHtml = productosDesabastecidosNombres
        .map(nombre => `<div class="text-start p-2 mb-2 bg-light rounded border-start border-3 border-danger fw-bold text-dark small"><i class="bi bi-patch-exclamation text-danger me-2"></i>${nombre}</div>`)
        .join('');

    Swal.fire({
        title: '<span class="fw-bold" style="color:#0b2639;">Alertas de Suministro</span>',
        html: `
            <p class="text-muted small text-start mb-3">Las siguientes materias primas están registradas en el catálogo público pero no están vinculadas a ningún importador o fabricante:</p>
            <div class="overflow-y-auto px-1" style="max-height: 250px;">
                ${listaHtml}
            </div>
        `,
        confirmButtonText: '<i class="bi bi-send-check me-2"></i>Ir a Cotizar ',
        confirmButtonColor: '#0b2639',
        showCancelButton: true,
        cancelButtonText: 'Cerrar',
        heightAuto: false
    }).then((result) => {
        forzarScrollBody();
        if (result.isConfirmed) {
            window.location.href = './cotizador-masivo.html';
        }
    });
}

// --- 1. LLENAR CONTENEDOR CON CHECKBOXES ESTILIZADOS (CON LOGOS) ---
async function cargarProductosEnCheckboxes() {
    const contenedor = document.getElementById('contenedorCheckboxesProductos');
    if (!contenedor) return;

    try {
        const res = await fetch('http://localhost:4000/api/productos?limit=1000', {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        const data = await res.json();
        
        listaProductosGlobal = data.productos || data;
        
        renderizarCheckboxesModal(listaProductosGlobal);
        renderizarMetricasDashboard();
    } catch (error) {
        console.error("Error al cargar productos para el selector:", error);
        contenedor.innerHTML = `<span class="text-danger small"><i class="bi bi-exclamation-triangle"></i> Error al cargar catálogo</span>`;
    }
}

// --- 2. RENDERIZAR CHECKBOXES CON EL ESTILO DINÁMICO (SOPORTE MULTI-CATEGORÍA) ---
function renderizarCheckboxesModal(productos) {
    const contenedor = document.getElementById('contenedorCheckboxesProductos');
    if (!contenedor) return;

    const marcadosPreviamente = Array.from(document.querySelectorAll('.chk-producto:checked')).map(chk => chk.value);

    if (productos.length === 0) {
        contenedor.innerHTML = `<div class="text-muted small text-center py-4"><i class="bi bi-search opacity-50 fs-4 d-block mb-2"></i>No se encontraron compuestos en esta selección.</div>`;
        return;
    }

    contenedor.innerHTML = '';

    productos.forEach(p => {
        let claseCat = 'border-secondary';
        let icono = 'bi-box-seam';
        
        const textCatArray = Array.isArray(p.categoria) ? p.categoria : (p.categoria ? [p.categoria] : []);
        const categoriasTexto = textCatArray.join(' ').toLowerCase();

        if (textCatArray.length > 1 && categoriaModalActual === '') {
            claseCat = 'cat-varios';
            icono = 'bi-layers-half';
        } else {
            const catEval = (categoriaModalActual !== '') ? categoriaModalActual.toLowerCase() : categoriasTexto;

            if (catEval.includes('farma')) {
                claseCat = 'cat-farmaceutica'; icono = 'bi-capsule';
            } else if (catEval.includes('alim')) {
                claseCat = 'cat-alimentos'; icono = 'bi-egg-fried';
            } else if (catEval.includes('cosm')) {
                claseCat = 'cat-cosmetica'; icono = 'bi-stars';
            } else if (catEval.includes('veterin') || catEval.includes('vet') || catEval.includes('anim')) { 
                claseCat = 'cat-veterinario'; icono = 'bi-heart-pulse'; 
            } else if (catEval.includes('agro')) {      
                claseCat = 'cat-agroquimico'; icono = 'bi-tree';
            }
        }

        const textoCategorias = textCatArray.join(', ') || 'General';
        const estaMarcado = marcadosPreviamente.includes(p._id) ? 'checked' : '';

        contenedor.innerHTML += `
            <div class="item-producto-modal item-producto ${claseCat} d-flex align-items-center justify-content-between p-2 mb-2 bg-white rounded border-start border-4" style="border: 1px solid #e9ecef; border-left-width: 4px;" data-titulo="${p.titulo.toLowerCase()}">
                <div class="d-flex align-items-center gap-2 min-w-0 flex-grow-1">
                    <div class="icono-cat-modal icono-cat text-center flex-shrink-0">
                        <i class="bi ${icono}"></i>
                    </div>
                    <div class="min-w-0 flex-grow-1" style="padding-right: 10px;">
                        <div class="fw-bold text-dark small mb-0 text-truncate" title="${p.titulo}">${p.titulo}</div>
                        <span class="text-muted d-block text-truncate" style="font-size: 0.75rem;" title="${textoCategorias}">${textoCategorias}</span>
                    </div>
                </div>
                <div class="form-check pe-2 flex-shrink-0">
                    <input class="form-check-input chk-producto" type="checkbox" value="${p._id}" id="chk-${p._id}" ${estaMarcado} style="cursor: pointer; transform: scale(1.1);">
                </div>
            </div>
        `;
    });
}

// --- CONTROLADOR LOGICO PARA LOS BOTONES DE FILTRO INTERNOS DEL MODAL ---
function filtrarPorCategoriaModal(categoria, btnElement) {
    document.querySelectorAll('.btn-filtro-modal').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    categoriaModalActual = categoria;
    filtrarProductosModal(); 
}

// --- 3. BUSCADOR INTEGRADO EN TIEMPO REAL DEL MODAL ---
function filtrarProductosModal() {
    const texto = document.getElementById('buscarProductoModal').value.toLowerCase();
    
    const productosFiltrados = listaProductosGlobal.filter(p => {
        const tituloMatch = p.titulo.toLowerCase().includes(texto);
        const textCatArray = Array.isArray(p.categoria) ? p.categoria : (p.categoria ? [p.categoria] : []);
        const categoriasTexto = textCatArray.join(' ').toLowerCase();
            
        const textoMatchCategoria = categoriasTexto.includes(texto);
        const coincideBuscadorTexto = tituloMatch || textoMatchCategoria;

        let coincideFiltroBoton = true;
        if (categoriaModalActual !== '') {
            const terminoFiltro = categoriaModalActual.toLowerCase().substring(0, 4);
            coincideFiltroBoton = categoriasTexto.includes(terminoFiltro);
        }
        
        return coincideBuscadorTexto && coincideFiltroBoton;
    });
    
    renderizarCheckboxesModal(productosFiltrados); 
}

// --- 4. OBTENER Y RENDERIZAR PROVEEDORES DESDE EL BACKEND ---
async function cargarProveedores() {
    const contenedor = document.getElementById('contenedor-proveedores');
    if (!contenedor) return;

    try {
        const res = await fetch('http://localhost:4000/api/proveedores', {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        
        if (!res.ok) throw new Error('No se pudo obtener la lista de proveedores');
        
        listaProveedoresGlobal = await res.json();
        
        renderizarTarjetasProveedores(listaProveedoresGlobal);
        renderizarMetricasDashboard();

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = `
            <div class="col-12 text-center text-danger py-5">
                <i class="bi bi-exclamation-triangle fs-1"></i>
                <p class="mt-2">Error al conectar con el servidor de proveedores de Aminovita.</p>
            </div>`;
    }
}

// --- FUNCIÓN PARA RENDERIZAR TARJETAS EN PANTALLA PRINCIPAL ---
function renderizarTarjetasProveedores(proveedores) {
    const contenedor = document.getElementById('contenedor-proveedores');
    if (!contenedor) return;
    
    contenedor.innerHTML = ''; 

    if (proveedores.length === 0) {
        contenedor.innerHTML = `
            <div class="col-12 text-center py-5 text-muted"><i class="bi bi-search fs-1 opacity-25"></i><p class="mt-3">No se encontraron proveedores que coincidan con los filtros.</p></div>`;
        return;
    }

    proveedores.forEach(prov => {
        const badgesProductos = prov.productos && prov.productos.length > 0
            ? prov.productos.map(p => `<span class="badge bg-light text-dark border small me-1 mb-1" style="font-weight: 600; font-size: 0.75rem;"><i class="bi bi-tag-fill text-secondary me-1"></i>${p.titulo}</span>`).join('')
            : '<span class="text-muted small">Ningún insumo químico vinculado</span>';

        const badgeRfc = prov.rfc ? `<div class="mt-1 small fw-bold text-dark"><span class="badge bg-dark text-white border-0" style="font-size:0.65rem; padding: 3px 6px;"><i class="bi bi-hash me-1 text-warning"></i>RFC: ${prov.rfc}</span></div>` : '';
        const correoAlternoHtml = prov.emailSecundario ? `<div class="mb-1 text-truncate"><i class="bi bi-envelope text-muted me-2"></i>Alt: ${prov.emailSecundario}</div>` : '';
        const telefonoAlternoHtml = prov.telefonoSecundario ? `<div class="mb-1"><i class="bi bi-telephone text-muted me-2"></i>Cel: ${prov.telefonoSecundario}</div>` : '';

        contenedor.innerHTML += `
            <div class="col-md-6 mb-3">
                <div class="tarjeta-proveedor p-4 bg-white border rounded shadow-sm position-relative h-100 d-flex flex-column justify-content-between">
                    <div>
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div class="min-w-0 flex-grow-1">
                                <h4 class="fw-bold text-dark mb-0 text-truncate" style="letter-spacing: -0.5px;">${prov.empresa}</h4>
                                ${badgeRfc}
                                <span class="small text-muted d-block mt-1"><i class="bi bi-person me-1"></i> Agente: ${prov.contacto}</span>
                            </div>
                            <div class="d-flex gap-1 flex-shrink-0">
                                <button class="btn btn-sm btn-outline-secondary border-0" onclick="prepararModificacion('${prov._id}')">
                                    <i class="bi bi-pencil-square text-dark"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger border-0" onclick="eliminarProveedorReal('${prov._id}')">
                                    <i class="bi bi-trash text-danger"></i>
                                </button>
                            </div>
                        </div>
                        <div class="small text-secondary mb-3 pt-1">
                            <div class="mb-1 text-truncate"><i class="bi bi-envelope-fill me-2 text-primary"></i> ${prov.email || 'No registrado'}</div>
                            ${correoAlternoHtml}
                            <div class="mb-1"><i class="bi bi-telephone-fill me-2 text-success"></i> ${prov.telefono || 'No registrado'}</div>
                            ${telefonoAlternoHtml}
                            <div class="text-truncate"><i class="bi bi-geo-alt-fill me-2 text-muted"></i> ${prov.direccion || 'Dirección no especificada'}</div>
                        </div>
                    </div>
                    
                    <div class="border-top pt-3 mt-auto">
                        <h6 class="small fw-bold text-muted text-uppercase mb-2" style="font-size: 0.7rem; letter-spacing: 0.5px;">Insumos que Suministra:</h6>
                        <div class="d-flex flex-wrap overflow-y-auto" style="max-height: 110px; padding-right: 4px;">
                            ${badgesProductos}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

// --- MOTOR DE BÚSQUEDA GLOBAL ---
function buscarProveedoresGlobal() {
    const texto = document.getElementById('inputBusquedaProveedores').value.toLowerCase().trim();
    
    if (texto === "") {
        renderizarTarjetasProveedores(listaProveedoresGlobal);
        return;
    }

    const proveedoresFiltrados = listaProveedoresGlobal.filter(prov => {
        const coincideEmpresa = prov.empresa.toLowerCase().includes(texto);
        const coincideContacto = prov.contacto.toLowerCase().includes(texto);
        const coincideRfc = prov.rfc ? prov.rfc.toLowerCase().includes(texto) : false;
        
        const coincideProducto = prov.productos && prov.productos.some(p => {
            const tituloProd = (typeof p === 'object' && p.titulo) ? p.titulo.toLowerCase() : '';
            return tituloProd.includes(texto);
        });

        return coincideEmpresa || coincideContacto || coincideProducto || coincideRfc;
    });

    renderizarTarjetasProveedores(proveedoresFiltrados);
}

// --- 5. ENVIAR FORMULARIO (POST para crear / PUT para actualizar) ---
document.getElementById('formProveedor').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;

    if (!form.checkValidity()) {
        e.stopPropagation();
        form.classList.add('was-validated');
        return;
    }

    const swalTitulo = idProveedorEdicion ? 'Actualizando proveedor...' : 'Registrando proveedor...';
    Swal.fire({ title: swalTitulo, didOpen: () => Swal.showLoading() });

    const productosSeleccionados = Array.from(document.querySelectorAll('.chk-producto:checked')).map(chk => chk.value);

    // 👇 CORREGIDO: Ajustado el mapeo con fallback || '' para admitir campos vacíos sin reventar Mongoose 👇
    const datosProveedor = {
        empresa: document.getElementById('provEmpresa').value,
        contacto: document.getElementById('provContacto').value,
        email: document.getElementById('provEmail').value || '',
        telefono: document.getElementById('provTelefono').value || '',
        direccion: document.getElementById('provDireccion').value || '',
        productos: productosSeleccionados,
        emailSecundario: document.getElementById('provEmailSecundario').value || '',
        telefonoSecundario: document.getElementById('provTelefonoSecundario').value || '',
        rfc: document.getElementById('provRfc').value.toUpperCase() || ''
    };

    try {
        let url = 'http://localhost:4000/api/proveedores';
        let metodo = 'POST';

        if (idProveedorEdicion) {
            url = `http://localhost:4000/api/proveedores/${idProveedorEdicion}`;
            metodo = 'PUT';
        }

        const res = await fetch(url, {
            method: metodo,
            headers: { 
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token') 
            },
            body: JSON.stringify(datosProveedor)
        });

        if (res.ok) {
            Swal.fire({
                icon: 'success',
                title: idProveedorEdicion ? 'Registro Actualizado' : 'Proveedor Guardado',
                text: idProveedorEdicion ? 'Los datos se modificaron con éxito.' : 'El registro privado ha sido creado.',
                timer: 1500,
                showConfirmButton: false
            }).then(() => forzarScrollBody());

            const modalElement = document.getElementById('modalProveedor');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();
            
            form.reset();
            form.classList.remove('was-validated');
            idProveedorEdicion = null;
            await cargarProveedores();
        } else {
            const errData = await res.json();
            Swal.fire('Error', errData.msg || 'No se pudo procesar la solicitud', 'error').then(() => forzarScrollBody());
        }
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'Fallo en la comunicación con el servidor', 'error').then(() => forzarScrollBody());
    }
});

// --- 6. PREPARAR Y PRECARGAR DATOS PARA MODIFICACIÓN (GET por ID) ---
async function prepararModificacion(id) {
    Swal.fire({ title: 'Cargando datos...', didOpen: () => Swal.showLoading() });

    try {
        const res = await fetch(`http://localhost:4000/api/proveedores/${id}`, {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        
        if (!res.ok) throw new Error('No se pudo obtener el detalle del proveedor');
        const prov = await res.json();
        
        Swal.close();

        idProveedorEdicion = id;
        document.getElementById('modalTitulo').textContent = 'Modificar Proveedor Financiero';

        document.getElementById('provEmpresa').value = prov.empresa;
        document.getElementById('provContacto').value = prov.contacto;
        document.getElementById('provEmail').value = prov.email || '';
        document.getElementById('provTelefono').value = prov.telefono || '';
        document.getElementById('provDireccion').value = prov.direccion || '';

        document.getElementById('provEmailSecundario').value = prov.emailSecundario || '';
        document.getElementById('provTelefonoSecundario').value = prov.telefonoSecundario || '';
        document.getElementById('provRfc').value = prov.rfc || '';

        if (prov.emailSecundario) {
            document.getElementById('wrapperEmailSecundario').classList.remove('d-none');
            const btn = document.getElementById('btnAgregarEmailSec');
            if (btn) {
                btn.classList.replace('btn-outline-secondary', 'btn-secondary');
                btn.innerHTML = `<i class="bi bi-check-lg me-1"></i> Campo Activo`;
            }
        }
        if (prov.telefonoSecundario) {
            document.getElementById('wrapperTelefonoSecundario').classList.remove('d-none');
            const btn = document.getElementById('btnAgregarTelSec');
            if (btn) {
                btn.classList.replace('btn-outline-secondary', 'btn-secondary');
                btn.innerHTML = `<i class="bi bi-check-lg me-1"></i> Campo Activo`;
            }
        }

        document.getElementById('buscarProductoModal').value = '';
        categoriaModalActual = ''; 
        
        renderizarCheckboxesModal(listaProductosGlobal);

        if (prov.productos && prov.productos.length > 0) {
            const idProductosVinculados = prov.productos.map(p => typeof p === 'object' ? p._id : p);
            
            idProductosVinculados.forEach(idProd => {
                const checkbox = document.getElementById(`chk-${idProd}`);
                if (checkbox) checkbox.checked = true;
            });
        }

        const modalElement = document.getElementById('modalProveedor');
        const modalInstance = new bootstrap.Modal(modalElement);
        modalInstance.show();

    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudieron recuperar los detalles del proveedor', 'error').then(() => forzarScrollBody());
    }
}

// --- 7. ELIMINAR PROVEEDOR ---
async function eliminarProveedorReal(id) {
    const result = await Swal.fire({
        title: '¿Eliminar proveedor?',
        text: "Esta acción es irreversible y se perderán sus datos de contacto.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, borrar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        Swal.fire({ title: 'Eliminando...', didOpen: () => Swal.showLoading() });

        try {
            const res = await fetch(`http://localhost:4000/api/proveedores/${id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });

            if (res.ok) {
                Swal.fire('Eliminado', 'El proveedor ha sido removido del sistema.', 'success').then(() => forzarScrollBody());
                await cargarProveedores(); 
            } else {
                Swal.fire('Error', 'No se pudo procesar la baja del proveedor', 'error').then(() => forzarScrollBody());
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Error de red o conexión al backend', 'error').then(() => forzarScrollBody());
        }
    } else {
        forzarScrollBody();
    }
}

// --- EXPORTACIÓN DEL DIRECTORIO COMPLETO A UN ARCHIVO EXCEL (XLSX) ---
function exportarDirectorioExcel() {
    if (!listaProveedoresGlobal || listaProveedoresGlobal.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Operación no disponible',
            text: 'No hay registros de proveedores cargados en el sistema para exportar.',
            heightAuto: false
        }).then(() => forzarScrollBody());
        return;
    }

    Swal.fire({
        title: 'Generando Reporte...',
        text: 'Estructurando base de datos de suministro.',
        didOpen: () => Swal.showLoading(),
        heightAuto: false
    });

    const datosEstructurados = listaProveedoresGlobal.map((prov, index) => {
        const productosTexto = prov.productos && prov.productos.length > 0
            ? prov.productos.map(p => typeof p === 'object' ? p.titulo : p).join(', ')
            : 'Ninguno vinculado';

        return {
            'N°': index + 1,
            'Empresa': prov.empresa,
            'RFC': prov.rfc || 'No registrado',
            'Contacto / Agente': prov.contacto,
            'Correo Principal': prov.email || 'No registrado',
            'Correo Secundario': prov.emailSecundario || 'N/A',
            'Teléfono Principal': prov.telefono || 'No registrado',
            'Celular Secundario': prov.telefonoSecundario || 'N/A',
            'Dirección Física / Bodega': prov.direccion || 'No especificada',
            'Insumos que Suministra': productosTexto
        };
    });

    try {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(datosEstructuredos);

        const anchosColumnas = Object.keys(datosEstructurados[0]).map(key => ({
            wch: Math.max(key.length + 2, ...datosEstructurados.map(row => (row[key] ? row[key].toString().length + 2 : 10)))
        }));
        ws['!cols'] = anchosColumnas;

        XLSX.utils.book_append_sheet(wb, ws, "Directorio Proveedores");
        XLSX.writeFile(wb, "Directorio_Proveedores_Aminovita.xlsx");

        Swal.close();
        Swal.fire({
            icon: 'success',
            title: 'Reporte Descargado',
            text: 'El directorio se exportó con éxito en formato Excel (.xlsx).',
            timer: 1500,
            showConfirmButton: false,
            heightAuto: false
        }).then(() => forzarScrollBody());

    } catch (error) {
        console.error("Error al exportar a Excel:", error);
        Swal.close();
        Swal.fire({
            icon: 'error',
            title: 'Error de Exportación',
            text: 'Ocurrió un fallo al intentar procesar el binario de SheetJS.',
            heightAuto: false
        }).then(() => forzarScrollBody());
    }
}