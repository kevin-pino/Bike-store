const express = require('express');
const controller = require('../controllers/usuarios.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(authenticate, authorize('admin'));
router.get('/', controller.list);
router.patch('/:id/rol', controller.updateRole);
router.patch('/:id/estado', controller.setActive);

module.exports = router;
