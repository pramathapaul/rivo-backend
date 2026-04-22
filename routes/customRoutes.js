import express from 'express'
import {
  createCustomDesign,
  getMyCustomDesigns,
  getCustomDesignById,
  updateCustomDesign,
  deleteCustomDesign,
  submitCustomDesign
} from '../controllers/customController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.route('/')
  .post(protect, createCustomDesign)
  .get(protect, getMyCustomDesigns)

router.route('/:id')
  .get(protect, getCustomDesignById)
  .put(protect, updateCustomDesign)
  .delete(protect, deleteCustomDesign)

router.route('/:id/submit')
  .put(protect, submitCustomDesign)

export default router