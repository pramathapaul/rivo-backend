import asyncHandler from 'express-async-handler'
import crypto from 'crypto'
import OTP from '../models/OTP.js'
import User from '../models/User.js'

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

// @desc    Send OTP to email
// @route   POST /api/auth/send-otp
// @access  Public
export const sendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body

    if (!email) {
        res.status(400)
        throw new Error('Email is required')
    }

    // Check if user already exists and is verified
    const existingUser = await User.findOne({ email, isVerified: true })
    if (existingUser) {
        res.status(400)
        throw new Error('An account with this email already exists')
    }

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email })

    // Generate OTP
    const otp = generateOTP()

    // Save OTP to database (expires in 5 minutes)
    await OTP.create({
        email,
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    })

    // Try to send OTP via email
    try {
        const { default: sendEmail } = await import('../utils/sendEmail.js')

        await sendEmail({
            email,
            subject: 'Your Verification Code - RIVO',
            html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Arial, sans-serif;">
          <!-- Header -->
          <div style="background: #0e0e10; padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: #00eefc; font-style: italic; font-size: 32px; margin: 0; letter-spacing: -1px;">RIVO</h1>
            <p style="color: #f9f5f8; margin-top: 8px; font-size: 14px;">Wear Your Identity</p>
          </div>
          
          <!-- Body -->
          <div style="background: #1f1f22; padding: 30px; border-radius: 0 0 16px 16px; color: #f9f5f8;">
            <h2 style="color: #00eefc; margin-bottom: 10px; font-size: 22px;">Verify Your Email</h2>
            <p style="color: #adaaad; line-height: 1.6; margin-bottom: 10px;">Please use the following verification code to complete your registration:</p>
            
            <!-- OTP Box -->
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background: #0e0e10; padding: 20px 40px; border-radius: 12px; border: 2px solid #00eefc;">
                <span style="font-size: 36px; font-weight: 900; color: #00eefc; letter-spacing: 10px;">${otp}</span>
              </div>
            </div>
            
            <p style="color: #adaaad; line-height: 1.6; font-size: 14px;">Enter this code in the registration form to verify your email address.</p>
            
            <!-- Info -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #48474a;">
              <table style="width: 100%; font-size: 12px; color: #767577;">
                <tr>
                  <td style="padding: 4px 0;">
                    <span style="color: #00eefc;">⏱</span> This code expires in <strong>5 minutes</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;">
                    <span style="color: #ff6b98;">🔒</span> If you didn't request this, please ignore this email
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;">
                    <span style="color: #bcff5f;">🛡️</span> Your account security is important to us
                  </td>
                </tr>
              </table>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; padding: 20px; color: #767577; font-size: 11px;">
            <p>© 2024 RIVO DIGITAL. BEYOND THE GRID.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      `
        })

        console.log(`✅ OTP email sent to: ${email}`)

        res.json({
            message: 'OTP sent successfully! Please check your email.',
            // Only send OTP in response during development
            ...(process.env.NODE_ENV === 'development' && { otp })
        })

    } catch (emailError) {
        console.error('❌ Failed to send email:', emailError.message)

        // If email fails, still give the OTP in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`\n📧 DEVELOPMENT MODE - OTP for ${email}: ${otp}\n`)

            res.json({
                message: 'OTP generated! Check server console for the code.',
                otp
            })
        } else {
            res.status(500)
            throw new Error('Failed to send OTP. Please try again later.')
        }
    }
})

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body

    if (!email || !otp) {
        res.status(400)
        throw new Error('Email and OTP are required')
    }

    // Find valid OTP
    const otpRecord = await OTP.findOne({
        email,
        otp,
        isUsed: false,
        expiresAt: { $gt: new Date() }
    })

    if (!otpRecord) {
        res.status(400)
        throw new Error('Invalid or expired OTP. Please request a new one.')
    }

    // Mark OTP as used
    otpRecord.isUsed = true
    await otpRecord.save()

    // Check if user already exists (unverified)
    let user = await User.findOne({ email, isVerified: false })

    if (user) {
        // Update existing unverified user
        user.isVerified = true
        user.verifiedAt = Date.now()
        await user.save()
    }

    res.json({
        message: 'OTP verified successfully!',
        verified: true
    })
})

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body

    if (!email) {
        res.status(400)
        throw new Error('Email is required')
    }

    // Check rate limit (1 minute cooldown)
    const recentOTP = await OTP.findOne({
        email,
        createdAt: { $gt: new Date(Date.now() - 60 * 1000) }
    })

    if (recentOTP) {
        res.status(429)
        throw new Error('Please wait 1 minute before requesting another OTP')
    }

    // Delete old OTPs and send new one
    await OTP.deleteMany({ email })

    const otp = generateOTP()
    await OTP.create({
        email,
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    })

    console.log(`
========================================
📧 RESENT OTP for ${email}: ${otp}
========================================
  `)

    res.json({
        message: 'OTP resent successfully!',
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
    })
})
