import express from 'express'
import upload from '../middleware/uploadMiddleware.js'
import { protect } from '../middleware/authMiddleware.js'
import path from 'path'
import fs from 'fs'

const router = express.Router()

router.post('/', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400)
    throw new Error('No file uploaded')
  }
  res.json({
    message: 'Image uploaded successfully',
    image: `/${req.file.path.replace(/\\/g, '/')}`
  })
})

router.post('/multiple', protect, upload.array('images', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400)
    throw new Error('No files uploaded')
  }
  const images = req.files.map(file => `/${file.path.replace(/\\/g, '/')}`)
  res.json({
    message: 'Images uploaded successfully',
    images
  })
})

// Delete uploaded file
router.delete('/:filename', protect, (req, res) => {
  const filePath = path.join('uploads', req.params.filename)
  
  fs.unlink(filePath, (err) => {
    if (err) {
      res.status(404)
      throw new Error('File not found')
    }
    res.json({ message: 'File deleted successfully' })
  })
})

export default router