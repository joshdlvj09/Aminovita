const Producto = require('../models/product.js'); 

// 1. OBTENER PRODUCTOS (CON BÚSQUEDA, PAGINACIÓN Y CATEGORÍAS 🔍)
exports.obtenerProductos = async (req, res) => {
    const pagina = parseInt(req.query.page) || 1;
    const limite = 24; // Aumentado a 24 porque el diseño sin fotos ocupa menos espacio
    
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
            query.categoria = categoria; // Agrega el filtro si se seleccionó una categoría
        }

        const productos = await Producto.find(query)
            .sort({ titulo: 1 }) // Orden alfabético (A-Z), ideal para catálogos químicos
            .skip((pagina - 1) * limite)
            .limit(limite);

        // Contamos solo los documentos que coinciden para la paginación correcta
        const total = await Producto.countDocuments(query);

        res.json({
            productos,
            totalPaginas: Math.ceil(total / limite),
            paginaActual: pagina
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al obtener productos" });
    }
};

// 2. CREAR UN PRODUCTO
exports.crearProducto = async (req, res) => {
    try {
        const nuevoProducto = new Producto(req.body);
        await nuevoProducto.save();
        res.json({ msg: "Producto agregado correctamente", producto: nuevoProducto });
    } catch (error) {
        console.error(error);
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

// 4. ACTUALIZAR PRODUCTO
exports.actualizarProducto = async (req, res) => {
    try {
        // Extraemos los campos, incluyendo 'categoria' en lugar de 'imagen'
        const { titulo, descripcion, categoria, notas } = req.body;
        let producto = await Producto.findById(req.params.id);

        if (!producto) {
            return res.status(404).json({ msg: 'No existe el producto' });
        }

        // Actualizamos los campos
        producto.titulo = titulo || producto.titulo;
        producto.descripcion = descripcion || producto.descripcion;
        producto.categoria = categoria || producto.categoria;
        producto.notas = notas; 

        // new: true nos devuelve el producto ya actualizado
        producto = await Producto.findByIdAndUpdate(req.params.id, producto, { new: true });
        
        res.json({ msg: "Producto actualizado", producto });

    } catch (error) {
        console.error(error);
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