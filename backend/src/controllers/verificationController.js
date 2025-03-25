const crypto = require("crypto");
const nodemailer = require("nodemailer");
//const db = require("../db");

// Store verification codes temporarily (in production, use a database)
const verificationCodes = new Map();

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Generate a 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
exports.sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    // Generate verification code
    const code = generateVerificationCode();

    // Store the code with expiration (15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    verificationCodes.set(email, {
      code,
      expiresAt,
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Fallah Smart - Email Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #2E7D32;">Fallah Smart</h2>
          </div>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #333;">Your Verification Code</h3>
            <p style="margin-bottom: 10px;">Please use the following code to verify your email address:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2E7D32; background: #e8f5e9; padding: 15px; border-radius: 5px; display: inline-block;">
                ${code}
              </div>
            </div>
            <p style="margin-bottom: 0;">This code will expire in 15 minutes.</p>
          </div>
          <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Return success response without revealing the actual code
    return res.status(200).json({
      success: true,
      message: "Verification code sent successfully",
      expiresAt,
    });
  } catch (error) {
    console.error("Error sending verification code:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send verification code",
      error: error.message,
    });
  }
};

// Verify the code
exports.verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required",
      });
    }

    // Check if we have a verification code for this email
    const storedData = verificationCodes.get(email);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        message:
          "No verification code found for this email. Please request a new code.",
      });
    }

    // Check if code has expired
    if (new Date() > new Date(storedData.expiresAt)) {
      verificationCodes.delete(email); // Clean up expired code
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new code.",
      });
    }

    // Check if the code matches
    if (storedData.code !== code) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    // Code is valid, update the supplier's verified status in database
    // This part would depend on your database schema
    // Sample query:
    // await db.query('UPDATE suppliers SET email_verified = true WHERE email = ?', [email]);

    // Clean up the used code
    verificationCodes.delete(email);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Error verifying code:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify code",
      error: error.message,
    });
  }
};
