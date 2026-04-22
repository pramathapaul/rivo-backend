import mongoose from 'mongoose'

const customDesignSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  baseProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  designName: {
    type: String,
    default: 'Custom Design'
  },
  baseColor: {
    type: String,
    required: true
  },
  customText: {
    text: String,
    font: String,
    color: String,
    size: Number,
    position: {
      x: Number,
      y: Number
    },
    effect: String
  },
  uploadedImages: [{
    url: String,
    position: {
      x: Number,
      y: Number
    },
    scale: Number,
    rotation: Number
  }],
  previewImage: String,
  totalPrice: Number,
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'in-production', 'completed'],
    default: 'draft'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

const CustomDesign = mongoose.model('CustomDesign', customDesignSchema)
export default CustomDesign