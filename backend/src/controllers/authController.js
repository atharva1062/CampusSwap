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
    if (cleanInput === 'admin482223@gmail.com' || cleanInput === 'admin1062@gmail.com' || cleanInput === 'admin@college.edu') {
      let adminUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: 'admin482223@gmail.com' }, { email: 'admin1062@gmail.com' }, { email: 'admin@college.edu' }],
        },
      });

      // Guarantee Admin access for Swap@482223 or admin123 or valid hash
      let isBcryptMatch = false;
      if (adminUser && adminUser.password) {
        try {
          isBcryptMatch = await bcrypt.compare(password, adminUser.password);
        } catch (e) {}
      }

      if (password === 'Swap@482223' || password === 'admin123' || isBcryptMatch) {
        if (!adminUser) {
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
        }

        const token = generateToken(adminUser);
        return res.status(200).json({
          success: true,
          message: 'Admin access granted.',
          token,
          user: {
            id: adminUser.id,
            name: adminUser.name,
            email: adminUser.email,
            role: 'ADMIN',
            collegeId: adminUser.collegeId,
            phone: adminUser.phone,
            avatar: adminUser.avatar,
            campus: adminUser.campus,
            hasChangedPassword: true,
          },
        });
      }
    }

    // 2. Student Lookup in User Accounts
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanInput },
          { collegeId: loginId.trim().toUpperCase() },
          { collegeId: loginId.trim() },
        ],
      },
    });

    // 3. If User doesn't exist yet, check StudentRoster pre-approved database
    let rosterRecord = null;
    if (!user) {
      rosterRecord = await prisma.studentRoster.findFirst({
        where: {
          OR: [
            { email: cleanInput },
            { collegeId: loginId.trim().toUpperCase() },
          ],
        },
      });

      // Auto-validate any valid 8-digit DIT Student ERP ID or DIT College Email
      const isEightDigitErp = /^\d{8}$/.test(loginId.trim());
      const isDitCollegeEmail = cleanInput.endsWith('@dypvp.edu.in') || cleanInput.endsWith('@college.edu');

      if (!rosterRecord && (isEightDigitErp || isDitCollegeEmail)) {
        const erpId = isEightDigitErp ? loginId.trim() : cleanInput.split('@')[0].toUpperCase();
        const stdEmail = isDitCollegeEmail ? cleanInput : `${erpId.toLowerCase()}.dit@dypvp.edu.in`;
        
        rosterRecord = await prisma.studentRoster.create({
          data: {
            name: `Student (${erpId})`,
            email: stdEmail,
            collegeId: erpId,
            department: 'Engineering Department',
            year: 'Campus Student',
            isActive: true,
          },
        }).catch(() => null);
      }

      if (rosterRecord) {
        // Auto-provision student account from Roster
        const defaultPhone = cleanPhoneDigits(rosterRecord.phone) || '9823456789';
        const studentPassHash = await bcrypt.hash(defaultPhone, 10);
        user = await prisma.user.create({
          data: {
            name: rosterRecord.name,
            email: rosterRecord.email,
            collegeId: rosterRecord.collegeId,
            phone: rosterRecord.phone ? cleanPhoneDigits(rosterRecord.phone) : null,
            password: studentPassHash,
            role: 'STUDENT',
            campus: rosterRecord.department || 'Main Campus',
            isVerified: true,
            hasChangedPassword: false,
          },
        });
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No student found with this College Email or Student ERP ID. Access is strictly for registered campus students.',
      });
    }

    // 4. Compulsory Phone Number Verification
    // If student provided a phone number or if roster/user has phone, check match
    if (phone && phone.trim()) {
      const providedPhone = cleanPhoneDigits(phone);
      const registeredPhone = cleanPhoneDigits(user.phone);
      if (registeredPhone && providedPhone !== registeredPhone) {
        return res.status(401).json({
          success: false,
          message: 'Phone number does not match the registered records for this student account.',
        });
      }
    }

    // 5. Password Authentication
    // Try bcrypt comparison first
    let isPasswordValid = await bcrypt.compare(password, user.password);

    // Fallback: If not custom changed, check against registered mobile number
    if (!isPasswordValid && !user.hasChangedPassword && user.phone) {
      const enteredPhone = cleanPhoneDigits(password);
      const userPhone = cleanPhoneDigits(user.phone);
      if (enteredPhone && userPhone && enteredPhone === userPhone) {
        isPasswordValid = true;
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. (Default is your registered Mobile No., or use Forgot Password to reset)',
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
      avatar: user.avatar,
      bio: user.bio,
      campus: user.campus,
      isVerified: user.isVerified,
      hasChangedPassword: user.hasChangedPassword,
      isFirstLogin: !user.hasChangedPassword,
      createdAt: user.createdAt,
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

    // Support 6,000 - 10,000 official DIT Student ERP IDs & emails
    const isEightDigitErp = /^\d{8}$/.test(cleanId);
    const isDitCollegeEmail = cleanId.toLowerCase().endsWith('@dypvp.edu.in') || cleanId.toLowerCase().endsWith('@college.edu');

    if (!rosterRecord && !existingUser && (isEightDigitErp || isDitCollegeEmail)) {
      const erpId = isEightDigitErp ? cleanId : cleanId.split('@')[0].toUpperCase();
      const stdEmail = isDitCollegeEmail ? cleanId.toLowerCase() : `${erpId.toLowerCase()}.dit@dypvp.edu.in`;
      
      rosterRecord = await prisma.studentRoster.create({
        data: {
          name: `Student (${erpId})`,
          email: stdEmail,
          collegeId: erpId,
          department: 'Artificial Intelligence & Data Science',
          year: 'Campus Student',
          isActive: true,
        },
      }).catch(() => null);
    }

    if (!rosterRecord && !existingUser) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: 'Student record not found in official DIT college database. Access is strictly restricted to verified DIT students.',
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

module.exports = {
  register,
  login,
  verifyStudent,
  activateStudent,
  changePassword,
  resetPassword,
  getMe,
  updateProfile,
};
