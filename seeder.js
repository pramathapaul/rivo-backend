import mongoose from 'mongoose'
import dotenv from 'dotenv'
import colors from 'colors'
import bcrypt from 'bcryptjs'
import User from './models/User.js'
import Product from './models/Product.js'
import Order from './models/Order.js'

dotenv.config()

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'rivo'
    })
    console.log(`✅ MongoDB Atlas Connected for Seeding`.green)
  } catch (error) {
    console.error(`❌ Connection Error: ${error.message}`.red)
    process.exit(1)
  }
}

// Sample products data
const sampleProducts = [
  {
    name: "CYBER_CORE 01",
    price: 85,
    description: "Premium black heavyweight oversized t-shirt with high-detail digital circuit board print in reflective silver ink. Constructed from 400GSM heavy-weight cotton.",
    category: "Heavyweight Cotton",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600",
      "https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=600",
      "https://images.unsplash.com/photo-1503342217505-b0a26ec469fb?w=600"
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Core Black", value: "#0e0e10" },
      { name: "Void", value: "#1e1e24" },
      { name: "Dark Steel", value: "#2a303c" }
    ],
    stock: 50,
    inStock: true,
    tags: ["Limited", "Bestseller"],
    featured: true,
    rating: 4.8,
    numReviews: 24,
    customizationAvailable: true
  },
  {
    name: "GHOST_SHELL",
    price: 95,
    description: "Limited edition oversized white streetwear t-shirt with minimalist glitch art graphics on the chest.",
    category: "Limited Edition",
    images: [
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600",
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600"
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Ghost White", value: "#F5F5F5" }
    ],
    stock: 0,
    inStock: false,
    tags: ["Sold Out", "Limited Edition"],
    featured: true,
    rating: 4.9,
    numReviews: 18,
    customizationAvailable: false
  },
  {
    name: "NEON_GRID V2",
    price: 120,
    description: "Dark charcoal t-shirt with glowing neon grid pattern on shoulders. Urban futuristic fashion.",
    category: "Tech-Mesh Blend",
    images: [
      "https://images.unsplash.com/photo-1554568218-0f1715e72254?w=600",
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600"
    ],
    sizes: ["M", "L", "XL", "XXL"],
    colors: [
      { name: "Charcoal", value: "#2a2a2a" },
      { name: "Midnight", value: "#1a1a2e" },
      { name: "Neon Cyan", value: "#00eefc" }
    ],
    stock: 30,
    inStock: true,
    tags: ["New", "Trending"],
    featured: true,
    rating: 4.7,
    numReviews: 15,
    customizationAvailable: true
  },
  {
    name: "DATA_STREAM",
    price: 75,
    description: "Black designer t-shirt featuring vertical typography in Japanese characters with a digital rain effect.",
    category: "Luxury Jersey",
    images: [
      "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600",
      "https://images.unsplash.com/photo-1574180045827-681f8a1a962e?w=600"
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Black", value: "#0a0a0a" },
      { name: "Navy", value: "#1a1a3e" }
    ],
    stock: 45,
    inStock: true,
    tags: ["Trending", "Staff Pick"],
    featured: true,
    rating: 4.6,
    numReviews: 22,
    customizationAvailable: true
  },
  {
    name: "VOID CORE",
    price: 180,
    originalPrice: 240,
    description: "Constructed from 400GSM heavy-weight cotton with custom cyber-stitch embroidery.",
    category: "Archive 01",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600",
      "https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=600"
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Core Black", value: "#0e0e10" },
      { name: "Void", value: "#1e1e24" },
      { name: "Dark Steel", value: "#2a303c" }
    ],
    stock: 20,
    inStock: true,
    tags: ["Limited Release", "Archive"],
    featured: true,
    rating: 5.0,
    numReviews: 8,
    customizationAvailable: true
  },
  {
    name: "CYBER_SHELL",
    price: 145,
    description: "Technical fabric blend with reflective cybernetic print detailing.",
    category: "Tech-Mesh Blend",
    images: [
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600",
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600"
    ],
    sizes: ["S", "M", "L"],
    colors: [
      { name: "Silver", value: "#c0c0c0" },
      { name: "Black", value: "#0e0e10" }
    ],
    stock: 25,
    inStock: true,
    tags: ["New Arrival"],
    featured: false,
    rating: 4.5,
    numReviews: 12,
    customizationAvailable: true
  },
  {
    name: "NEON_RUNNER",
    price: 95,
    description: "Lightweight performance tee with neon accent stitching.",
    category: "Luxury Jersey",
    images: [
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600"
    ],
    sizes: ["M", "L", "XL", "XXL"],
    colors: [
      { name: "Neon Pink", value: "#ff6b98" },
      { name: "Black", value: "#0e0e10" }
    ],
    stock: 35,
    inStock: true,
    tags: ["New", "Performance"],
    featured: false,
    rating: 4.4,
    numReviews: 10,
    customizationAvailable: true
  },
  {
    name: "DIGITAL_MESH",
    price: 110,
    description: "Breathable mesh overlay with digital camo pattern.",
    category: "Heavyweight Cotton",
    images: [
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600",
      "https://images.unsplash.com/photo-1503342217505-b0a26ec469fb?w=600"
    ],
    sizes: ["S", "M", "L"],
    colors: [
      { name: "Olive", value: "#4a5d23" },
      { name: "Black", value: "#0e0e10" }
    ],
    stock: 0,
    inStock: false,
    tags: ["Sold Out", "Limited"],
    featured: false,
    rating: 4.3,
    numReviews: 6,
    customizationAvailable: false
  }
]

// Sample users with plain passwords (will be hashed)
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@rivo.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: '123456',
    role: 'user'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: '123456',
    role: 'user'
  },
  {
    name: 'Designer Pro',
    email: 'designer@rivo.com',
    password: 'design123',
    role: 'designer'
  },
  {
    name: 'Test User',
    email: 'test@rivo.com',
    password: 'test123',
    role: 'user'
  }
]

const importData = async () => {
  try {
    await connectDB()
    
    // Clear existing data
    await User.deleteMany()
    await Product.deleteMany()
    await Order.deleteMany()
    
    console.log('🗑️  Existing data cleared'.yellow)

    // Hash passwords and create users
    const usersWithHashedPasswords = await Promise.all(
      sampleUsers.map(async (user) => {
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(user.password, salt)
        return {
          ...user,
          password: hashedPassword
        }
      })
    )

    // Create users
    const createdUsers = await User.insertMany(usersWithHashedPasswords)
    console.log(`👥 ${createdUsers.length} users created (with hashed passwords)`.green)
    
    const adminUser = createdUsers[0]._id

    // Add user reference to products
    const productsWithUser = sampleProducts.map(product => ({
      ...product,
      user: adminUser
    }))

    // Create products
    const createdProducts = await Product.insertMany(productsWithUser)
    console.log(`📦 ${createdProducts.length} products created`.green)

    console.log('\n✅ Data Import Complete!'.green.bold.inverse)
    console.log('\n📋 Test Accounts:'.cyan)
    console.log('─'.repeat(40))
    console.log('Admin:'.yellow, '   admin@rivo.com / admin123')
    console.log('User: '.yellow, '    john@example.com / 123456')
    console.log('User: '.yellow, '    jane@example.com / 123456')
    console.log('Designer:'.yellow, ' designer@rivo.com / design123')
    console.log('Test:  '.yellow, '    test@rivo.com / test123')
    console.log('─'.repeat(40))
    
    // Verify password hashing worked
    const testUser = await User.findOne({ email: 'admin@rivo.com' }).select('+password')
    if (testUser) {
      console.log('\n🔐 Password Verification Test:'.cyan)
      const isMatch = await bcrypt.compare('admin123', testUser.password)
      console.log(`Admin password 'admin123' matches: ${isMatch ? '✅ YES'.green : '❌ NO'.red}`)
    }
    
    process.exit()
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`.red.bold.inverse)
    console.error(error.stack)
    process.exit(1)
  }
}

const destroyData = async () => {
  try {
    await connectDB()
    
    await User.deleteMany()
    await Product.deleteMany()
    await Order.deleteMany()

    console.log('✅ All Data Destroyed!'.red.bold.inverse)
    process.exit()
  } catch (error) {
    console.error(`❌ Error: ${error.message}`.red)
    process.exit(1)
  }
}

// Handle command line arguments
if (process.argv[2] === '-d') {
  destroyData()
} else {
  importData()
}