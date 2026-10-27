const express = require('express');
const controller = require('../controllers/carrito.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(authenticate, authorize('cliente'));
router.get('/', controller.get);
router.post('/items', controller.add);
router.patch('/items/:idProducto', controller.update);
router.delete('/items/:idProducto', controller.remove);

module.exports = router;
