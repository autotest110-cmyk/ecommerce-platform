
const sendEmail = require("./sendEmail");

const sendOrderConfirmationEmail = async (order) => {
  const items = order.orderItems
    .map(
      (item) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #eee">
            ${item.name || "Product"}
          </td>
          <td style="padding:10px;border-bottom:1px solid #eee">
            ${item.quantity}
          </td>
          <td style="padding:10px;border-bottom:1px solid #eee">
            ₹${Number(item.price || 0).toFixed(2)}
          </td>
        </tr>
      `
    )
    .join("");

  await sendEmail({
    to: order.customerEmail,
    subject: `Order confirmed - ${order._id}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#e83e70">Thank you for your order!</h2>
        <p>Hello ${order.shippingAddress.fullName},</p>
        <p>Your order has been placed successfully.</p>

        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Payment:</strong> ${order.isPaid ? "Paid" : "Pending"}</p>
        <p><strong>Order status:</strong> ${order.status}</p>

        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr>
              <th align="left">Product</th>
              <th align="left">Qty</th>
              <th align="left">Price</th>
            </tr>
          </thead>
          <tbody>${items}</tbody>
        </table>

        <h3>Total: ₹${Number(order.totalPrice).toFixed(2)}</h3>

        <p>
          Shipping to:<br/>
          ${order.shippingAddress.address}<br/>
          ${order.shippingAddress.city},
          ${order.shippingAddress.postalCode}<br/>
          ${order.shippingAddress.country}
        </p>

        <p>Thank you for shopping with us!</p>
      </div>
    `,
  });
};

const sendPaymentFailureEmail = async ({ email, paymentIntentId }) => {
  await sendEmail({
    to: email,
    subject: "Payment was not completed",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#e83e70">Payment not completed</h2>
        <p>We couldn't complete your payment.</p>
        <p><strong>Payment reference:</strong> ${paymentIntentId}</p>
        <p>Please return to the store and try placing your order again.</p>
        <p>If you believe you were charged, please contact our support team.</p>
      </div>
    `,
  });
};

module.exports = {
  sendOrderConfirmationEmail,
  sendPaymentFailureEmail,
};
