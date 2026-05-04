import asyncHandler from 'express-async-handler'
import crypto from 'crypto'
import User from '../models/User.js'
import generateToken from '../utils/generateToken.js'
import sendEmail from '../utils/sendEmail.js'

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body

  const userExists = await User.findOne({ email })

  if (userExists) {
    res.status(400)
    throw new Error('User already exists')
  }

  const user = await User.create({
    name,
    email,
    password,
    isVerified: false
  })

  const verificationToken = user.generateVerificationToken()
  await user.save({ validateBeforeSave: false })

  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`

  // Try to send email
  let emailSent = false
  try {
    await sendEmail({
      email: user.email,
      subject: 'Verify Your Email - RIVO',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: #0e0e10; padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: #00eefc; font-style: italic; font-size: 32px; margin: 0;">RIVO</h1>
            <p style="color: #f9f5f8;">Wear Your Identity</p>
          </div>
          <div style="background: #1f1f22; padding: 30px; border-radius: 0 0 16px 16px; color: #f9f5f8;">
            <h2 style="color: #00eefc;">Verify Your Email</h2>
            <p style="color: #adaaad;">Hey ${user.name},</p>
            <p style="color: #adaaad;">Click below to verify your email:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background: #00eefc; color: #005d63; padding: 14px 40px; border-radius: 30px; text-decoration: none; font-weight: 700;">Verify Email</a>
            </div>
            <p style="color: #767577; font-size: 12px;">Link expires in 24 hours.</p>
          </div>
        </div>
      `
    })
    emailSent = true
    console.log('✅ Verification email sent to:', user.email)
  } catch (emailError) {
    console.error('❌ Email sending failed:', emailError.message)
    console.log('📧 Verification URL (for testing):', verificationUrl)
  }

  // For development: always show the verification link in response
  const response = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: false,
    token: generateToken(user._id),
    message: emailSent 
      ? 'Verification email sent! Please check your inbox.' 
      : 'Account created! Use the verification link to verify your email.',
    verificationUrl: process.env.NODE_ENV === 'development' ? verificationUrl : undefined
  }

  res.status(201).json(response)
})

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email }).select('+password')

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
      token: generateToken(user._id)
    })
  } else {
    res.status(401)
    throw new Error('Invalid email or password')
  }
})

// @desc    Verify email
// @route   POST /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationTokenExpire: { $gt: Date.now() }
  })

  if (!user) {
    res.status(400)
    throw new Error('Invalid or expired verification token')
  }

  user.isVerified = true
  user.verifiedAt = Date.now()
  user.verificationToken = undefined
  user.verificationTokenExpire = undefined
  await user.save({ validateBeforeSave: false })

  res.json({
    message: 'Email verified successfully!',
    isVerified: true
  })
})

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
export const resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  if (user.isVerified) {
    res.status(400)
    throw new Error('Email already verified')
  }

  const verificationToken = user.generateVerificationToken()
  await user.save({ validateBeforeSave: false })

  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`

  try {
    await sendEmail({
      email: user.email,
      subject: 'Verify Your Email - RIVO',
      html: `<h2>Verify your email</h2><p>Click <a href="${verificationUrl}">here</a> to verify.</p>`
    })
    res.json({ message: 'Verification email resent!' })
  } catch (error) {
    res.status(500)
    throw new Error('Email could not be sent')
  }
})

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
      addresses: user.addresses,
      wishlist: user.wishlist,
      createdAt: user.createdAt
    })
  } else {
    res.status(404)
    throw new Error('User not found')
  }
})

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (user) {
    user.name = req.body.name || user.name
    user.email = req.body.email || user.email
    user.avatar = req.body.avatar || user.avatar
    
    if (req.body.password) {
      user.password = req.body.password
    }

    if (req.body.addresses) {
      user.addresses = req.body.addresses
    }

    const updatedUser = await user.save()

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      isVerified: updatedUser.isVerified,
      addresses: updatedUser.addresses,
      token: generateToken(updatedUser._id)
    })
  } else {
    res.status(404)
    throw new Error('User not found')
  }
})

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res) => {
  const pageSize = 10
  const page = Number(req.query.page) || 1

  const count = await User.countDocuments({})
  const users = await User.find({})
    .select('-password')
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 })

  res.json({
    users,
    page,
    pages: Math.ceil(count / pageSize),
    total: count
  })
})

// @desc    Get user by ID
// @route   GET /api/auth/users/:id
// @access  Private/Admin
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password')

  if (user) {
    res.json(user)
  } else {
    res.status(404)
    throw new Error('User not found')
  }
})

// @desc    Update user
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (user) {
    user.name = req.body.name || user.name
    user.email = req.body.email || user.email
    user.role = req.body.role || user.role
    user.isVerified = req.body.isVerified !== undefined ? req.body.isVerified : user.isVerified

    const updatedUser = await user.save()

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isVerified: updatedUser.isVerified
    })
  } else {
    res.status(404)
    throw new Error('User not found')
  }
})

// @desc    Delete user
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (user) {
    if (user.role === 'admin') {
      res.status(400)
      throw new Error('Cannot delete admin user')
    }
    await User.deleteOne({ _id: req.params.id })
    res.json({ message: 'User removed' })
  } else {
    res.status(404)
    throw new Error('User not found')
  }
})
