// =======================================================
// CONTROLADOR DE PROVEEDORES (MODO ADMIN - PRIVADO)
// Archivo: backend/controllers/proveedorController.js
// =======================================================

const Proveedor = require('../models/Proveedor');
// 💡 IMPORTANTE: Forzamos la carga del modelo 'Product' para evitar el MissingSchemaError
const Product = require('../models/product.js'); 

// 1. CREAR UN NUEVO PROVEEDOR
exports.crearProveedor = async (req, res) => {
    try {
        const nuevoProveedor = new Proveedor(req.body);
        await nuevoProveedor.save();
        res.status(201).json({ msg: 'Proveedor registrado con éxito', nuevoProveedor });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al guardar el proveedor' });
    }
};

// 2. OBTENER TODOS LOS PROVEEDORES (CON SUS PRODUCTOS VINCULADOS)
exports.obtenerProveedores = async (req, res) => {
    try {
        // .populate('productos') extrae la info de la colección 'Product' usando los IDs almacenados
        const proveedores = await Proveedor.find().populate('productos', 'titulo categoria');
        res.json(proveedores);
    } catch (error) {
        console.error("Error al obtener proveedores:", error);
        res.status(500).json({ msg: 'Error al obtener los proveedores' });
    }
};

// 3. 👇 NUEVO: OBTENER UN ÚNICO PROVEEDOR POR ID (PARA PRECARGAR MODAL) 👇
exports.obtenerProveedorPorId = async (req, res) => {
    try {
        const proveedor = await Proveedor.findById(req.params.id);
        if (!proveedor) {
            return res.status(404).json({ msg: 'Proveedor no encontrado' });
        }
        res.json(proveedor);
    } catch (error) {
        console.error("Error al obtener el detalle del proveedor:", error);
        res.status(500).json({ msg: 'Error al obtener los datos del proveedor' });
    }
};

// 4. 👇 NUEVO: ACTUALIZAR UN PROVEEDOR EXISTENTE (PUT) 👇
exports.actualizarProveedor = async (req, res) => {
    try {
        // Buscamos el proveedor por ID y actualizamos con los datos que vienen en req.body
        let proveedor = await Proveedor.findById(req.params.id);
        if (!proveedor) {
            return res.status(404).json({ msg: 'Proveedor no encontrado' });
        }

        proveedor = await Proveedor.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true } // Nos retorna el objeto actualizado de forma inmediata
        );

        res.json({ msg: 'Proveedor actualizado con éxito', proveedor });
    } catch (error) {
        console.error("Error al actualizar proveedor:", error);
        res.status(500).json({ msg: 'Error al modificar los datos del proveedor' });
    }
};

// 5. ELIMINAR UN PROVEEDOR
exports.eliminarProveedor = async (req, res) => {
    try {
        let proveedor = await Proveedor.findById(req.params.id);
        if (!proveedor) {
            return res.status(404).json({ msg: 'Proveedor no encontrado' });
        }

        await Proveedor.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Proveedor eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al eliminar el proveedor' });
    }
};