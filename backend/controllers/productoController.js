// =======================================================
// CONTROLADOR DE PRODUCTOS (MATERIAS PRIMAS MULTI-CATEGORÍA)
// Archivo: backend/controllers/productoController.js
// =======================================================

const Producto = require('../models/product.js'); 

// 1. OBTENER PRODUCTOS (CON BÚSQUEDA, PAGINACIÓN Y MULTI-CATEGORÍAS 🔍)
exports.obtenerProductos = async (req, res) => {
    const pagina = parseInt(req.query.page) || 1;
    
    // 👇 SOLUCIÓN: Si viene un 'limit' en la URL lo usa, de lo contrario cae en el default de 24 👇
    const limite = parseInt(req.query.limit) || 24; 
    
    // Capturamos el término de búsqueda y la categoría de la URL
    const busqueda = req.query.search || ''; 
    const categoria = req.query.categoria || ''; 

    try {
        // Configuramos el filtro dinámico
        let query = {};
        
        if (busqueda) {
            query.titulo = { $regex: busqueda, $options: 'i' };
        }
        
        if (categoria) {
            // 🛠️ CORRECCIÓN CLAVE: Como ahora 'categoria' en la BD es un arreglo [String],
            // usamos $in para encontrar cualquier producto que contenga la categoría seleccionada.
            query.categoria = { $in: [categoria] }; 
        }

        const productos = await Producto.find(query)
            .sort({ titulo: 1 }) // Orden alfabético (A-Z)
            .skip((pagina - 1) * limite)
            .limit(limite);

        // Contamos los documentos que coinciden para calcular la paginación correcta
        const total = await Producto.countDocuments(query);

        res.json({
            productos,
            totalPaginas: Math.ceil(total / limite),
            paginaActual: pagina
        });
    } catch (error) {
        console.error("Error al obtener catálogo de productos:", error);
        res.status(500).json({ msg: "Error al obtener productos" });
    }
};

// 2. CREAR UN PRODUCTO
exports.crearProducto = async (req, res) => {
    try {
        // Mongoose recibirá el arreglo de strings directo desde req.body.categoria
        const nuevoProducto = new Producto(req.body);
        await nuevoProducto.save();
        res.json({ msg: "Producto agregado correctamente", producto: nuevoProducto });
    } catch (error) {
        console.error("Error al registrar producto:", error);
        res.status(500).json({ msg: "Error al guardar" });
    }
};

// 3. OBTENER UN SOLO PRODUCTO POR ID
exports.obtenerProductoPorId = async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);
        if (!producto) {
            return res.status(404).json({ msg: 'Producto no encontrado' });
        }
        res.json(producto);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error del servidor');
    }
};

// 4. ACTUALIZAR PRODUCTO (SOPORTE COMPLETO PARA ARREGLOS)
exports.actualizarProducto = async (req, res) => {
    try {
        const { titulo, descripcion, categoria, notas } = req.body;
        let producto = await Producto.findById(req.params.id);

        if (!producto) {
            return res.status(404).json({ msg: 'No existe el producto' });
        }

        // Actualizamos los campos validando la existencia de datos entrantes
        producto.titulo = titulo || producto.titulo;
        producto.descripcion = descripcion || producto.descripcion;
        
        // Asignamos la categoría directamente si viene en la petición (ya mapeada como array)
        if (categoria) {
            producto.categoria = categoria;
        }
        
        producto.notas = notas; 

        // Actualizamos de manera atómica en MongoDB Atlas
        producto = await Producto.findByIdAndUpdate(
            req.params.id, 
            { $set: producto }, 
            { new: true }
        );
        
        res.json({ msg: "Producto actualizado con éxito", producto });

    } catch (error) {
        console.error("Error al actualizar producto:", error);
        res.status(500).send('Error al actualizar');
    }
};

// 5. ELIMINAR PRODUCTO
exports.eliminarProducto = async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);
        if (!producto) {
            return res.status(404).json({ msg: 'No existe el producto' });
        }

        await Producto.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Producto eliminado correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error al eliminar');
    }
};