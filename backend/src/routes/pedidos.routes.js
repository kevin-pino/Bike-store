const express = require('express');
const controller = require('../controllers/pedidos.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(authenticate, authorize('cliente'));
router.get('/', controller.listMine);
router.post('/checkout', controller.checkout);

module.exports = router;
