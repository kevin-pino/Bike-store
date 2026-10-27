const express = require('express');
const controller = require('../controllers/equipos.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { uploadImagenProducto } = require('../middlewares/upload.middleware');

const router = express.Router();

// El catálogo público solo expone productos activos.
router.get('/admin/all', authenticate, authorize('admin'), controller.listAdmin);
router.get('/', controller.listPublic);
router.get('/:id', controller.getById);

// Solo el administrador puede gestionar el inventario.
router.post('/', authenticate, authorize('admin'), uploadImagenProducto, controller.create);
router.put('/:id', authenticate, authorize('admin'), uploadImagenProducto, controller.update);
router.patch('/:id/estado', authenticate, authorize('admin'), controller.setActive);

module.exports = router;
