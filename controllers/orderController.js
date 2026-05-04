import asyncHandler from 'express-async-handler'
import Order from '../models/Order.js'
import Product from '../models/Product.js'

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    customerNotes,
    orderNumber
  } = req.body

  if (orderItems && orderItems.length === 0) {
    res.status(400)
    throw new Error('No order items')
  }

  // Update stock for each product
  for (const item of orderItems) {
    if (!item.isCustomized && item.product) {
      const product = await Product.findById(item.product)
      if (product) {
        product.stock = Math.max(0, product.stock - item.quantity)
        product.inStock = product.stock > 0
        await product.save()
      }
    }
  }

  const order = new Order({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    customerNotes,
    orderNumber: orderNumber || `RVO-${Date.now().toString().slice(-8)}`,
    status: 'pending'
  })

  const createdOrder = await order.save()
  res.status(201).json(createdOrder)
})

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email'
  )

  if (order && (order.user._id.toString() === req.user._id.toString() || req.user.role === 'admin')) {
    res.json(order)
  } else {
    res.status(404)
    throw new Error('Order not found')
  }
})

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)

  if (order) {
    order.isPaid = true
    order.paidAt = Date.now()
    order.status = 'processing'
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.email_address
    }

    const updatedOrder = await order.save()
    res.json(updatedOrder)
  } else {
    res.status(404)
    throw new Error('Order not found')
  }
})

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
export const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)

  if (order) {
    order.isDelivered = true
    order.deliveredAt = Date.now()
    order.status = 'delivered'

    const updatedOrder = await order.save()
    res.json(updatedOrder)
  } else {
    res.status(404)
    throw new Error('Order not found')
  }
})

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
  res.json(orders)
})

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = asyncHandler(async (req, res) => {
  const pageSize = 20
  const page = Number(req.query.page) || 1

  const count = await Order.countDocuments({})
  const orders = await Order.find({})
    .populate('user', 'id name email')
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 })

  res.json({
    orders,
    page,
    pages: Math.ceil(count / pageSize),
    total: count
  })
})

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)

  if (order) {
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401)
      throw new Error('Not authorized')
    }

    if (order.isDelivered) {
      res.status(400)
      throw new Error('Cannot cancel delivered order')
    }

    if (order.isPaid) {
      res.status(400)
      throw new Error('Cannot cancel paid order')
    }

    order.status = 'cancelled'
    
    // Restore stock
    for (const item of order.orderItems) {
      if (!item.isCustomized && item.product) {
        const product = await Product.findById(item.product)
        if (product) {
          product.stock += item.quantity
          product.inStock = true
          await product.save()
        }
      }
    }

    const updatedOrder = await order.save()
    res.json(updatedOrder)
  } else {
    res.status(404)
    throw new Error('Order not found')
  }
})

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, trackingNumber } = req.body
  const order = await Order.findById(req.params.id)

  if (order) {
    order.status = status || order.status
    
    if (trackingNumber) {
      order.trackingNumber = trackingNumber
    }
    
    if (status === 'delivered') {
      order.isDelivered = true
      order.deliveredAt = Date.now()
    }
    
    if (status === 'shipped' && trackingNumber) {
      order.trackingNumber = trackingNumber
    }
    
    if (status === 'processing') {
      order.status = 'processing'
    }

    const updatedOrder = await order.save()
    res.json(updatedOrder)
  } else {
    res.status(404)
    throw new Error('Order not found')
  }
})
