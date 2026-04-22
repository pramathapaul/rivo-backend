import express from 'express'
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getTopProducts,
  getFeaturedProducts,
  bulkDeleteProducts,
  bulkUpdateStock,
  searchProducts,
  getProductCategories,
  updateProductStock
} from '../controllers/productController.js'
import { protect, admin } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public routes
router.get('/', getProducts)
router.get('/search', searchProducts)
router.get('/top', getTopProducts)
router.get('/featured', getFeaturedProducts)
router.get('/categories', getProductCategories)
router.get('/:id', getProductById)

// Protected routes (require login)
router.post('/:id/reviews', protect, createProductReview)

// Admin routes (require admin)
router.post('/', protect, admin, createProduct)
router.put('/:id', protect, admin, updateProduct)
router.delete('/:id', protect, admin, deleteProduct)
router.put('/:id/stock', protect, admin, updateProductStock)
router.post('/bulk-delete', protect, admin, bulkDeleteProducts)
router.post('/bulk-update-stock', protect, admin, bulkUpdateStock)
router.get('/search', searchProducts)

export default router