import asyncHandler from 'express-async-handler'
import Coupon from '../models/Coupon.js'
import Order from '../models/Order.js'
import User from '../models/User.js'

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons
// @access  Private/Admin
export const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({}).sort({ createdAt: -1 })
  res.json(coupons)
})

// @desc    Get active coupons (Public)
// @route   GET /api/coupons/active
// @access  Public
export const getActiveCoupons = asyncHandler(async (req, res) => {
  const now = new Date()
  const coupons = await Coupon.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).select('code description discountType discountValue minOrderAmount maxDiscount')
  res.json(coupons)
})

// @desc    Get single coupon
// @route   GET /api/coupons/:id
// @access  Private/Admin
export const getCouponById = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id)
  if (coupon) {
    res.json(coupon)
  } else {
    res.status(404)
    throw new Error('Coupon not found')
  }
})

// @desc    Create coupon
// @route   POST /api/coupons
// @access  Private/Admin
export const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscount,
    startDate,
    endDate,
    usageLimit,
    perUserLimit,
    applicableProducts,
    applicableCategories,
    userSpecific,
    firstTimeOnly
  } = req.body

  const couponExists = await Coupon.findOne({ code: code.toUpperCase() })
  if (couponExists) {
    res.status(400)
    throw new Error('Coupon code already exists')
  }

  const coupon = await Coupon.create({
    code: code.toUpperCase(),
    description,
    discountType,
    discountValue,
    minOrderAmount: minOrderAmount || 0,
    maxDiscount,
    startDate,
    endDate,
    usageLimit,
    perUserLimit: perUserLimit || 1,
    applicableProducts,
    applicableCategories,
    userSpecific,
    firstTimeOnly: firstTimeOnly || false
  })

  res.status(201).json(coupon)
})

// @desc    Update coupon
// @route   PUT /api/coupons/:id
// @access  Private/Admin
export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id)

  if (coupon) {
    coupon.code = req.body.code || coupon.code
    coupon.description = req.body.description || coupon.description
    coupon.discountType = req.body.discountType || coupon.discountType
    coupon.discountValue = req.body.discountValue || coupon.discountValue
    coupon.minOrderAmount = req.body.minOrderAmount !== undefined ? req.body.minOrderAmount : coupon.minOrderAmount
    coupon.maxDiscount = req.body.maxDiscount !== undefined ? req.body.maxDiscount : coupon.maxDiscount
    coupon.startDate = req.body.startDate || coupon.startDate
    coupon.endDate = req.body.endDate || coupon.endDate
    coupon.usageLimit = req.body.usageLimit || coupon.usageLimit
    coupon.perUserLimit = req.body.perUserLimit || coupon.perUserLimit
    coupon.isActive = req.body.isActive !== undefined ? req.body.isActive : coupon.isActive
    coupon.applicableProducts = req.body.applicableProducts || coupon.applicableProducts
    coupon.applicableCategories = req.body.applicableCategories || coupon.applicableCategories
    coupon.userSpecific = req.body.userSpecific || coupon.userSpecific
    coupon.firstTimeOnly = req.body.firstTimeOnly !== undefined ? req.body.firstTimeOnly : coupon.firstTimeOnly

    const updatedCoupon = await coupon.save()
    res.json(updatedCoupon)
  } else {
    res.status(404)
    throw new Error('Coupon not found')
  }
})

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id)

  if (coupon) {
    await coupon.deleteOne()
    res.json({ message: 'Coupon removed' })
  } else {
    res.status(404)
    throw new Error('Coupon not found')
  }
})

// @desc    Validate coupon
// @route   POST /api/coupons/validate
// @access  Public
export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, orderAmount } = req.body

  if (!code) {
    res.status(400)
    throw new Error('Please provide a coupon code')
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase() })

  if (!coupon) {
    res.status(404)
    throw new Error('Invalid coupon code')
  }

  // Check if user has ordered before (for firstTimeOnly)
  let hasOrderedBefore = false
  if (req.user) {
    const orderCount = await Order.countDocuments({ user: req.user._id })
    hasOrderedBefore = orderCount > 0
  }

  const validation = coupon.isValid(req.user?._id, orderAmount, hasOrderedBefore)

  if (!validation.valid) {
    res.status(400)
    throw new Error(validation.message)
  }

  // Calculate discount
  let discountAmount = 0
  if (coupon.discountType === 'percentage') {
    discountAmount = (orderAmount * coupon.discountValue) / 100
    if (coupon.maxDiscount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount)
    }
  } else {
    discountAmount = Math.min(coupon.discountValue, orderAmount)
  }

  res.json({
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalAmount: Math.round((orderAmount - discountAmount) * 100) / 100,
    message: `Coupon applied! You saved ₹${Math.round(discountAmount * 100) / 100}`
  })
})

// @desc    Apply coupon (increment usage and track user)
// @route   POST /api/coupons/apply
// @access  Private
export const applyCoupon = asyncHandler(async (req, res) => {
  const { code, orderId } = req.body

  const coupon = await Coupon.findOne({ code: code.toUpperCase() })

  if (!coupon) {
    res.status(404)
    throw new Error('Coupon not found')
  }

  // Check if user can use this coupon
  if (!coupon.canUserUse(req.user._id)) {
    const used = coupon.userUsages.filter(u => u.user.toString() === req.user._id.toString()).length
    res.status(400)
    throw new Error(`You have already used this coupon ${used} time(s). Limit is ${coupon.perUserLimit}.`)
  }

  // Add user usage record
  coupon.userUsages.push({
    user: req.user._id,
    orderId: orderId || null,
    usedAt: new Date()
  })
  
  // Increment total used count
  coupon.usedCount += 1
  
  await coupon.save()
  
  res.json({ 
    message: 'Coupon applied successfully', 
    code: coupon.code,
    remainingUses: coupon.getRemainingUses(req.user._id)
  })
})