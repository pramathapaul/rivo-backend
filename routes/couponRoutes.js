import express from 'express'
import {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  applyCoupon,
  getActiveCoupons
} from '../controllers/couponController.js'
import { protect, admin } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public routes
router.get('/active', getActiveCoupons)
router.post('/validate', validateCoupon)
router.post('/apply', protect, applyCoupon)

// Admin routes
router.route('/')
  .get(protect, admin, getCoupons)
  .post(protect, admin, createCoupon)

router.route('/:id')
  .get(protect, admin, getCouponById)
  .put(protect, admin, updateCoupon)
  .delete(protect, admin, deleteCoupon)

export default router