const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
const { authenticateUser, authorizeAdmin } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/adminController');

// All admin routes require authentication & ADMIN role
router.use(authenticateUser, authorizeAdmin);

// Student Roster Management
router.get('/students', getStudents);
router.post('/students', addStudent);
router.post('/students/upload-file', upload.single('file'), uploadStudentFile);
router.post('/students/bulk-import', bulkImportStudents);
router.post('/students/bulk-delete', bulkDeleteStudents);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

// Moderation & Misleading Listing Removal
router.get('/flagged-listings', getFlaggedListings);
router.post('/remove-listing/:id', removeListing);
router.post('/approve-listing/:id', approveListing);

// Marketplace Activity Monitor
router.get('/marketplace-activity', getMarketplaceActivity);

module.exports = router;
