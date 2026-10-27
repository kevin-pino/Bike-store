const express = require('express');
const controller = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(authenticate, authorize('admin'));
router.get('/exportar', controller.exportCsv);
router.get('/', controller.get);

module.exports = router;
