import asyncHandler from 'express-async-handler'
import Product from '../models/Product.js'
import Order from '../models/Order.js'
import User from '../models/User.js'

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = asyncHandler(async (req, res) => {
  const pageSize = 12
  const page = Number(req.query.page) || 1

  const keyword = req.query.keyword
    ? { name: { $regex: req.query.keyword, $options: 'i' } }
    : {}

  const category = req.query.category ? { category: req.query.category } : {}
  const inStock = req.query.inStock === 'true' ? { inStock: true } : {}

  const count = await Product.countDocuments({ ...keyword, ...category, ...inStock })
  
  const products = await Product.find({ ...keyword, ...category, ...inStock })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 })

  res.json({
    products,
    page,
    pages: Math.ceil(count / pageSize),
    total: count
  })
})

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)

  if (product) {
    res.json(product)
  } else {
    res.status(404)
    throw new Error('Product not found')
  }
})

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    originalPrice,
    description,
    images,
    category,
    stock,
    inStock,
    colors,
    sizes,
    tags,
    featured,
    customizationAvailable
  } = req.body

  const product = new Product({
    name: name || 'Sample Product',
    price: price || 0,
    originalPrice: originalPrice || null,
    user: req.user._id,
    images: images || ['/images/sample.jpg'],
    category: category || 'Essential',
    stock: stock || 0,
    inStock: inStock !== undefined ? inStock : true,
    description: description || 'Sample description',
    colors: colors || [{ name: 'Black', value: '#0e0e10' }],
    sizes: sizes || ['S', 'M', 'L', 'XL'],
    tags: tags || [],
    featured: featured || false,
    customizationAvailable: customizationAvailable !== undefined ? customizationAvailable : true
  })

  const createdProduct = await product.save()
  res.status(201).json(createdProduct)
})

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    originalPrice,
    description,
    images,
    category,
    stock,
    inStock,
    colors,
    sizes,
    tags,
    featured,
    customizationAvailable
  } = req.body

  const product = await Product.findById(req.params.id)

  if (product) {
    product.name = name !== undefined ? name : product.name
    product.price = price !== undefined ? price : product.price
    product.originalPrice = originalPrice !== undefined ? originalPrice : product.originalPrice
    product.description = description !== undefined ? description : product.description
    product.images = images !== undefined ? images : product.images
    product.category = category !== undefined ? category : product.category
    product.stock = stock !== undefined ? stock : product.stock
    product.inStock = inStock !== undefined ? inStock : product.inStock
    product.colors = colors !== undefined ? colors : product.colors
    product.sizes = sizes !== undefined ? sizes : product.sizes
    product.tags = tags !== undefined ? tags : product.tags
    product.featured = featured !== undefined ? featured : product.featured
    product.customizationAvailable = customizationAvailable !== undefined ? customizationAvailable : product.customizationAvailable

    const updatedProduct = await product.save()
    res.json(updatedProduct)
  } else {
    res.status(404)
    throw new Error('Product not found')
  }
})

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)

  if (product) {
    await Product.deleteOne({ _id: req.params.id })
    res.json({ message: 'Product removed' })
  } else {
    res.status(404)
    throw new Error('Product not found')
  }
})

// @desc    Create product review
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body

  const product = await Product.findById(req.params.id)

  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    )

    if (alreadyReviewed) {
      res.status(400)
      throw new Error('Product already reviewed')
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id
    }

    product.reviews.push(review)
    product.numReviews = product.reviews.length
    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length

    await product.save()
    res.status(201).json({ message: 'Review added' })
  } else {
    res.status(404)
    throw new Error('Product not found')
  }
})

// @desc    Get top rated products
// @route   GET /api/products/top
// @access  Public
export const getTopProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).sort({ rating: -1 }).limit(5)
  res.json(products)
})

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ featured: true, inStock: true }).limit(8)
  res.json(products)
})

// @desc    Bulk delete products
// @route   POST /api/products/bulk-delete
// @access  Private/Admin
export const bulkDeleteProducts = asyncHandler(async (req, res) => {
  const { ids } = req.body
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400)
    throw new Error('Please provide product IDs')
  }

  const result = await Product.deleteMany({ _id: { $in: ids } })
  res.json({ 
    message: `${result.deletedCount} products deleted`,
    deletedCount: result.deletedCount
  })
})

// @desc    Bulk update stock
// @route   POST /api/products/bulk-update-stock
// @access  Private/Admin
export const bulkUpdateStock = asyncHandler(async (req, res) => {
  const { updates } = req.body
  
  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    res.status(400)
    throw new Error('Please provide stock updates')
  }

  const results = []
  for (const update of updates) {
    if (update.id && update.stock !== undefined) {
      const product = await Product.findByIdAndUpdate(
        update.id, 
        { 
          stock: update.stock,
          inStock: update.stock > 0
        },
        { new: true }
      )
      if (product) {
        results.push({ id: update.id, stock: product.stock, inStock: product.inStock })
      }
    }
  }
  
  res.json({ 
    message: `${results.length} products updated`,
    results 
  })
})

// @desc    Get admin stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = asyncHandler(async (req, res) => {
  const totalProducts = await Product.countDocuments()
  const totalOrders = await Order.countDocuments()
  const totalUsers = await User.countDocuments()
  
  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'name email')
  
  const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
    .limit(10)
  
  const revenue = await Order.aggregate([
    { $match: { isPaid: true } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
  ])
  
  const monthlyRevenue = await Order.aggregate([
    { $match: { isPaid: true } },
    {
      $group: {
        _id: { 
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        total: { $sum: '$totalPrice' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 6 }
  ])

  // Format monthly revenue for frontend
  const formattedMonthlyRevenue = monthlyRevenue.map(item => ({
    _id: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
    total: item.total,
    count: item.count
  })).reverse()

  // Get orders by status
  const ordersByStatus = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ])

  res.json({
    totalProducts,
    totalOrders,
    totalUsers,
    totalRevenue: revenue[0]?.total || 0,
    recentOrders,
    lowStockProducts,
    monthlyRevenue: formattedMonthlyRevenue,
    ordersByStatus
  })
})

// @desc    Get admin analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
export const getAdminAnalytics = asyncHandler(async (req, res) => {
  const { range = '30days' } = req.query
  
  const now = new Date()
  let startDate = new Date()
  
  switch(range) {
    case '7days':
      startDate.setDate(now.getDate() - 7)
      break
    case '90days':
      startDate.setDate(now.getDate() - 90)
      break
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1)
      break
    default:
      startDate.setDate(now.getDate() - 30)
  }

  // Top selling products
  const topProducts = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate }, isPaid: true } },
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: '$orderItems.product',
        name: { $first: '$orderItems.name' },
        totalSold: { $sum: '$orderItems.quantity' },
        revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 }
  ])

  // Daily sales for the period
  const dailySales = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate }, isPaid: true } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: '$totalPrice' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ])

  // Top customers
  const topCustomers = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate }, isPaid: true } },
    {
      $group: {
        _id: '$user',
        totalSpent: { $sum: '$totalPrice' },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 1,
        totalSpent: 1,
        orderCount: 1,
        'user.name': 1,
        'user.email': 1
      }
    }
  ])

  res.json({
    topProducts,
    dailySales,
    topCustomers,
    dateRange: { 
      start: startDate.toISOString(), 
      end: now.toISOString() 
    }
  })
})

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Public
export const getProductCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category')
  res.json(categories)
})

// @desc    Update product stock
// @route   PUT /api/products/:id/stock
// @access  Private/Admin
export const updateProductStock = asyncHandler(async (req, res) => {
  const { stock } = req.body
  
  const product = await Product.findById(req.params.id)
  
  if (product) {
    product.stock = stock
    product.inStock = stock > 0
    
    const updatedProduct = await product.save()
    res.json({
      _id: updatedProduct._id,
      name: updatedProduct.name,
      stock: updatedProduct.stock,
      inStock: updatedProduct.inStock
    })
  } else {
    res.status(404)
    throw new Error('Product not found')
  }
})

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
export const searchProducts = asyncHandler(async (req, res) => {
  const { q, category, limit = 20 } = req.query
  
  if (!q || q.trim() === '') {
    return res.json({ products: [], count: 0 })
  }
  
  const searchRegex = { $regex: q, $options: 'i' }
  
  let query = {
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { category: searchRegex },
      { tags: searchRegex }
    ]
  }
  
  if (category && category !== 'All') {
    query.category = category
  }
  
  const products = await Product.find(query)
    .limit(Number(limit))
    .select('name price images category inStock')
  
  res.json({
    products,
    count: products.length,
    query: q
  })
})