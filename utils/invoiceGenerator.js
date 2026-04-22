export const generateInvoiceHTML = (order) => {
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const itemsRows = order.orderItems.map(item => {
    const itemTotal = item.price * item.quantity
    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #ddd;">
          <strong>${item.name}</strong><br>
          <small>Size: ${item.size} | Color: ${item.color}</small>
        </td>
        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #ddd;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #ddd;">₹${item.price.toFixed(2)}</td>
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #ddd;">₹${itemTotal.toFixed(2)}</td>
      </tr>
    `
  }).join('')

  const subtotal = order.itemsPrice || order.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shipping = order.shippingPrice || 0
  const discount = order.discountPrice || 0
  const tax = order.taxPrice || 0
  const total = order.totalPrice

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${order.orderNumber || order._id}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', 'Arial', sans-serif;
      background: #f5f5f5;
      padding: 40px 20px;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .invoice-header {
      background: linear-gradient(135deg, #0e0e10 0%, #1f1f22 100%);
      color: white;
      padding: 30px 40px;
    }
    .invoice-header h1 {
      font-size: 32px;
      font-weight: 900;
      font-style: italic;
      letter-spacing: -0.5px;
      margin-bottom: 10px;
    }
    .invoice-header .brand {
      color: #00eefc;
    }
    .invoice-details {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
      font-size: 14px;
    }
    .invoice-body {
      padding: 40px;
    }
    .section-title {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #666;
      margin-bottom: 15px;
      font-weight: 600;
    }
    .address-box {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    .address-box p {
      margin-bottom: 5px;
      color: #333;
    }
    .address-box .name {
      font-weight: 700;
      font-size: 16px;
      margin-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      text-align: left;
      padding: 12px;
      background: #f9f9f9;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      border-bottom: 2px solid #ddd;
    }
    .summary-table {
      width: 300px;
      margin-left: auto;
      margin-top: 20px;
    }
    .summary-table td {
      padding: 8px 0;
    }
    .summary-table .total-row {
      font-size: 18px;
      font-weight: 700;
      border-top: 2px solid #ddd;
      padding-top: 15px;
    }
    .total-amount {
      color: #00eefc;
      font-size: 24px;
    }
    .invoice-footer {
      padding: 20px 40px;
      background: #f9f9f9;
      text-align: center;
      color: #666;
      font-size: 12px;
      border-top: 1px solid #ddd;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .status-paid {
      background: #bcff5f20;
      color: #3d6100;
    }
    .status-pending {
      background: #ff6b9820;
      color: #a1004b;
    }
    .tracking-info {
      background: #00eefc10;
      border: 1px solid #00eefc30;
      border-radius: 12px;
      padding: 15px 20px;
      margin: 20px 0;
    }
    .tracking-info .label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
    }
    .tracking-info .number {
      font-family: 'Courier New', monospace;
      font-size: 18px;
      font-weight: 700;
      color: #00eefc;
    }
    @media print {
      body { background: white; padding: 0; }
      .invoice-container { box-shadow: none; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="invoice-header">
      <h1><span class="brand">RIVO</span> INVOICE</h1>
      <div class="invoice-details">
        <div>
          <div style="color: #aaa; font-size: 12px; margin-bottom: 5px;">Invoice Number</div>
          <div style="font-size: 18px; font-weight: 600;">${order.orderNumber || order._id.slice(-8).toUpperCase()}</div>
        </div>
        <div style="text-align: right;">
          <div style="color: #aaa; font-size: 12px; margin-bottom: 5px;">Order Date</div>
          <div style="font-size: 16px;">${orderDate}</div>
        </div>
      </div>
    </div>
    
    <div class="invoice-body">
      <div style="display: flex; gap: 30px;">
        <div style="flex: 1;">
          <div class="section-title">Bill To</div>
          <div class="address-box">
            <p class="name">${order.shippingAddress?.fullName || 'N/A'}</p>
            <p>${order.shippingAddress?.email || 'N/A'}</p>
            <p>${order.shippingAddress?.phone || 'N/A'}</p>
          </div>
        </div>
        <div style="flex: 1;">
          <div class="section-title">Ship To</div>
          <div class="address-box">
            <p class="name">${order.shippingAddress?.fullName || 'N/A'}</p>
            <p>${order.shippingAddress?.street || 'N/A'}</p>
            <p>${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.zipCode || ''}</p>
            <p>${order.shippingAddress?.country || 'N/A'}</p>
          </div>
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin: 20px 0;">
        <div class="section-title" style="margin: 0;">Order Items</div>
        <div>
          <span class="status-badge ${order.isPaid ? 'status-paid' : 'status-pending'}">
            ${order.isPaid ? 'PAID' : 'PAYMENT PENDING'}
          </span>
          <span class="status-badge" style="margin-left: 10px; background: ${order.status === 'delivered' ? '#bcff5f20' : '#8ff5ff20'}; color: ${order.status === 'delivered' ? '#3d6100' : '#005d63'};">
            ${order.status?.toUpperCase() || 'PENDING'}
          </span>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
      
      <table class="summary-table">
        <tr>
          <td style="color: #666;">Subtotal</td>
          <td style="text-align: right;">₹${subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="color: #666;">Shipping</td>
          <td style="text-align: right;">${shipping === 0 ? 'FREE' : '₹' + shipping.toFixed(2)}</td>
        </tr>
        ${discount > 0 ? `
        <tr>
          <td style="color: #00eefc;">Discount ${order.couponUsed ? '(' + order.couponUsed + ')' : ''}</td>
          <td style="text-align: right; color: #00eefc;">-₹${discount.toFixed(2)}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="color: #666;">Tax</td>
          <td style="text-align: right;">${tax === 0 ? 'FREE' : '₹' + tax.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td style="font-weight: 700; font-size: 16px; padding-top: 15px;">Total</td>
          <td style="text-align: right; font-weight: 700; padding-top: 15px;" class="total-amount">₹${total.toFixed(2)}</td>
        </tr>
      </table>
      
      ${order.trackingNumber ? `
      <div class="tracking-info">
        <div class="label">Tracking Number</div>
        <div class="number">${order.trackingNumber}</div>
      </div>
      ` : ''}
      
      ${order.customerNotes ? `
      <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 12px;">
        <div class="section-title" style="margin-bottom: 8px;">Order Notes</div>
        <p style="color: #666;">${order.customerNotes}</p>
      </div>
      ` : ''}
    </div>
    
    <div class="invoice-footer">
      <p style="margin-bottom: 8px;">Thank you for shopping with RIVO!</p>
      <p>RIVO DIGITAL • BEYOND THE GRID • WEAR YOUR IDENTITY</p>
      <p style="margin-top: 15px; font-size: 10px;">This is a computer generated invoice and does not require a signature.</p>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 30px;" class="no-print">
    <button onclick="window.print()" style="background: #00eefc; color: #005d63; border: none; padding: 12px 30px; border-radius: 30px; font-weight: 700; cursor: pointer; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">
      🖨️ Print Invoice
    </button>
    <button onclick="window.close()" style="background: transparent; border: 1px solid #ddd; padding: 12px 30px; border-radius: 30px; font-weight: 700; cursor: pointer; font-size: 14px; margin-left: 10px;">
      Close
    </button>
  </div>
</body>
</html>
  `
}