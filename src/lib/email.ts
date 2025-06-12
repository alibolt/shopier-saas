import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export async function sendVerificationEmail(
  email: string,
  token: string
) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`
  
  if (!resend) {
    console.log('Email service not configured. Verification link:', verifyUrl)
    return { success: true, mockUrl: verifyUrl }
  }
  
  try {
    const data = await resend.emails.send({
      from: 'Shopier SaaS <onboarding@resend.dev>',
      to: email,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify your email address</h2>
          <p>Thank you for signing up! Please click the link below to verify your email address:</p>
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin: 20px 0;">Verify Email</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${verifyUrl}</p>
          <p>This link will expire in 24 hours.</p>
        </div>
      `
    })
    
    return { success: true, data }
  } catch (error) {
    console.error('Failed to send verification email:', error)
    return { success: false, error }
  }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`
  
  if (!resend) {
    console.log('Email service not configured. Reset link:', resetUrl)
    return { success: true, mockUrl: resetUrl }
  }
  
  try {
    const data = await resend.emails.send({
      from: 'Shopier SaaS <onboarding@resend.dev>',
      to: email,
      subject: 'Reset your password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset your password</h2>
          <p>We received a request to reset your password. Click the link below to choose a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${resetUrl}</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        </div>
      `
    })
    
    return { success: true, data }
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    return { success: false, error }
  }
}

export async function sendOrderStatusEmail(
  email: string,
  orderNumber: string,
  status: string,
  storeName: string
) {
  const statusMessages = {
    PENDING: 'Your order has been received and is being processed.',
    PROCESSING: 'Your order is being prepared for shipment.',
    COMPLETED: 'Your order has been completed and shipped!',
    CANCELLED: 'Your order has been cancelled.',
    REFUNDED: 'Your order has been refunded.',
  }
  
  const message = statusMessages[status as keyof typeof statusMessages] || 'Your order status has been updated.'
  
  if (!resend) {
    console.log(`Order status email - Order: ${orderNumber}, Status: ${status}`)
    return { success: true }
  }
  
  try {
    const data = await resend.emails.send({
      from: 'Shopier SaaS <onboarding@resend.dev>',
      to: email,
      subject: `Order ${orderNumber} - ${status}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Update from ${storeName}</h2>
          <p>Hi there,</p>
          <p>${message}</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Order Number:</strong> ${orderNumber}</p>
            <p style="margin: 10px 0 0 0;"><strong>Status:</strong> ${status}</p>
          </div>
          <p>Thank you for your business!</p>
        </div>
      `
    })
    
    return { success: true, data }
  } catch (error) {
    console.error('Failed to send order status email:', error)
    return { success: false, error }
  }
}

export async function sendOrderConfirmationEmail(
  email: string,
  orderNumber: string,
  items: Array<{ title: string; quantity: number; price: number }>,
  total: number,
  storeName: string
) {
  if (!resend) {
    console.log(`Order confirmation email - Order: ${orderNumber}, Total: $${total / 100}`)
    return { success: true }
  }
  
  try {
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price / 100).toFixed(2)}</td>
      </tr>
    `).join('')
    
    const data = await resend.emails.send({
      from: 'Shopier SaaS <onboarding@resend.dev>',
      to: email,
      subject: `Order Confirmation - ${orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Thank you for your order!</h2>
          <p>Hi there,</p>
          <p>We've received your order and will begin processing it soon.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Order Number:</strong> ${orderNumber}</p>
            <p style="margin: 10px 0 0 0;"><strong>Store:</strong> ${storeName}</p>
          </div>
          
          <h3>Order Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 10px; text-align: left;">Item</th>
                <th style="padding: 10px; text-align: center;">Qty</th>
                <th style="padding: 10px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
                <td style="padding: 10px; text-align: right;"><strong>$${(total / 100).toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>
          
          <p style="margin-top: 30px;">We'll send you another email when your order ships.</p>
          <p>Thank you for your business!</p>
        </div>
      `
    })
    
    return { success: true, data }
  } catch (error) {
    console.error('Failed to send order confirmation email:', error)
    return { success: false, error }
  }
}