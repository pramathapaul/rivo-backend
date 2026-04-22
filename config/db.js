import mongoose from 'mongoose'
import colors from 'colors'

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'rivo',
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`.green.underline)
    console.log(`📊 Database: ${conn.connection.name}`.cyan)
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`.red)
    })
    
    mongoose.connection.on('disconnected', () => {
      console.warn(`⚠️ MongoDB disconnected`.yellow)
    })
    
    mongoose.connection.on('reconnected', () => {
      console.log(`🔄 MongoDB reconnected`.green)
    })
    
  } catch (error) {
    console.error(`❌ MongoDB Atlas Connection Error: ${error.message}`.red.bold)
    console.log(`\n🔧 Troubleshooting:`.yellow)
    console.log(`1. Check your network connection`.gray)
    console.log(`2. Verify MongoDB Atlas IP whitelist includes your current IP`.gray)
    console.log(`3. Confirm database user password is correct`.gray)
    console.log(`4. Ensure cluster is running`.gray)
    process.exit(1)
  }
}

export default connectDB