import express from 'express'
import { getInvoice } from '../controllers/invoiceController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/:id', protect, getInvoice)

export default router