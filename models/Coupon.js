import mongoose from 'mongoose'

const couponUsageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usedAt: {
    type: Date,
    default: Date.now
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }
})

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  maxDiscount: {
    type: Number,
    default: null
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: null  // Total usage limit across all users
  },
  usedCount: {
    type: Number,
    default: 0
  },
  perUserLimit: {
    type: Number,
    default: 1  // How many times a single user can use this coupon
  },
  userUsages: [couponUsageSchema],  // Track which users used it and when
  isActive: {
    type: Boolean,
    default: true
  },
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: String
  }],
  userSpecific: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  firstTimeOnly: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Check if user can use this coupon
couponSchema.methods.canUserUse = function(userId) {
  // Count how many times this user has used this coupon
  const userUsageCount = this.userUsages.filter(
    usage => usage.user.toString() === userId.toString()
  ).length
  
  return userUsageCount < this.perUserLimit
}

// Get remaining uses for a user
couponSchema.methods.getRemainingUses = function(userId) {
  const userUsageCount = this.userUsages.filter(
    usage => usage.user.toString() === userId.toString()
  ).length
  
  return Math.max(0, this.perUserLimit - userUsageCount)
}

// Check if coupon is valid (updated)
couponSchema.methods.isValid = function(userId, orderAmount, hasOrderedBefore) {
  const now = new Date()
  
  if (!this.isActive) return { valid: false, message: 'Coupon is inactive' }
  if (now < this.startDate) return { valid: false, message: 'Coupon not yet started' }
  if (now > this.endDate) return { valid: false, message: 'Coupon has expired' }
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'Coupon usage limit reached' }
  }
  if (orderAmount < this.minOrderAmount) {
    return { valid: false, message: `Minimum order amount of ₹${this.minOrderAmount} required` }
  }
  if (this.firstTimeOnly && hasOrderedBefore) {
    return { valid: false, message: 'This coupon is for first-time customers only' }
  }
  
  // Check per-user limit
  if (userId) {
    const userUsageCount = this.userUsages.filter(
      usage => usage.user.toString() === userId.toString()
    ).length
    
    if (userUsageCount >= this.perUserLimit) {
      return { 
        valid: false, 
        message: `You have already used this coupon ${userUsageCount} time(s). Limit is ${this.perUserLimit}.` 
      }
    }
  }
  
  return { valid: true, message: 'Coupon applied successfully' }
}

const Coupon = mongoose.model('Coupon', couponSchema)
export default Coupon