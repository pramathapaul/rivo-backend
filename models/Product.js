import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price must be positive']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price must be positive']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['Heavyweight Cotton', 'Limited Edition', 'Tech-Mesh Blend', 'Luxury Jersey', 'Merchandise', 'Essential']
  },
  images: [{
    type: String,
    required: true
  }],
  sizes: [{
    type: String,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    default: ['S', 'M', 'L', 'XL']
  }],
  colors: [{
    name: String,
    value: String
  }],
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  inStock: {
    type: Boolean,
    default: true
  },
  tags: [String],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0
  },
  reviews: [reviewSchema],
  featured: {
    type: Boolean,
    default: false
  },
  customizationAvailable: {
    type: Boolean,
    default: true
  },
  customizationBasePrice: {
    type: Number,
    default: 25
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

const Product = mongoose.model('Product', productSchema)
export default Product