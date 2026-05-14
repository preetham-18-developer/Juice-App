const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Create order
router.post('/create-order', paymentController.createOrder);

// Verify payment
router.post('/verify-payment', paymentController.verifyPayment);

// Render Checkout HTML
router.get('/checkout/:orderId', paymentController.renderCheckout);

module.exports = router;
