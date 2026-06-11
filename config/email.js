const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'SOLLENE <noreply@sollene.site>';

async function sendWithRetry(fn, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function layout(body) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#f5f5f5;font-family:'Inter',Helvetica,Arial,sans-serif}
  .wrapper{max-width:600px;margin:0 auto;padding:32px 16px}
  .card{background:#fff;padding:40px 32px;margin-bottom:24px}
  .logo{font-family:'Playfair Display',Georgia,serif;font-size:24px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#000;text-align:center;margin-bottom:32px;display:block;text-decoration:none}
  h1{font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:600;color:#000;margin:0 0 8px}
  p{font-size:15px;line-height:1.7;color:#555;margin:0 0 16px}
  .btn{display:inline-block;padding:14px 32px;background:#000;color:#fff !important;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;margin:8px 0 24px}
  .btn:hover{background:#333}
  table{width:100%;border-collapse:collapse;margin:16px 0}
  th{text-align:left;padding:10px 12px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#999;border-bottom:1px solid #eee}
  td{padding:12px;font-size:14px;color:#333;border-bottom:1px solid #f5f5f5}
  .total-row td{font-weight:700;color:#000;border-top:2px solid #000}
  .info-box{padding:16px;background:#fafafa;margin:16px 0;font-size:14px;color:#555}
  .info-box strong{color:#000;display:inline-block;width:100px}
  .footer-text{text-align:center;font-size:13px;color:#999;margin-top:24px}
  a{color:#000}
  hr{border:none;border-top:1px solid #eee;margin:24px 0}
</style></head><body>
<div class="wrapper">
  <a class="logo" href="https://sollene.site">SOLLENE</a>
  <div class="card">${body}</div>
  <p class="footer-text">SOLLENE — Elevating Everyday Living<br>Lagos, Nigeria<br>
  <a href="https://sollene.site">sollene.site</a> &middot; 
  <a href="mailto:hello@sollene.site">hello@sollene.site</a></p>
</div></body></html>`;
}

function buildOrderItemsTable(items) {
  let rows = items.map(i => `<tr><td>${i.name}${i.variant ? ' ('+i.variant+')' : ''}</td><td>${i.quantity}</td><td>₦${Number(i.price).toLocaleString()}</td><td>₦${(i.price*i.quantity).toLocaleString()}</td></tr>`).join('');
  return `<table><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>${rows}</table>`;
}

exports.sendWelcomeEmail = async (email, firstName) => {
  const html = layout(`<h1>Welcome to SOLLENE</h1>
  <p>Hi ${firstName || 'there'},</p>
  <p>Thank you for creating an account with SOLLENE. We're excited to have you join our community of people who appreciate quality, style, and everyday elegance.</p>
  <p>Start exploring our curated collection of premium household items, clothing, and personal care products.</p>
  <a href="https://sollene.site/shop" class="btn">Shop Now</a>
  <hr>
  <p style="font-size:14px;color:#999">Follow us on Instagram <a href="#">@sollene</a> for exclusive updates and style inspiration.</p>`);
  return sendWithRetry(() => resend.emails.send({ from: FROM, to: email, subject: 'Welcome to SOLLENE — Elevating Everyday Living', html }));
};

exports.sendOrderConfirmation = async (email, firstName, order) => {
  const html = layout(`<h1>Order Confirmed</h1>
  <p>Hi ${firstName || 'Customer'},</p>
  <p>Thank you for your order! We've received it and are preparing it for dispatch.</p>
  <div class="info-box">
    <strong>Order #</strong> ${order._id.toString().slice(-8).toUpperCase()}<br>
    <strong>Date</strong> ${new Date(order.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}<br>
    <strong>Status</strong> ${order.status}<br>
    <strong>Payment</strong> ${order.paymentStatus === 'success' ? 'Paid' : 'Pending'}<br>
    ${order.paymentReference ? '<strong>Reference</strong> '+order.paymentReference : ''}
  </div>
  ${buildOrderItemsTable(order.items)}
  <div class="info-box" style="text-align:right">
    <div><strong style="width:auto">Subtotal</strong> ₦${Number(order.subtotal).toLocaleString()}</div>
    ${order.discount ? `<div><strong style="width:auto">Discount</strong> -₦${Number(order.discount).toLocaleString()}</div>` : ''}
    ${order.tax ? `<div><strong style="width:auto">Tax (VAT 7.5%)</strong> ₦${Number(order.tax).toLocaleString()}</div>` : ''}
    <div><strong style="width:auto">Shipping</strong> ${order.shippingCost ? '₦'+Number(order.shippingCost).toLocaleString() : 'Free'}</div>
    <div style="font-size:18px;font-weight:700;margin-top:8px"><strong style="width:auto">Total</strong> ₦${Number(order.total).toLocaleString()}</div>
  </div>
  <p>We'll send you a shipping confirmation with tracking details once your order is on its way.</p>
  <a href="https://sollene.site/account/orders" class="btn">View Order</a>`);
  return sendWithRetry(() => resend.emails.send({ from: FROM, to: email, subject: `Order Confirmed — #${order._id.toString().slice(-8).toUpperCase()}`, html }));
};

exports.sendShippingUpdate = async (email, firstName, order) => {
  const html = layout(`<h1>Your Order Has Shipped!</h1>
  <p>Hi ${firstName || 'Customer'},</p>
  <p>Great news! Your order is on its way.</p>
  <div class="info-box">
    <strong>Order #</strong> ${order._id.toString().slice(-8).toUpperCase()}<br>
    <strong>Status</strong> ${order.status}<br>
    ${order.trackingNumber ? '<strong>Tracking</strong> '+order.trackingNumber : ''}
  </div>
  <p>Expected delivery within 3-7 business days depending on your location.</p>
  <a href="https://sollene.site/account/orders" class="btn">Track Order</a>`);
  return sendWithRetry(() => resend.emails.send({ from: FROM, to: email, subject: `Your SOLLENE Order Has Shipped — #${order._id.toString().slice(-8).toUpperCase()}`, html }));
};

exports.sendDeliveryNotification = async (email, firstName, order) => {
  const html = layout(`<h1>Delivered!</h1>
  <p>Hi ${firstName || 'Customer'},</p>
  <p>Your SOLLENE order has been delivered. We hope you love your purchase!</p>
  <div class="info-box">
    <strong>Order #</strong> ${order._id.toString().slice(-8).toUpperCase()}<br>
    <strong>Delivered</strong> ${order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : 'Today'}
  </div>
  <p>If you're happy with your order, we'd love it if you left a review. Your feedback helps us improve and helps other customers make informed choices.</p>
  <a href="https://sollene.site/account/orders" class="btn">Leave a Review</a>`);
  return sendWithRetry(() => resend.emails.send({ from: FROM, to: email, subject: `Your SOLLENE Order Has Been Delivered — #${order._id.toString().slice(-8).toUpperCase()}`, html }));
};

exports.sendPaymentConfirmation = async (email, firstName, order) => {
  const html = layout(`<h1>Payment Confirmed</h1>
  <p>Hi ${firstName || 'Customer'},</p>
  <p>Your payment of <strong>₦${Number(order.total).toLocaleString()}</strong> for order <strong>#${order._id.toString().slice(-8).toUpperCase()}</strong> has been received successfully.</p>
  <div class="info-box">
    <strong>Amount</strong> ₦${Number(order.total).toLocaleString()}<br>
    <strong>Reference</strong> ${order.paymentReference || '—'}<br>
    <strong>Status</strong> Paid
  </div>
  <p>We'll begin processing your order right away.</p>`);
  return sendWithRetry(() => resend.emails.send({ from: FROM, to: email, subject: `Payment Confirmed — ₦${Number(order.total).toLocaleString()}`, html }));
};

exports.sendNewsletterWelcome = async (email, token) => {
  const html = layout(`<h1>You're In!</h1>
  <p>Thanks for subscribing to the SOLLENE newsletter.</p>
  <p>You'll now receive exclusive updates on new arrivals, special offers, and style inspiration straight to your inbox. No spam, just the good stuff.</p>
  <p style="font-size:13px;color:#999">If you ever want to unsubscribe, click <a href="https://sollene.site/api/newsletter/unsubscribe/${token}">here</a>.</p>`);
  return sendWithRetry(() => resend.emails.send({ from: FROM, to: email, subject: 'Welcome to SOLLENE Newsletter', html }));
};

exports.sendAbandonedCartReminder = async (email, firstName, items) => {
  const itemList = items.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>₦${Number(i.price).toLocaleString()}</td></tr>`).join('');
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const html = layout(`<h1>You Left Something Behind</h1>
  <p>Hi ${firstName || 'there'},</p>
  <p>You have items waiting in your cart. Don't miss out — complete your purchase now.</p>
  <table><tr><th>Item</th><th>Qty</th><th>Price</th></tr>${itemList}</table>
  <div style="text-align:right;font-size:18px;font-weight:700;margin:16px 0">Total: ₦${total.toLocaleString()}</div>
  <a href="https://sollene.site/checkout" class="btn">Complete Order</a>
  <p style="font-size:13px;color:#999">This cart is saved for 24 hours. After that, items may sell out.</p>`);
  return sendWithRetry(() => resend.emails.send({ from: FROM, to: email, subject: 'You Left Something Behind — Complete Your SOLLENE Order', html }));
};
