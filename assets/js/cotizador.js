// =======================================================
// BRAIN - LÓGICA DEL COTIZADOR MASIVO MULTISELECCIÓN
// Archivo: ../assets/js/cotizador.js
// =======================================================

let proveedoresGlobal = []; // Copia local de todos los proveedores
let productosGlobal = [];    // Copia local de todos los productos del catálogo
let proveedoresFiltradosActuales = []; // Proveedores que coinciden con los insumos seleccionados

document.addEventListener('DOMContentLoaded', async () => {
    const rol = localStorage.getItem('usuarioRol');
    if (rol !== 'admin') {
        window.location.href = './productos.html';
        return;
    }

    Swal.fire({ title: 'Sincronizando Módulo...', didOpen: () => Swal.showLoading(), heightAuto: false });
    
    await Promise.all([
        cargarProductosEnCheckboxes(),
        obtenerProveedoresBase()
    ]);

    Swal.close();
});

// --- 1. RENDERIZAR CHECKBOXES DE MATERIAS PRIMAS CON FILTRO ---
async function cargarProductosEnCheckboxes() {
    const contenedor = document.getElementById('contenedorCheckboxesProductos');
    if (!contenedor) return;

    try {
        const res = await fetch('http://localhost:4000/api/productos', {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        const data = await res.json();
        productosGlobal = data.productos || data;

        renderizarCheckboxesProductos(productosGlobal);
    } catch (error) {
        console.error("Error al poblar catálogo:", error);
        contenedor.innerHTML = '<span class="text-danger small">Error al conectar con el catálogo</span>';
    }
}

function renderizarCheckboxesProductos(productos) {
    const contenedor = document.getElementById('contenedorCheckboxesProductos');
    if (!contenedor) return;

    contenedor.innerHTML = '';
    productos.forEach(p => {
        contenedor.innerHTML += `
            <div class="form-check mb-2 product-item-row" data-titulo="${p.titulo.toLowerCase()}">
                <input class="form-check-input chk-materia-prima-filtro" type="checkbox" value="${p._id}" data-titulo="${p.titulo}" id="prod-fil-${p._id}" onchange="manejarCambioInsumos()">
                <label class="form-check-label text-dark small" style="cursor:pointer;" for="prod-fil-${p._id}">
                    ${p.titulo}
                </label>
            </div>
        `;
    });
}

// --- 2. BUSCADOR EN TIEMPO REAL PARA EL PANEL DE PRODUCTOS ---
function filtrarProductosCotizador() {
    const texto = document.getElementById('buscarProductoCotizador').value.toLowerCase();
    const filas = document.querySelectorAll('.product-item-row');
    
    filas.forEach(fila => {
        const titulo = fila.getAttribute('data-titulo');
        if (titulo.includes(texto)) {
            fila.classList.remove('d-none');
        } else {
            fila.classList.add('d-none');
        }
    });
}

// --- 3. OBTENER LISTA DE PROVEEDORES ---
async function obtenerProveedoresBase() {
    try {
        const res = await fetch('http://localhost:4000/api/proveedores', {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        proveedoresGlobal = await res.json();
    } catch (error) {
        console.error("Error al recuperar proveedores:", error);
    }
}

// --- 4. EVALUAR INSUMOS SELECCIONADOS Y CRUZAR INFORMACIÓN ---
function manejarCambioInsumos() {
    const checkboxesProductos = document.querySelectorAll('.chk-materia-prima-filtro:checked');
    const textarea = document.getElementById('txtMensajeCotizacion');
    if (!textarea) return;

    if (checkboxesProductos.length === 0) {
        textarea.disabled = true;
        textarea.value = '';
        proveedoresFiltradosActuales = [];
        renderizarProveedoresFiltrados();
        return;
    }

    // Extraer IDs y Títulos de los compuestos químicos seleccionados
    const idsSeleccionados = Array.from(checkboxesProductos).map(chk => chk.value);
    const titulosSeleccionados = Array.from(checkboxesProductos).map(chk => chk.getAttribute('data-titulo'));

    textarea.disabled = false;
    
    // Plantilla dinámica adaptada para enlistar de forma estética múltiples compuestos
    const listaInsumosMensaje = titulosSeleccionados.map(t => `- ${t}`).join('\n');
    textarea.value = `Buen día,\n\nFormo parte del equipo de operaciones de Aminovita y Químicos. Nos encontramos en el proceso de evaluación de adquisiciones para los siguientes insumos industriales:\n\n${listaInsumosMensaje}\n\nSolicitamos de la manera más atenta nos compartan su cotización formal, especificando escala de precios por volumen, tiempos estimados de entrega en bodega y certificado de pureza analítica.\n\nQuedamos atentos a su respuesta.\nSaludos cordiales.`;

    // Filtrar proveedores: Buscamos si el proveedor tiene vinculada AL MENOS una de las materias primas marcadas
    proveedoresFiltradosActuales = proveedoresGlobal.filter(prov => {
        return prov.productos.some(prod => {
            const idProdEval = (typeof prod === 'object') ? prod._id : prod;
            return idsSeleccionados.includes(idProdEval);
        });
    });

    renderizarProveedoresFiltrados();
}

// --- 5. RENDERIZAR INTERFAZ LATERAL DE PROVEEDORES ---
function renderizarProveedoresFiltrados() {
    const contenedor = document.getElementById('contenedorProveedoresFiltrados');
    const zonaSeleccion = document.getElementById('zona-seleccionar-todos');
    if (!contenedor) return;

    if (proveedoresFiltradosActuales.length === 0) {
        zonaSeleccion.classList.add('d-none');
        contenedor.innerHTML = `
            <div class="text-center py-5 text-muted small">
                <i class="bi bi-building-dash fs-2 d-block mb-2 opacity-50"></i>
                Marca una o más materias primas para identificar proveedores vinculados.
            </div>`;
        return;
    }

    zonaSeleccion.classList.remove('d-none');
    contenedor.innerHTML = '';

    proveedoresFiltradosActuales.forEach(prov => {
        contenedor.innerHTML += `
            <div class="tarjeta-proveedor-check d-flex align-items-center p-3 mb-2" onclick="toggleCheckboxTarjeta('${prov._id}')">
                <div class="chk-columna flex-shrink-0">
                    <input class="form-check-input chk-cotizar-masivo" type="checkbox" value="${prov._id}" id="chk-cot-${prov._id}" onclick="event.stopPropagation();">
                </div>
                <div class="flex-grow-1 min-w-0 ms-2">
                    <h6 class="fw-bold text-dark mb-0 text-truncate">${prov.empresa}</h6>
                    <span class="text-muted d-block text-truncate" style="font-size: 0.75rem;"><i class="bi bi-person me-1"></i> ${prov.contacto}</span>
                </div>
                <div class="flex-shrink-0 text-end d-none d-sm-block">
                    <span class="badge bg-light border text-secondary small" style="font-size:0.7rem;"><i class="bi bi-whatsapp me-1 text-success"></i>Activo</span>
                </div>
            </div>
        `;
    });
}

function toggleCheckboxTarjeta(id) {
    const checkbox = document.getElementById(`chk-cot-${id}`);
    if (checkbox) checkbox.checked = !checkbox.checked;
}

function seleccionarTodosProveedores(estado) {
    document.querySelectorAll('.chk-cotizar-masivo').forEach(chk => chk.checked = estado);
}

// --- 6. MOTOR DE DISPARO MASIVO (WHATSAPP Y MAIL) ---
async function enviarCotizacionesMasivas(canal) {
    const seleccionadosIds = Array.from(document.querySelectorAll('.chk-cotizar-masivo:checked')).map(chk => chk.value);
    const mensajeCuerpo = document.getElementById('txtMensajeCotizacion').value;

    if (seleccionadosIds.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Operación vacía', text: 'Por favor, selecciona al menos un proveedor de la lista.', heightAuto: false });
        return;
    }

    const proveedoresACotizar = proveedoresFiltradosActuales.filter(p => seleccionadosIds.includes(p._id));

    if (canal === 'correo') {
        const listaCorreos = proveedoresACotizar.map(p => p.email);
        const asunto = encodeURIComponent("Solicitud de Cotización Industrial - Aminovita");
        const cuerpoMail = encodeURIComponent(mensajeCuerpo);
        window.location.href = `mailto:${listaCorreos.join(',')}?subject=${asunto}&body=${cuerpoMail}`;
        Swal.fire({ icon: 'success', title: 'Gestor abierto', text: 'Se ha abierto tu cliente de correo predeterminado con los destinatarios listos.', heightAuto: false });
        
    } else if (canal === 'whatsapp') {
        Swal.fire({
            title: 'Iniciando secuencia',
            text: `Vas a enviar cotizaciones a ${proveedoresACotizar.length} proveedores a través de WhatsApp Web.`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#198754',
            confirmButtonText: 'Comenzar envíos',
            cancelButtonText: 'Cancelar',
            heightAuto: false
        }).then(async (result) => {
            if (result.isConfirmed) {
                for (let i = 0; i < proveedoresACotizar.length; i++) {
                    const p = proveedoresACotizar[i];
                    let numLimpio = p.telefono.replace(/[^0-9]/g, '');
                    
                    if (numLimpio.length === 10) {
                        numLimpio = '52' + numLimpio;
                    }

                    const textoFormateado = encodeURIComponent(mensajeCuerpo);
                    window.open(`https://wa.me/${numLimpio}?text=${textoFormateado}`, '_blank');

                    if (i < proveedoresACotizar.length - 1) {
                        const confirmNext = await Swal.fire({
                            title: `Envío ${i + 1}/${proveedoresACotizar.length} abierto`,
                            text: `Se abrió el chat con "${p.empresa}". Presiona el botón cuando estés listo para cargar el chat del siguiente proveedor.`,
                            icon: 'success',
                            confirmButtonText: 'Siguiente Proveedor',
                            cancelButtonText: 'Detener secuencia',
                            showCancelButton: true,
                            allowOutsideClick: false,
                            heightAuto: false
                        });

                        if (!confirmNext.isConfirmed) break;
                    } else {
                        Swal.fire({ icon: 'success', title: 'Secuencia Completa', text: 'Todos los canales de cotización seleccionados han sido abiertos.', heightAuto: false });
                    }
                }
            }
        });
    }
}