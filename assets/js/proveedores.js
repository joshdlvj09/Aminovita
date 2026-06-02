// =======================================================
// CONTROL DE PROVEEDORES (PRIVADO - MODO ADMIN)
// Archivo: ../assets/js/proveedores.js
// =======================================================

let idProveedorEdicion = null; // Almacena el ID si estamos editando
let listaProductosGlobal = [];  // Caché local para filtrar los productos en el modal
let listaProveedoresGlobal = []; // 👇 NUEVO: Caché local para el buscador principal de la página
let categoriaModalActual = '';  // Almacena la categoría activa dentro del modal

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
            
            // Renderizar la lista limpia completa
            renderizarCheckboxesModal(listaProductosGlobal);
        });
    }
});

// --- 1. LLENAR CONTENEDOR CON CHECKBOXES ESTILIZADOS (CON LOGOS) ---
async function cargarProductosEnCheckboxes() {
    const contenedor = document.getElementById('contenedorCheckboxesProductos');
    if (!contenedor) return;

    try {
        const res = await fetch('http://localhost:4000/api/productos', {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        const data = await res.json();
        
        // Guardar en la variable global para el buscador del modal
        listaProductosGlobal = data.productos || data;
        
        renderizarCheckboxesModal(listaProductosGlobal);
    } catch (error) {
        console.error("Error al cargar productos para el selector:", error);
        contenedor.innerHTML = `<span class="text-danger small"><i class="bi bi-exclamation-triangle"></i> Error al cargar catálogo</span>`;
    }
}

// --- 2. RENDERIZAR CHECKBOXES CON EL ESTILO DINÁMICO (SOPORTE MULTI-CATEGORÍA) ---
function renderizarCheckboxesModal(productos) {
    const contenedor = document.getElementById('contenedorCheckboxesProductos');
    if (!contenedor) return;

    // Almacenar temporalmente los IDs que ya están marcados por el usuario antes de limpiar el HTML
    const marcadosPreviamente = Array.from(document.querySelectorAll('.chk-producto:checked')).map(chk => chk.value);

    if (productos.length === 0) {
        contenedor.innerHTML = `<div class="text-muted small text-center py-4"><i class="bi bi-search opacity-50 fs-4 d-block mb-2"></i>No se encontraron compuestos en esta selección.</div>`;
        return;
    }

    contenedor.innerHTML = '';

    productos.forEach(p => {
        let claseCat = 'border-secondary';
        let icono = 'bi-box-seam';
        
        // Aseguramos procesar las categorías como array límpio
        const categoriasArray = Array.isArray(p.categoria) ? p.categoria : (p.categoria ? [p.categoria] : []);
        const categoriasTexto = categoriasArray.join(' ').toLowerCase();

        // LÓGICA COPIADA DEL CATÁLOGO: Si tiene más de una industria y estamos en "Todos", es "Varios"
        if (categoriasArray.length > 1 && categoriaModalActual === '') {
            claseCat = 'cat-varios';
            icono = 'bi-layers-half';
        } else {
            // Si hay filtro activo o es categoría única, evaluamos de manera forzada para la mutación adaptativa
            const catEval = (categoriaModalActual !== '') ? categoriaModalActual.toLowerCase() : categoriasTexto;

            if (catEval.includes('farma')) {
                claseCat = 'cat-farmaceutica';
                icono = 'bi-capsule';
            } else if (catEval.includes('alim')) {
                claseCat = 'cat-alimentos';
                icono = 'bi-egg-fried';
            } else if (catEval.includes('cosm')) {
                claseCat = 'cat-cosmetica';
                icono = 'bi-stars';
            } else if (catEval.includes('veterin') || catEval.includes('vet') || catEval.includes('anim')) { 
                claseCat = 'cat-veterinario';
                icono = 'bi-heart-pulse'; 
            } else if (catEval.includes('agro')) {      
                claseCat = 'cat-agroquimico';
                icono = 'bi-tree';
            }
        }

        const textoCategorias = categoriasArray.join(', ') || 'General';
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
    filtrarProductosModal(); // Re-evalúa combinando la categoría y lo que esté escrito en el buscador
}

// --- 3. BUSCADOR INTEGRADO EN TIEMPO REAL DEL MODAL (TEXTO + BOTONES DE CATEGORÍA) ---
function filtrarProductosModal() {
    const texto = document.getElementById('buscarProductoModal').value.toLowerCase();
    
    const productosFiltrados = listaProductosGlobal.filter(p => {
        const tituloMatch = p.titulo.toLowerCase().includes(texto);
        
        const categoriasTexto = Array.isArray(p.categoria) 
            ? p.categoria.join(' ').toLowerCase() 
            : (p.categoria ? p.toLowerCase() : '');
            
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
        
        // 👇 MODIFICADO: Guardamos la respuesta original completa en nuestra caché local
        listaProveedoresGlobal = await res.json();
        
        // Renderizamos las tarjetas usando la función unificada
        renderizarTarjetasProveedores(listaProveedoresGlobal);

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = `
            <div class="col-12 text-center text-danger py-5">
                <i class="bi bi-exclamation-triangle fs-1"></i>
                <p class="mt-2">Error al conectar con el servidor de proveedores de Aminovita.</p>
            </div>`;
    }
}

// --- 👇 NUEVA: FUNCIÓN REFACTORIZADA PARA RENDERIZAR TARJETAS EN PANTALLA PRINCIPAL 👇 ---
function renderizarTarjetasProveedores(proveedores) {
    const contenedor = document.getElementById('contenedor-proveedores');
    if (!contenedor) return;
    
    contenedor.innerHTML = ''; 

    if (proveedores.length === 0) {
        contenedor.innerHTML = `
            <div class="col-12 text-center py-5 text-muted">
                <i class="bi bi-search fs-1 opacity-25"></i>
                <p class="mt-3">No se encontraron proveedores que coincidan con los filtros.</p>
            </div>`;
        return;
    }

    proveedores.forEach(prov => {
        const badgesProductos = prov.productos && prov.productos.length > 0
            ? prov.productos.map(p => `<span class="badge bg-light text-dark border small me-1 mb-1" style="font-weight: 600; font-size: 0.75rem;"><i class="bi bi-tag-fill text-secondary me-1"></i>${p.titulo}</span>`).join('')
            : '<span class="text-muted small">Ningún insumo químico vinculado</span>';

        contenedor.innerHTML += `
            <div class="col-md-6">
                <div class="tarjeta-proveedor p-4 bg-white border rounded shadow-sm position-relative">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h4 class="fw-bold text-dark mb-1" style="letter-spacing: -0.5px;">${prov.empresa}</h4>
                            <span class="small text-muted"><i class="bi bi-person me-1"></i> ${prov.contacto}</span>
                        </div>
                        <div class="d-flex gap-1">
                            <button class="btn btn-sm btn-outline-secondary border-0" onclick="prepararModificacion('${prov._id}')">
                                <i class="bi bi-pencil-square text-dark"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger border-0" onclick="eliminarProveedorReal('${prov._id}')">
                                <i class="bi bi-trash text-danger"></i>
                            </button>
                        </div>
                    </div>
                    <div class="small text-secondary mb-3">
                        <div class="mb-1"><i class="bi bi-envelope-fill me-2 text-primary"></i> ${prov.email}</div>
                        <div class="mb-1"><i class="bi bi-telephone-fill me-2 text-success"></i> ${prov.telefono}</div>
                        <div><i class="bi bi-geo-alt-fill me-2 text-muted"></i> ${prov.direccion || 'Dirección no especificada'}</div>
                    </div>
                    <div class="border-top pt-3">
                        <h6 class="small fw-bold text-muted text-uppercase mb-2" style="font-size: 0.7rem; letter-spacing: 0.5px;">Insumos que Suministra:</h6>
                        <div class="d-flex flex-wrap">
                            ${badgesProductos}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

// --- 👇 NUEVA: MOTOR DE BÚSQUEDA GLOBAL (EMPRESA, AGENTE O PRODUCTO VINCULADO) 👇 ---
function buscarProveedoresGlobal() {
    const texto = document.getElementById('inputBusquedaProveedores').value.toLowerCase().trim();
    
    if (texto === "") {
        renderizarTarjetasProveedores(listaProveedoresGlobal);
        return;
    }

    const proveedoresFiltrados = listaProveedoresGlobal.filter(prov => {
        const coincideEmpresa = prov.empresa.toLowerCase().includes(texto);
        const coincideContacto = prov.contacto.toLowerCase().includes(texto);
        
        // Evaluar si alguno de sus productos asignados coincide con el texto escrito
        const coincideProducto = prov.productos && prov.productos.some(p => {
            const tituloProd = (typeof p === 'object' && p.titulo) ? p.titulo.toLowerCase() : '';
            return tituloProd.includes(texto);
        });

        return coincideEmpresa || coincideContacto || coincideProducto;
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

    const datosProveedor = {
        empresa: document.getElementById('provEmpresa').value,
        contacto: document.getElementById('provContacto').value,
        email: document.getElementById('provEmail').value,
        telefono: document.getElementById('provTelefono').value,
        direccion: document.getElementById('provDireccion').value,
        productos: productosSeleccionados
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
            });

            const modalElement = document.getElementById('modalProveedor');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();
            
            form.reset();
            form.classList.remove('was-validated');
            idProveedorEdicion = null;
            await cargarProveedores();
        } else {
            const errData = await res.json();
            Swal.fire('Error', errData.msg || 'No se pudo procesar la solicitud', 'error');
        }
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'Fallo en la comunicación con el servidor', 'error');
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
        document.getElementById('provEmail').value = prov.email;
        document.getElementById('provTelefono').value = prov.telefono;
        document.getElementById('provDireccion').value = prov.direccion || '';

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
        Swal.fire('Error', 'No se pudieron recuperar los detalles del proveedor', 'error');
    }
}

// --- 7. ELIMINAR PROVEEDOR DE LA BASE DE DATOS (DELETE) ---
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
                Swal.fire('Eliminado', 'El proveedor ha sido removido del sistema.', 'success');
                await cargarProveedores(); 
            } else {
                Swal.fire('Error', 'No se pudo procesar la baja del proveedor', 'error');
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Error de red o conexión al backend', 'error');
        }
    }
}