import express from 'express'
import { 
  registerUser, loginUser, getUserProfile, updateUserProfile,
  getUsers, deleteUser, getUserById, updateUser,
} from '../controllers/authController.js'
import { sendOTP, verifyOTP, resendOTP } from '../controllers/otpController.js'
import { protect, admin } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public routes
router.post('/register', registerUser)
router.post('/login', loginUser)

// OTP routes ✅ Make sure these are here
router.post('/send-otp', sendOTP)
router.post('/verify-otp', verifyOTP)
router.post('/resend-otp', resendOTP)

// Protected routes
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile)

// Admin routes
router.route('/users').get(protect, admin, getUsers)
router.route('/users/:id').get(protect, admin, getUserById).put(protect, admin, updateUser).delete(protect, admin, deleteUser)

export default router
