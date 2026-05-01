const razorpay = require('../utils/razorpay');
const crypto = require('crypto');

/**
 * @desc Create a new Razorpay order
 * @route POST /api/payment/create-order
 */
exports.createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body;

    // Validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required (must be a positive number)',
      });
    }

    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create order with Razorpay',
      });
    }

    // Return only necessary data, never expose secrets
    res.status(201).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('RAZORPAY_ORDER_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc Verify the Razorpay payment signature
 * @route POST /api/payment/verify-payment
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Order ID, Payment ID, and Signature are required',
      });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid signature. Payment verification failed.',
      });
    }
  } catch (error) {
    console.error('RAZORPAY_VERIFY_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

/**
 * @desc Render the Razorpay Checkout HTML page for WebView
 * @route GET /api/payment/checkout/:orderId
 */
exports.renderCheckout = (req, res) => {
  const { orderId } = req.params;
  const { amount, name, email, contact } = req.query;

  if (!process.env.RAZORPAY_KEY_ID) {
    return res.status(500).send('Razorpay Key ID is not configured');
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <style>
          body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f8fafc; font-family: sans-serif; }
          .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3A8C3F; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          p { color: #64748b; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div style="text-align: center;">
          <div class="loader"></div>
          <p>Initializing Secure Payment...</p>
        </div>
        <script>
          const options = {
            "key": "${process.env.RAZORPAY_KEY_ID}",
            "amount": "${amount}",
            "currency": "INR",
            "name": "${name || 'JuicyApp'}",
            "description": "Payment for order ${orderId}",
            "order_id": "${orderId}",
            "handler": function (response) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                status: 'success',
                data: response
              }));
            },
            "prefill": {
              "name": "${name || ''}",
              "email": "${email || ''}",
              "contact": "${contact || ''}"
            },
            "theme": {
              "color": "#3A8C3F"
            },
            "modal": {
              "ondismiss": function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  status: 'cancelled'
                }));
              }
            }
          };
          
          try {
            const rzp = new Razorpay(options);
            rzp.on('payment.failed', function (response){
              window.ReactNativeWebView.postMessage(JSON.stringify({
                status: 'failure',
                data: response.error
              }));
            });
            window.onload = function() {
              setTimeout(() => rzp.open(), 500); // small delay to ensure rendering
            };
          } catch(e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              status: 'failure',
              data: { description: 'Failed to load Razorpay SDK' }
            }));
          }
        </script>
      </body>
    </html>
  `;
  res.send(html);
};
