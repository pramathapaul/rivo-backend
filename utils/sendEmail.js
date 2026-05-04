import nodemailer from 'nodemailer'

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    // Verify connection
    await transporter.verify()
    console.log('✅ Email server connected')

    const mailOptions = {
      from: `"RIVO" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email sent:', info.messageId)
    
    return info
  } catch (error) {
    console.error('❌ Email Error:', error.message)
    throw error
  }
}

export default sendEmail