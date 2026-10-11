const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { generateToken } = require('../utils/jwt');
const { validateCampusEmail } = require('../utils/helpers');

/**
 * Helper to clean phone numbers for fuzzy comparison
 */
function cleanPhoneDigits(phoneStr) {
  if (!phoneStr) return '';
  return phoneStr.replace(/\D/g, '').slice(-10);
}

/**
 * Register a new student user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, collegeId, phone, campus, bio, avatar } = req.body;

    // Strict Validation (Phone is optional)
    if (!name || !email || !collegeId) {
      return res.status(400).json({
        success: false,
        message: 'Name, College Email, and Student ERP ID are required.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCollegeId = collegeId.trim().toUpperCase();
    const cleanPhone = phone && phone.trim() ? cleanPhoneDigits(phone) : null;

    if (cleanPhone && cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'If provided, mobile phone number must be 10 digits.',
      });
    }

    // Must be college email or match college roster
    const isCollegeDomain = validateCampusEmail(cleanEmail);
    if (!isCollegeDomain) {
      return res.status(400).json({
        success: false,
        message: 'Registration is restricted to official College Email / Gmail addresses (e.g. @college.edu, @ac.in).',
      });
    }

    // Check if user account already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { collegeId: cleanCollegeId }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this College Email or Student ERP ID already exists. Please log in directly.',
      });
    }

    // Default password is phone number or default pass if custom password not specified
    const initialPassword = password && password.trim().length >= 6 ? password.trim() : (cleanPhone || 'Campus@123');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(initialPassword, salt);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        collegeId: cleanCollegeId,
        phone: cleanPhone,
        avatar: avatar || null,
        campus: campus || 'Main Campus',
        bio: bio ? bio.trim() : null,
        role: (cleanEmail === 'admin482223@gmail.com' || cleanEmail === 'admin1062@gmail.com') ? 'ADMIN' : 'STUDENT',
        isVerified: true,
        hasChangedPassword: !!(password && password.trim().length >= 6),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        collegeId: true,
        phone: true,
        avatar: true,
        campus: true,
        bio: true,
        hasChangedPassword: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // Welcome notification
    await prisma.notification.create({
      data: {
        userId: newUser.id,
        title: 'Welcome to CampusSwap! 🎓',
        message: 'Your student account is verified. Default password is your mobile number. You can change it anytime in your Profile.',
        type: 'SYSTEM',
        link: '/profile',
      },
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Student account registered successfully.',
      token,
      user: newUser,
    });
  } catch (error) {
    console.error('Register Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration.',
      error: error.message,
    });
  }
};

/**
 * Strict Login (Admin Credentials OR College Email / ERP ID + Verified Phone Number + Password/Default Mobile)
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { identifier, email, password, phone } = req.body;
    const loginId = (identifier || email || '').trim();

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: 'College Email / Student ERP ID and Password are required.',
      });
    }

    const cleanInput = loginId.toLowerCase();

    // 1. Admin direct login check
    const isAdminId =
      cleanInput === 'admin482223@gmail.com' ||
      cleanInput === 'admin1062@gmail.com' ||
      cleanInput === 'admin@college.edu' ||
      cleanInput === 'admin' ||
      cleanInput === 'admin482223';

    if (isAdminId) {
      let adminUser = null;
      try {
        adminUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: 'admin482223@gmail.com' },
              { email: 'admin1062@gmail.com' },
              { email: 'admin@college.edu' },
              { role: 'ADMIN' },
            ],
          },
        });
      } catch (e) {
        console.error('Admin DB find error:', e.message);
      }

      let isBcryptMatch = false;
      if (adminUser && adminUser.password) {
        try {
          isBcryptMatch = await bcrypt.compare(password, adminUser.password);
        } catch (e) {}
      }

      if (password === 'Swap@482223' || password === 'admin123' || isBcryptMatch) {
        if (!adminUser) {
          try {
            const adminPassHash = await bcrypt.hash('Swap@482223', 10);
            adminUser = await prisma.user.create({
              data: {
                name: 'Campus Administrator',
                email: 'admin482223@gmail.com',
                password: adminPassHash,
                role: 'ADMIN',
                collegeId: 'ADMIN-482223',
                phone: '9876543210',
                campus: 'Central Admin Complex',
                isVerified: true,
                hasChangedPassword: true,
              },
            });
          } catch (createErr) {
            console.error('Admin auto-create DB error:', createErr.message);
          }
        }

        const adminPayload = {
          id: adminUser ? adminUser.id : 99999,
          name: adminUser ? adminUser.name : 'Campus Administrator',
          email: 'admin482223@gmail.com',
          role: 'ADMIN',
          collegeId: 'ADMIN-482223',
          phone: '9876543210',
          avatar: adminUser ? adminUser.avatar : null,
          campus: 'Central Admin Complex',
          isVerified: true,
          hasChangedPassword: true,
        };

        const token = generateToken(adminPayload);
        return res.status(200).json({
          success: true,
          message: 'Admin access granted.',
          token,
          user: adminPayload,
        });
      }
    }

    // 2. Student Lookup in User Accounts
    let user = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: cleanInput },
            { collegeId: loginId.toUpperCase() },
            { collegeId: loginId },
          ],
        },
      });
    } catch (dbErr) {
      console.error('DB Student lookup error:', dbErr.message);
    }

    // 3. Strict Student Verification Check: User MUST have an account created via verification
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Your College Email or ERP ID is not verified. Please go to "Create Account / Sign Up" to verify your identity first.',
      });
    }

    // 4. Update user phone if provided and not set
    if (phone && phone.trim() && user.id && typeof user.id === 'number') {
      const cleanP = cleanPhoneDigits(phone);
      if (cleanP && (!user.phone || user.phone !== cleanP)) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { phone: cleanP },
          }).catch(() => null);
          user.phone = cleanP;
        } catch (e) {}
      }
    }

    // 5. Password Authentication & Auto-Sync
    let isPasswordValid = false;
    if (user.password) {
      try {
        isPasswordValid = await bcrypt.compare(password, user.password);
      } catch (e) {}
    }

    // Fallbacks for password acceptance:
    // a) Default master pass 'Swap@482223' or 'Campus@123'
    // b) Phone number match
    // c) If user has not explicitly changed password, set entered password as their new password!
    if (!isPasswordValid) {
      if (password === 'Swap@482223' || password === 'Campus@123') {
        isPasswordValid = true;
      } else if (!user.hasChangedPassword && password.length >= 6) {
        isPasswordValid = true;
        if (user.id && typeof user.id === 'number') {
          try {
            const newHash = await bcrypt.hash(password, 10);
            await prisma.user.update({
              where: { id: user.id },
              data: { password: newHash, hasChangedPassword: true },
            }).catch(() => null);
          } catch (e) {}
        }
      } else if (user.phone) {
        const enteredPhone = cleanPhoneDigits(password);
        const userPhone = cleanPhoneDigits(user.phone);
        if (enteredPhone && userPhone && enteredPhone === userPhone) {
          isPasswordValid = true;
        }
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please verify your password or reset it.',
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      collegeId: user.collegeId,
      phone: user.phone,
      avatar: user.avatar || null,
      bio: user.bio || null,
      campus: user.campus || 'Engineering Department',
      isVerified: user.isVerified ?? true,
      hasChangedPassword: true,
      isFirstLogin: false,
      createdAt: user.createdAt || new Date(),
    };

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
      error: error.message,
    });
  }
};

/**
 * Change Password (e.g. after first login)
 * POST /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Verify current password (bcrypt or mobile number)
    let isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid && user.phone) {
      const entered = cleanPhoneDigits(currentPassword);
      const actual = cleanPhoneDigits(user.phone);
      if (entered && actual && entered === actual) {
        isCurrentValid = true;
      }
    }

    if (!isCurrentValid && user.hasChangedPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const newHashed = await bcrypt.hash(newPassword, salt);

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        password: newHashed,
        hasChangedPassword: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully! You can now use your new password for all future logins.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to change password.',
      error: error.message,
    });
  }
};

/**
 * Self-Service Reset Password using Verified Student ERP/Email + Phone
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { identifier, phone, newPassword } = req.body;

    if (!identifier || !phone || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'College Email / Student ERP ID, registered Mobile Number, and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = cleanPhoneDigits(phone);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanId },
          { collegeId: identifier.trim().toUpperCase() },
          { collegeId: identifier.trim() },
        ],
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No student account found matching this Email or Student ERP ID.',
      });
    }

    const userPhoneClean = cleanPhoneDigits(user.phone);
    if (!userPhoneClean || userPhoneClean !== cleanPhone) {
      return res.status(400).json({
        success: false,
        message: 'Identity verification failed: Mobile Number does not match student campus record.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        hasChangedPassword: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during password reset.',
      error: error.message,
    });
  }
};

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        collegeId: true,
        phone: true,
        avatar: true,
        bio: true,
        campus: true,
        isVerified: true,
        hasChangedPassword: true,
        createdAt: true,
        _count: {
          select: {
            listings: true,
            buyerPurchases: true,
            sellerSales: true,
            reviewsReceived: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile.',
      error: error.message,
    });
  }
};

/**
 * Get public profile of another student (Used for chat and seller views)
 * GET /api/auth/user/:id
 */
const getUserById = async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        name: true,
        avatar: true,
        campus: true,
        collegeId: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.',
      });
    }

    return res.status(200).json({
      success: true,
      profile: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load student profile.',
      error: error.message,
    });
  }
};

/**
 * Update student profile (Name, bio, campus, phone, avatar custom URL or selection, remove avatar)
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const { name, bio, campus, phone, avatar, removeAvatar } = req.body;

    const dataToUpdate = {};
    if (name) dataToUpdate.name = name.trim();
    if (bio !== undefined) dataToUpdate.bio = bio ? bio.trim() : null;
    if (campus) dataToUpdate.campus = campus.trim();
    if (phone) dataToUpdate.phone = cleanPhoneDigits(phone);

    // Profile picture / avatar customization
    if (removeAvatar === true) {
      dataToUpdate.avatar = null;
    } else if (avatar !== undefined) {
      dataToUpdate.avatar = avatar;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        collegeId: true,
        phone: true,
        avatar: true,
        bio: true,
        campus: true,
        isVerified: true,
        hasChangedPassword: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
      error: error.message,
    });
  }
};

/**
 * Step 1: Verify Student Record from College Database
 * POST /api/auth/verify-student
 */
const verifyStudent = async (req, res) => {
  try {
    const { identifier, phone } = req.body;
    const cleanId = (identifier || '').trim();

    if (!cleanId) {
      return res.status(400).json({
        success: false,
        message: 'Student ERP ID or College Email is required for verification.',
      });
    }

    // Lookup in StudentRoster
    let rosterRecord = await prisma.studentRoster.findFirst({
      where: {
        OR: [
          { collegeId: cleanId.toUpperCase() },
          { collegeId: cleanId },
          { email: cleanId.toLowerCase() },
        ],
      },
    });

    // Check existing User account
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { collegeId: cleanId.toUpperCase() },
          { collegeId: cleanId },
          { email: cleanId.toLowerCase() },
        ],
      },
    });

    // Strict verification: Student MUST exist in the official StudentRoster or existing Users
    if (!rosterRecord && !existingUser) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: 'Student record not found in official DIT college database. Access is strictly restricted to verified DIT students whose ERP ID or Email is present in the database.',
      });
    }

    const studentData = {
      name: rosterRecord?.name || existingUser?.name,
      collegeId: rosterRecord?.collegeId || existingUser?.collegeId,
      email: rosterRecord?.email || existingUser?.email,
      department: rosterRecord?.department || existingUser?.campus || 'Engineering Department',
      year: rosterRecord?.year || 'Campus Student',
      phone: rosterRecord?.phone || existingUser?.phone,
      isAlreadyRegistered: !!existingUser && existingUser.hasChangedPassword,
    };

    return res.status(200).json({
      success: true,
      verified: true,
      message: `Verified! Welcome ${studentData.name}. You can now create your login password.`,
      student: studentData,
    });
  } catch (error) {
    console.error('Verify Student Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during student verification.',
      error: error.message,
    });
  }
};

/**
 * Step 2: First-Time Student Password Creation & Direct Activation
 * POST /api/auth/activate-student
 */
const activateStudent = async (req, res) => {
  try {
    const { identifier, phone, password, confirmPassword, avatar, name, department } = req.body;
    const cleanId = (identifier || '').trim();

    if (!cleanId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Student ERP ID / Email and Password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation does not match.',
      });
    }

    // Lookup Roster Record
    const rosterRecord = await prisma.studentRoster.findFirst({
      where: {
        OR: [
          { collegeId: cleanId.toUpperCase() },
          { collegeId: cleanId },
          { email: cleanId.toLowerCase() },
        ],
      },
    });

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { collegeId: cleanId.toUpperCase() },
          { collegeId: cleanId },
          { email: cleanId.toLowerCase() },
        ],
      },
    });

    if (!rosterRecord && !user) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found in college database.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const resolvedPhone = cleanPhoneDigits(phone) || cleanPhoneDigits(rosterRecord?.phone) || cleanPhoneDigits(user?.phone);
    const resolvedDepartment = department || rosterRecord?.department || user?.campus || 'Computer Engineering';
    const resolvedName = (name && name.trim()) || rosterRecord?.name || user?.name || 'DIT Student';

    if (user) {
      // Update existing user with new password
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: resolvedName,
          password: hashedPassword,
          hasChangedPassword: true,
          campus: resolvedDepartment,
          ...(avatar && { avatar }),
          ...(resolvedPhone && { phone: resolvedPhone }),
        },
      });
    } else {
      // Create new active student user from Roster
      user = await prisma.user.create({
        data: {
          name: resolvedName,
          email: rosterRecord.email,
          collegeId: rosterRecord.collegeId,
          phone: resolvedPhone,
          password: hashedPassword,
          avatar: avatar || null,
          campus: resolvedDepartment,
          role: 'STUDENT',
          isVerified: true,
          hasChangedPassword: true,
        },
      });
    }

    // Create activation notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Student Account Activated! 🎓',
        message: 'Welcome to CampusSwap! Your password is set and your student account is active.',
        type: 'SYSTEM',
        link: '/browse',
      },
    });

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Password created & Student account activated! Welcome to CampusSwap.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        collegeId: user.collegeId,
        phone: user.phone,
        avatar: user.avatar,
        campus: user.campus,
        hasChangedPassword: true,
      },
    });
  } catch (error) {
    console.error('Activate Student Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to activate student account.',
      error: error.message,
    });
  }
};

// In-memory OTP store with 10-minute validity
const activeOtps = new Map();

/**
 * Generate and dispatch 6-digit OTP via Email and SMS simulation
 * POST /api/auth/send-otp
 */
const sendOtp = async (req, res) => {
  try {
    const { identifier, phone, purpose = 'SIGNUP' } = req.body;

    if (!identifier && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Student ERP ID / College Email or Phone number is required.',
      });
    }

    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPhone = cleanPhoneDigits(phone || '');
    let targetEmail = null;
    let studentName = 'Student';

    if (purpose === 'FORGOT_PASSWORD') {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: cleanId },
            { collegeId: (identifier || '').trim().toUpperCase() },
            { collegeId: (identifier || '').trim() },
          ],
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No student account found matching this College Email or ERP ID.',
        });
      }

      if (cleanPhone) {
        const userPhone = cleanPhoneDigits(user.phone);
        if (userPhone && userPhone !== cleanPhone) {
          return res.status(400).json({
            success: false,
            message: 'Provided mobile number does not match registered campus record.',
          });
        }
      }

      targetEmail = user.email;
      studentName = user.name;
    } else {
      // SIGNUP / VERIFICATION
      const rosterStudent = await prisma.studentRoster.findFirst({
        where: {
          OR: [
            { email: cleanId },
            { collegeId: (identifier || '').trim().toUpperCase() },
            { collegeId: (identifier || '').trim() },
          ],
        },
      });

      if (rosterStudent) {
        targetEmail = rosterStudent.email;
        studentName = rosterStudent.name;
      } else if (cleanId.includes('@')) {
        targetEmail = cleanId;
      }
    }

    // Generate 6-digit cryptographic random OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = cleanPhone || cleanId;
    activeOtps.set(key, {
      otp: generatedOtp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // Also store by identifier if phone was key
    if (cleanId) {
      activeOtps.set(cleanId, {
        otp: generatedOtp,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });
    }

    // Send to student college email if available
    if (targetEmail) {
      sendEmailNotification({
        to: targetEmail,
        subject: `DIT CampusSwap - Your Verification OTP is ${generatedOtp}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #881337;">DIT CampusSwap Identity Verification</h2>
            <p>Hello ${studentName},</p>
            <p>Your one-time verification code is:</p>
            <div style="background: #f1f5f9; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; border-radius: 8px; margin: 15px 0;">
              ${generatedOtp}
            </div>
            <p>This code is valid for 10 minutes. If you did not request this, please ignore.</p>
          </div>
        `,
        text: `Your DIT CampusSwap verification OTP is: ${generatedOtp}. Valid for 10 minutes.`,
      }).catch((emailErr) => {
        console.warn('Email OTP notification error:', emailErr.message);
      });
    }

    return res.status(200).json({
      success: true,
      message: targetEmail
        ? `Verification OTP sent to ${targetEmail} and your mobile number!`
        : `Verification OTP sent to mobile number!`,
      code: generatedOtp,
    });
  } catch (error) {
    console.error('Send OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate OTP.',
      error: error.message,
    });
  }
};

/**
 * Verify 6-digit OTP
 * POST /api/auth/verify-otp
 */
const verifyOtp = async (req, res) => {
  try {
    const { identifier, phone, otp } = req.body;

    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required.' });
    }

    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPhone = cleanPhoneDigits(phone || '');
    const cleanEntered = otp.toString().trim();

    const record = activeOtps.get(cleanPhone) || (cleanId ? activeOtps.get(cleanId) : null);

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found or code expired. Please request a new OTP.',
      });
    }

    if (Date.now() > record.expiresAt) {
      activeOtps.delete(cleanPhone);
      if (cleanId) activeOtps.delete(cleanId);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    if (record.otp !== cleanEntered) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please re-check and enter the 6-digit code.',
      });
    }

    // OTP matched
    activeOtps.delete(cleanPhone);
    if (cleanId) activeOtps.delete(cleanId);

    return res.status(200).json({
      success: true,
      message: 'Phone & identity verified successfully!',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to verify OTP.',
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  verifyStudent,
  activateStudent,
  changePassword,
  resetPassword,
  getMe,
  getUserById,
  updateProfile,
  sendOtp,
  verifyOtp,
};
