import asyncHandler from 'express-async-handler'
import User from '../models/User.js'
import generateToken from '../utils/generateToken.js'

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
    password
  })

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id)
    })
  } else {
    res.status(400)
    throw new Error('Invalid user data')
  }
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
      token: generateToken(user._id)
    })
  } else {
    res.status(401)
    throw new Error('Invalid email or password')
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

    const updatedUser = await user.save()

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
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