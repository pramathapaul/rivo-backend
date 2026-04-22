import asyncHandler from 'express-async-handler'
import CustomDesign from '../models/CustomDesign.js'
import Product from '../models/Product.js'

// @desc    Create custom design
// @route   POST /api/custom
// @access  Private
export const createCustomDesign = asyncHandler(async (req, res) => {
  const {
    baseProduct,
    designName,
    baseColor,
    customText,
    uploadedImages,
    previewImage,
    totalPrice
  } = req.body

  const product = await Product.findById(baseProduct)
  if (!product) {
    res.status(404)
    throw new Error('Product not found')
  }

  const customDesign = await CustomDesign.create({
    user: req.user._id,
    baseProduct,
    designName,
    baseColor,
    customText,
    uploadedImages,
    previewImage,
    totalPrice: totalPrice || product.price + product.customizationBasePrice
  })

  res.status(201).json(customDesign)
})

// @desc    Get user's custom designs
// @route   GET /api/custom
// @access  Private
export const getMyCustomDesigns = asyncHandler(async (req, res) => {
  const designs = await CustomDesign.find({ user: req.user._id })
    .populate('baseProduct', 'name price images')
    .sort({ createdAt: -1 })

  res.json(designs)
})

// @desc    Get custom design by ID
// @route   GET /api/custom/:id
// @access  Private
export const getCustomDesignById = asyncHandler(async (req, res) => {
  const design = await CustomDesign.findById(req.params.id)
    .populate('baseProduct', 'name price images category')

  if (design && design.user.toString() === req.user._id.toString()) {
    res.json(design)
  } else {
    res.status(404)
    throw new Error('Design not found')
  }
})

// @desc    Update custom design
// @route   PUT /api/custom/:id
// @access  Private
export const updateCustomDesign = asyncHandler(async (req, res) => {
  const design = await CustomDesign.findById(req.params.id)

  if (design && design.user.toString() === req.user._id.toString()) {
    design.designName = req.body.designName || design.designName
    design.baseColor = req.body.baseColor || design.baseColor
    design.customText = req.body.customText || design.customText
    design.uploadedImages = req.body.uploadedImages || design.uploadedImages
    design.previewImage = req.body.previewImage || design.previewImage
    design.totalPrice = req.body.totalPrice || design.totalPrice

    const updatedDesign = await design.save()
    res.json(updatedDesign)
  } else {
    res.status(404)
    throw new Error('Design not found')
  }
})

// @desc    Delete custom design
// @route   DELETE /api/custom/:id
// @access  Private
export const deleteCustomDesign = asyncHandler(async (req, res) => {
  const design = await CustomDesign.findById(req.params.id)

  if (design && design.user.toString() === req.user._id.toString()) {
    await CustomDesign.deleteOne({ _id: req.params.id })
    res.json({ message: 'Design removed' })
  } else {
    res.status(404)
    throw new Error('Design not found')
  }
})

// @desc    Submit custom design for production
// @route   PUT /api/custom/:id/submit
// @access  Private
export const submitCustomDesign = asyncHandler(async (req, res) => {
  const design = await CustomDesign.findById(req.params.id)

  if (design && design.user.toString() === req.user._id.toString()) {
    design.status = 'submitted'
    const updatedDesign = await design.save()
    res.json(updatedDesign)
  } else {
    res.status(404)
    throw new Error('Design not found')
  }
})