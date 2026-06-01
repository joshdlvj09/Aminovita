// =======================================================
// CONTROL DE PROVEEDORES (PRIVADO - MODO ADMIN)
// Archivo: ../assets/js/proveedores.js
// =======================================================

let idProveedorEdicion = null; // Almacena el ID si estamos editando
let listaProductosGlobal = [];  // Caché local para filtrar los productos en el modal

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
            // Desmarcar todos los checkboxes
            document.querySelectorAll('.chk-producto').forEach(chk => chk.checked = false);
            const inputBuscar = document.getElementById('buscarProductoModal');
            if (inputBuscar) { inputBuscar.value = ''; filtrarProductosModal(); }
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

// --- 2. RENDERIZAR CHECKBOXES CON EL ESTILO DEL CATÁLOGO ---
function renderizarCheckboxesModal(productos) {
    const contenedor = document.getElementById('contenedorCheckboxesProductos');
    if (!contenedor) return;

    if (productos.length === 0) {
        contenedor.innerHTML = `<div class="text-muted small text-center py-2">No se encontraron productos coincidentes.</div>`;
        return;
    }

    contenedor.innerHTML = '';

    productos.forEach(p => {
        // Determinar icono y clase según tu esquema de categorías
        let claseCat = 'border-secondary';
        let icono = 'bi-box-seam';
        const categoria = p.categoria ? p.categoria.toLowerCase() : '';

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

        // Crear fila interactiva con checkbox incorporado
        contenedor.innerHTML += `
            <div class="item-producto-modal d-flex align-items-center justify-content-between p-2 mb-2 bg-white rounded border-start border-4 ${claseCat}" style="border: 1px solid #e9ecef; border-left-width: 4px;" data-titulo="${p.titulo.toLowerCase()}">
                <div class="d-flex align-items-center gap-2">
                    <div class="icono-cat p-1 bg-light rounded text-center" style="width: 32px; height: 32px; font-size: 0.9rem;">
                        <i class="bi ${icono}"></i>
                    </div>
                    <div>
                        <div class="fw-bold text-dark small mb-0">${p.titulo}</div>
                        <span class="text-muted" style="font-size: 0.75rem;">${p.categoria || 'General'}</span>
                    </div>
                </div>
                <div class="form-check pe-2">
                    <input class="form-check-input chk-producto" type="checkbox" value="${p._id}" id="chk-${p._id}" style="cursor: pointer; transform: scale(1.1);">
                </div>
            </div>
        `;
    });
}

// --- 3. BUSCADOR EN TIEMPO REAL DENTRO DEL MODAL ---
function filtrarProductosModal() {
    const texto = document.getElementById('buscarProductoModal').value.toLowerCase();
    const productosFiltrados = listaProductosGlobal.filter(p => 
        p.titulo.toLowerCase().includes(texto) || (p.categoria && p.categoria.toLowerCase().includes(texto))
    );
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
        
        const proveedores = await res.json();
        contenedor.innerHTML = ''; 

        if (proveedores.length === 0) {
            contenedor.innerHTML = `
                <div class="col-12 text-center py-5 text-muted">
                    <i class="bi bi-people fs-1 opacity-25"></i>
                    <p class="mt-3">No hay proveedores registrados en el sistema privado.</p>
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
    } catch (error) {
        console.error(error);
        contenedor.innerHTML = `
            <div class="col-12 text-center text-danger py-5">
                <i class="bi bi-exclamation-triangle fs-1"></i>
                <p class="mt-2">Error al conectar con el servidor de proveedores de Aminovita.</p>
            </div>`;
    }
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

    // Extraemos los IDs mapeando los checkboxes que estén marcados (.chk-producto:checked)
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

        // Si tenemos un ID cargado, cambiamos a modo actualización (PUT)
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
        // Obtenemos la info específica del proveedor a modificar desde el backend
        const res = await fetch(`http://localhost:4000/api/proveedores/${id}`, {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        
        if (!res.ok) throw new Error('No se pudo obtener el detalle del proveedor');
        const prov = await res.json();
        
        Swal.close();

        // 1. Cambiar estado global a modo edición e inyectar textos al modal
        idProveedorEdicion = id;
        document.getElementById('modalTitulo').textContent = 'Modificar Proveedor Financiero';

        // 2. Colocar los valores en sus respectivos inputs del formulario
        document.getElementById('provEmpresa').value = prov.empresa;
        document.getElementById('provContacto').value = prov.contacto;
        document.getElementById('provEmail').value = prov.email;
        document.getElementById('provTelefono').value = prov.telefono;
        document.getElementById('provDireccion').value = prov.direccion || '';

        // 3. Limpiar cualquier búsqueda previa en el catálogo y resetear la vista completa
        document.getElementById('buscarProductoModal').value = '';
        renderizarCheckboxesModal(listaProductosGlobal);

        // 4. Marcar de manera exacta los checkboxes de los productos ya vinculados en la BD
        if (prov.productos && prov.productos.length > 0) {
            // Extraer solo los IDs si la respuesta viene con populate de objetos
            const idProductosVinculados = prov.productos.map(p => typeof p === 'object' ? p._id : p);
            
            idProductosVinculados.forEach(idProd => {
                const checkbox = document.getElementById(`chk-${idProd}`);
                if (checkbox) checkbox.checked = true;
            });
        }

        // 5. Levantar el modal visualmente
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