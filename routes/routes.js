const express = require('express');
const router = express.Router();
const { prepararDataPedidosDet } = require('../controllers/prepararPedidosDetalleControllers');

router.post('/preparar-pedidos-detalle', prepararDataPedidosDet);

module.exports = router;
