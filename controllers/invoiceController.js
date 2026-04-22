import asyncHandler from 'express-async-handler'
import Order from '../models/Order.js'
import { generateInvoiceHTML } from '../utils/invoiceGenerator.js'

// @desc    Generate and download invoice
// @route   GET /api/invoice/:id
// @access  Private
export const getInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email')

  if (!order) {
    res.status(404)
    throw new Error('Order not found')
  }

  // Check if user owns the order or is admin
  const isOwner = order.user._id.toString() === req.user._id.toString()
  const isAdmin = req.user.role === 'admin'

  if (!isOwner && !isAdmin) {
    res.status(403)
    throw new Error('Not authorized to view this invoice')
  }

  const invoiceHTML = generateInvoiceHTML(order)

  // Check if client wants JSON or HTML
  const format = req.query.format || 'html'
  
  if (format === 'json') {
    res.json({
      orderNumber: order.orderNumber || order._id,
      orderDate: order.createdAt,
      customer: order.shippingAddress,
      items: order.orderItems,
      summary: {
        subtotal: order.itemsPrice,
        shipping: order.shippingPrice,
        discount: order.discountPrice,
        tax: order.taxPrice,
        total: order.totalPrice
      },
      status: order.status,
      isPaid: order.isPaid,
      trackingNumber: order.trackingNumber
    })
  } else {
    res.send(invoiceHTML)
  }
})