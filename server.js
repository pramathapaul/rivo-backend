import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from './config/db.js'
import { notFound, errorHandler } from './middleware/errorMiddleware.js'
import colors from 'colors'
import mongoose from 'mongoose'

// Route imports
import authRoutes from './routes/authRoutes.js'
import productRoutes from './routes/productRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import customRoutes from './routes/customRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import couponRoutes from './routes/couponRoutes.js'
import invoiceRoutes from './routes/invoiceRoutes.js'

dotenv.config()
connectDB()

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}))
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))
app.use(morgan('dev'))

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, '/uploads')))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/custom', customRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/coupons', couponRoutes)
app.use('/api/invoice', invoiceRoutes)

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 RIVO API is running...',
    version: '1.0.0',
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  })
})

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`.cyan)
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.cyan.bold)
  console.log(`📡 API available at http://localhost:${PORT}`.yellow)
  console.log(`${'='.repeat(50)}\n`.cyan)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`.red.bold)
  server.close(() => process.exit(1))
})

export default app