const prisma = require('../config/db');
const {
  cleanErpId,
  formatCollegeEmail,
  matchDepartment,
  matchYear,
  parseStudentData,
} = require('../utils/studentDataParser');
const { DEPARTMENTS } = require('../constants/departments');

/**
 * Get all students (from StudentRoster + User accounts)
 * GET /api/admin/students
 */
const getStudents = async (req, res) => {
  try {
    const { search } = req.query;

    const rosterWhere = {};
    if (search && search.trim()) {
      const q = search.trim();
      rosterWhere.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { collegeId: { contains: q } },
        { phone: { contains: q } },
        { department: { contains: q } },
      ];
    }

    const [roster, users] = await Promise.all([
      prisma.studentRoster.findMany({
        where: rosterWhere,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: {
          id: true,
          name: true,
          email: true,
          collegeId: true,
          phone: true,
          avatar: true,
          campus: true,
          isVerified: true,
          hasChangedPassword: true,
          isFlagged: true,
          createdAt: true,
          _count: {
            select: { listings: true, buyerPurchases: true, sellerSales: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return res.status(200).json({
      success: true,
      roster,
      registeredStudents: users,
    });
  } catch (error) {
    console.error('Admin GetStudents Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve student records.',
      error: error.message,
    });
  }
};

/**
 * Add a new student to the official roster
 * POST /api/admin/students
 */
const addStudent = async (req, res) => {
  try {
    const { name, email, collegeId, phone, department, year } = req.body;

    if (!name || (!email && !collegeId)) {
      return res.status(400).json({
        success: false,
        message: 'Student Name and 8-digit ERP ID are required.',
      });
    }

    const cleanCollegeId = cleanErpId(collegeId);
    const cleanEmail = formatCollegeEmail(email, cleanCollegeId);
    const cleanPhone = phone && String(phone).trim() ? String(phone).replace(/\D/g, '').slice(-10) : null;

    // Check if already in roster
    const existing = await prisma.studentRoster.findFirst({
      where: {
        OR: [
          ...(cleanCollegeId ? [{ collegeId: cleanCollegeId }] : []),
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
        ],
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Student with ERP ID ${cleanCollegeId} or Email ${cleanEmail} already exists in roster.`,
      });
    }

    const newRosterEntry = await prisma.studentRoster.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        collegeId: cleanCollegeId,
        phone: cleanPhone || null,
        department: matchDepartment(department),
        year: matchYear(year),
      },
    });

    return res.status(201).json({
      success: true,
      message: `Student ${name} (ERP: ${cleanCollegeId}) added to official college roster.`,
      student: newRosterEntry,
    });
  } catch (error) {
    console.error('Admin AddStudent Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add student to roster.',
      error: error.message,
    });
  }
};

/**
 * Automatically scan uploaded student data file (Excel, CSV, TSV, TXT, JSON)
 * POST /api/admin/students/upload-file
 */
const uploadStudentFile = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a spreadsheet (.xlsx, .xls) or text (.csv, .txt) file.',
      });
    }

    const parsedStudents = parseStudentData(req.file.buffer);

    if (parsedStudents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not detect valid student records in the file. Ensure student names and ERP IDs are present.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully scanned ${parsedStudents.length} student records from ${req.file.originalname}!`,
      fileName: req.file.originalname,
      count: parsedStudents.length,
      students: parsedStudents,
    });
  } catch (error) {
    console.error('Upload Student File Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to scan uploaded file.',
      error: error.message,
    });
  }
};

/**
 * Bulk Import / Copy Student Roster (from Excel / CSV paste / JSON list)
 * POST /api/admin/students/bulk-import
 */
const bulkImportStudents = async (req, res) => {
  try {
    const { students: studentList, rawText } = req.body;
    let parsedStudents = [];

    if (Array.isArray(studentList) && studentList.length > 0) {
      parsedStudents = parseStudentData(studentList);
    } else if (rawText && typeof rawText === 'string') {
      parsedStudents = parseStudentData(rawText);
    }

    if (parsedStudents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid student records detected. Please select a valid spreadsheet or paste data rows.',
      });
    }

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const item of parsedStudents) {
      try {
        if (!item.name || (!item.collegeId && !item.email)) {
          skippedCount++;
          continue;
        }

        const finalCollegeId = cleanErpId(item.collegeId);
        const finalEmail = formatCollegeEmail(item.email, finalCollegeId);
        const cleanPhone = item.phone && String(item.phone).trim() ? String(item.phone).replace(/\D/g, '').slice(-10) : null;
        const dept = matchDepartment(item.department);
        const yr = matchYear(item.year);

        // Check if student exists in roster
        const existing = await prisma.studentRoster.findFirst({
          where: {
            OR: [
              ...(finalCollegeId ? [{ collegeId: finalCollegeId }] : []),
              ...(finalEmail ? [{ email: finalEmail }] : []),
            ],
          },
        });

        if (existing) {
          await prisma.studentRoster.update({
            where: { id: existing.id },
            data: {
              name: item.name.trim(),
              email: finalEmail || existing.email,
              collegeId: finalCollegeId || existing.collegeId,
              phone: cleanPhone || existing.phone || null,
              department: dept || existing.department,
              year: yr || existing.year,
            },
          });
          updatedCount++;
        } else {
          await prisma.studentRoster.create({
            data: {
              name: item.name.trim(),
              email: finalEmail,
              collegeId: finalCollegeId,
              phone: cleanPhone || null,
              department: dept,
              year: yr,
            },
          });
          insertedCount++;
        }
      } catch (rowError) {
        console.warn('Row import skip warning:', rowError.message);
        skippedCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Database sync complete! Added ${insertedCount} new students, updated ${updatedCount} existing records.${skippedCount > 0 ? ` (${skippedCount} skipped)` : ''}`,
      stats: { insertedCount, updatedCount, skippedCount, totalProcessed: parsedStudents.length },
    });
  } catch (error) {
    console.error('Bulk Import Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process bulk student import.',
      error: error.message,
    });
  }
};

/**
 * Update a student in the roster
 * PUT /api/admin/students/:id
 */
const updateStudent = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, email, collegeId, phone, department, year, isActive } = req.body;

    const updated = await prisma.studentRoster.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(email && { email: email.toLowerCase().trim() }),
        ...(collegeId && { collegeId: collegeId.trim().toUpperCase() }),
        ...(phone && { phone: phone.replace(/\D/g, '').slice(-10) }),
        ...(department && { department: department.trim() }),
        ...(year && { year: year.trim() }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Student record updated successfully.',
      student: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update student record.',
      error: error.message,
    });
  }
};

/**
 * Delete a student from the roster
 * DELETE /api/admin/students/:id
 */
const deleteStudent = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.studentRoster.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Student removed from college roster.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete student.',
      error: error.message,
    });
  }
};

/**
 * Multi-Select Bulk Delete Students from Roster
 * POST /api/admin/students/bulk-delete
 */
const bulkDeleteStudents = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No student IDs provided for deletion.',
      });
    }

    const numericIds = ids.map((i) => parseInt(i)).filter((i) => !isNaN(i));

    const result = await prisma.studentRoster.deleteMany({
      where: {
        id: { in: numericIds },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.count} selected students from the college roster.`,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error('Bulk Delete Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete selected students.',
      error: error.message,
    });
  }
};

/**
 * Remove / Ban misleading listing by Admin
 * POST /api/admin/remove-listing/:id
 */
const removeListing = async (req, res) => {
  try {
    const listingId = parseInt(req.params.id);
    const { reason, sendWarning = true } = req.body;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { seller: true },
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found.',
      });
    }

    // Mark listing as REMOVED_BY_ADMIN and status as REMOVED
    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: {
        status: 'REMOVED',
        moderationStatus: 'REMOVED_BY_ADMIN',
        aiFlagReason: reason || 'Removed by Campus Administrator due to prohibited/misleading content policy violation.',
      },
    });

    // Notify seller student of removal & policy warning
    if (sendWarning && listing.sellerId) {
      await prisma.notification.create({
        data: {
          userId: listing.sellerId,
          title: '⚠️ Listing Removed by Campus Moderator',
          message: `Your item "${listing.title}" has been removed from CampusSwap for violating campus guidelines: ${reason || 'Misleading/Prohibited item'}. Please adhere to campus swap policies.`,
          type: 'SYSTEM',
          link: '/dashboard',
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Listing "${listing.title}" has been removed from the platform and seller notified.`,
      listing: updated,
    });
  } catch (error) {
    console.error('Admin RemoveListing Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove listing.',
      error: error.message,
    });
  }
};

/**
 * Approve a flagged listing (False positive resolution)
 * POST /api/admin/approve-listing/:id
 */
const approveListing = async (req, res) => {
  try {
    const listingId = parseInt(req.params.id);

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: {
        status: 'AVAILABLE',
        moderationStatus: 'APPROVED',
        isFlaggedByAI: false,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Listing #${listingId} approved and is now publicly active.`,
      listing: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to approve listing.',
      error: error.message,
    });
  }
};

/**
 * Get all AI Flagged & Reported Listings
 * GET /api/admin/flagged-listings
 */
const getFlaggedListings = async (req, res) => {
  try {
    const flagged = await prisma.listing.findMany({
      where: {
        OR: [
          { isFlaggedByAI: true },
          { moderationStatus: 'FLAGGED_AI' },
          { reports: { some: { status: 'PENDING' } } },
        ],
      },
      include: {
        seller: {
          select: { id: true, name: true, email: true, collegeId: true, phone: true, avatar: true },
        },
        category: true,
        reports: {
          include: {
            reporter: {
              select: { id: true, name: true, email: true, collegeId: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      count: flagged.length,
      listings: flagged,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch flagged listings.',
      error: error.message,
    });
  }
};

/**
 * Get all Marketplace Swap & Transaction activity for Admin
 * (EXCLUDES private message content to safeguard peer-to-peer privacy)
 * GET /api/admin/marketplace-activity
 */
const getMarketplaceActivity = async (req, res) => {
  try {
    const [transactions, listings, reports, stats] = await Promise.all([
      // All Buy, Rent, Swap transactions
      prisma.transaction.findMany({
        include: {
          listing: {
            select: { id: true, title: true, price: true, type: true, imageUrl: true, category: true },
          },
          buyer: {
            select: { id: true, name: true, email: true, collegeId: true, phone: true },
          },
          seller: {
            select: { id: true, name: true, email: true, collegeId: true, phone: true },
          },
          review: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),

      // All Listings count & list
      prisma.listing.findMany({
        include: {
          seller: {
            select: { id: true, name: true, email: true, collegeId: true, phone: true },
          },
          category: true,
          _count: { select: { transactions: true, savedBy: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),

      // All User Reports
      prisma.report.findMany({
        include: {
          reporter: {
            select: { id: true, name: true, email: true, collegeId: true },
          },
          listing: {
            include: { seller: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // High-level metrics
      Promise.all([
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.listing.count(),
        prisma.transaction.count(),
        prisma.listing.count({ where: { isFlaggedByAI: true } }),
      ]),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents: stats[0],
        totalListings: stats[1],
        totalSwaps: stats[2],
        flaggedItems: stats[3],
      },
      transactions,
      listings,
      reports,
    });
  } catch (error) {
    console.error('Marketplace Activity Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve marketplace data.',
      error: error.message,
    });
  }
};

module.exports = {
  getStudents,
  addStudent,
  uploadStudentFile,
  bulkImportStudents,
  updateStudent,
  deleteStudent,
  bulkDeleteStudents,
  removeListing,
  approveListing,
  getFlaggedListings,
  getMarketplaceActivity,
};
