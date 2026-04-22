import express from 'express'
import {
  createOrder,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  cancelOrder,
  updateOrderStatus
} from '../controllers/orderController.js'
import { protect, admin } from '../middleware/authMiddleware.js'

const router = express.Router()

router.route('/')
  .post(protect, createOrder)
  .get(protect, admin, getOrders)

router.route('/myorders')
  .get(protect, getMyOrders)

router.route('/:id')
  .get(protect, getOrderById)

router.route('/:id/pay')
  .put(protect, updateOrderToPaid)

router.route('/:id/deliver')
  .put(protect, admin, updateOrderToDelivered)

router.route('/:id/cancel')
  .put(protect, cancelOrder)

// Add this route for updating order status
router.route('/:id/status')
  .put(protect, admin, updateOrderStatus)

export default router