import express from 'express'
import { 
  getAdminStats, 
  getAdminAnalytics 
} from '../controllers/productController.js'
import { protect, admin } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/stats', protect, admin, getAdminStats)
router.get('/analytics', protect, admin, getAdminAnalytics)

export default router