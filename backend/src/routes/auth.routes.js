const express = require('express');
const controller = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/recuperar-contrasena', controller.requestPasswordReset);
router.post('/restablecer-contrasena', controller.resetPassword);

module.exports = router;
