import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  Users,
  ShoppingBag,
  ArrowLeftRight,
  CheckCircle2,
  Trash2,
  Plus,
  Clock,
  ExternalLink,
  BookOpen,
  Phone,
  Mail,
  Edit2,
  Search,
  Sparkles,
  Ban,
  Eye,
  X,
  Building2,
  Tag,
  AlertCircle,
  QrCode,
  Download,
  Copy,
  FileSpreadsheet,
  Smartphone,
  Printer,
  Upload,
  FileUp,
  FileType,
  FileCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { DEPARTMENTS } from '../constants/departments';

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('students'); // students, ai_moderation, swaps, qr_campaign, categories
  const [loading, setLoading] = useState(true);

  // Student Roster State
  const [students, setStudents] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState('ALL');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  
  // Bulk File Upload & Scanner Modal State
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkImportTab, setBulkImportTab] = useState('file'); // 'file' | 'paste'
  const [scannedFile, setScannedFile] = useState(null);
  const [scannedStudents, setScannedStudents] = useState([]);
  const [bulkRawText, setBulkRawText] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef(null);

  // Edit / Add Single Student State
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentFormData, setStudentFormData] = useState({
    name: '',
    email: '',
    collegeId: '',
    phone: '',
    department: DEPARTMENTS[3], // Computer Engineering
    year: '1st Year',
  });

  // AI Moderation & Flagged Listings State
  const [flaggedListings, setFlaggedListings] = useState([]);
  const [removalReason, setRemovalReason] = useState('');
  const [selectedListingToBan, setSelectedListingToBan] = useState(null);

  // Marketplace Swap Activity State
  const [marketplaceData, setMarketplaceData] = useState({
    transactions: [],
    listings: [],
    reports: [],
    stats: { totalStudents: 0, totalListings: 0, totalSwaps: 0, flaggedItems: 0 },
  });

  // Categories
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Tag');

  // Campus QR Campaign Target
  const [campaignUrl, setCampaignUrl] = useState(
    window.location.origin.includes('localhost')
      ? 'http://192.168.1.109:5180'
      : window.location.origin
  );

  useEffect(() => {
    if (!isAdmin) {
      showToast('Campus Administrator privileges required.', 'error');
      navigate('/login');
      return;
    }

    loadAllAdminData();
  }, [isAdmin]);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [studentsRes, flaggedRes, activityRes, catsRes] = await Promise.all([
        API.get('/admin/students'),
        API.get('/admin/flagged-listings'),
        API.get('/admin/marketplace-activity'),
        API.get('/categories'),
      ]);

      if (studentsRes.data.success) {
        setStudents(studentsRes.data.roster || []);
        setRegisteredUsers(studentsRes.data.registeredStudents || []);
      }
      if (flaggedRes.data.success) {
        setFlaggedListings(flaggedRes.data.listings || []);
      }
      if (activityRes.data.success) {
        setMarketplaceData(activityRes.data);
      }
      if (catsRes.data.success) {
        setCategories(catsRes.data.categories || []);
      }
    } catch (err) {
      console.error('Error loading admin portal data:', err);
      showToast('Error fetching administrator records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper to match department names
  const matchDept = (deptStr) => {
    if (!deptStr) return DEPARTMENTS[3];
    const clean = deptStr.trim().toLowerCase();
    const found = DEPARTMENTS.find((d) => {
      const dl = d.toLowerCase();
      return (
        dl === clean ||
        dl.includes(clean) ||
        clean.includes(dl) ||
        (clean.includes('comp') && dl.includes('computer engineering')) ||
        (clean.includes('ai') && dl.includes('intelligence')) ||
        (clean.includes('mech') && dl.includes('mechanical')) ||
        (clean.includes('civil') && dl.includes('civil')) ||
        (clean.includes('electr') && dl.includes('electrical')) ||
        (clean.includes('entc') && dl.includes('telecommunication')) ||
        (clean.includes('e&tc') && dl.includes('telecommunication')) ||
        (clean.includes('it') && dl.includes('information technology')) ||
        (clean.includes('robot') && dl.includes('robotics')) ||
        (clean.includes('fe') && dl.includes('first year')) ||
        (clean.includes('inst') && dl.includes('instrumentation')) ||
        (clean.includes('str') && dl === 'str')
      );
    });
    return found || deptStr.trim();
  };

  // Helper to parse file locally or via server
  const processStudentFile = async (file) => {
    setBulkLoading(true);
    setScannedFile(file);

    // 1. Try server-side file scanner first
    try {
      const formData = new FormData();
      formData.append('file', file);

      const serverRes = await API.post('/admin/students/upload-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (serverRes.data.success && Array.isArray(serverRes.data.students) && serverRes.data.students.length > 0) {
        setScannedStudents(serverRes.data.students);
        showToast(serverRes.data.message || `Scanned ${serverRes.data.students.length} students!`, 'success');
        setBulkLoading(false);
        return;
      }
    } catch (serverErr) {
      console.warn('Server upload-file fallback to client parser:', serverErr.message);
    }

    // 2. Client-side fallback parser
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (rawJson.length === 0) {
          showToast('The selected file appears to be empty.', 'error');
          setBulkLoading(false);
          return;
        }

        // Header detection
        let headerRowIndex = -1;
        let colMap = {};

        for (let i = 0; i < Math.min(rawJson.length, 8); i++) {
          const rowStr = rawJson[i].map((c) => String(c).toLowerCase()).join(' ');
          if (
            rowStr.includes('name') ||
            rowStr.includes('erp') ||
            rowStr.includes('roll') ||
            rowStr.includes('email') ||
            rowStr.includes('mail') ||
            rowStr.includes('dept') ||
            rowStr.includes('branch')
          ) {
            headerRowIndex = i;
            rawJson[i].forEach((colName, colIdx) => {
              const c = String(colName).toLowerCase().trim();
              if (/name|student.*name|full.*name|candidate/i.test(c) && colMap.name === undefined) colMap.name = colIdx;
              else if (/erp.*id|erp|erpid|roll.*no|roll|prn|id.*no|reg.*no|id/i.test(c) && colMap.collegeId === undefined) colMap.collegeId = colIdx;
              else if (/email|mail|e-mail/i.test(c) && colMap.email === undefined) colMap.email = colIdx;
              else if (/phone|mobile|contact|cell|tel/i.test(c) && colMap.phone === undefined) colMap.phone = colIdx;
              else if (/dept|department|branch|stream|course/i.test(c) && colMap.department === undefined) colMap.department = colIdx;
              else if (/year|class|sem|semester|std/i.test(c) && colMap.year === undefined) colMap.year = colIdx;
            });
            break;
          }
        }

        const dataStartIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;
        const parsed = [];

        for (let i = dataStartIndex; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (!row || !row.some((cell) => Boolean(String(cell).trim()))) continue;

          let name = '';
          let collegeId = '';
          let email = '';
          let phone = '';
          let department = '';
          let year = '1st Year';

          if (headerRowIndex >= 0) {
            name = colMap.name !== undefined ? String(row[colMap.name] || '').trim() : '';
            collegeId = colMap.collegeId !== undefined ? String(row[colMap.collegeId] || '').trim() : '';
            email = colMap.email !== undefined ? String(row[colMap.email] || '').trim() : '';
            phone = colMap.phone !== undefined ? String(row[colMap.phone] || '').trim() : '';
            department = colMap.department !== undefined ? String(row[colMap.department] || '').trim() : '';
            year = colMap.year !== undefined ? String(row[colMap.year] || '1st Year').trim() : '1st Year';
          }

          // Heuristic fallback
          if (!name || !collegeId) {
            row.forEach((cellVal) => {
              const val = String(cellVal).trim();
              if (!val) return;
              if (!collegeId && (/^\d{8}$/.test(val) || /^[A-Z0-9-]{6,12}$/i.test(val)) && !val.includes('@')) {
                collegeId = val;
              } else if (!email && val.includes('@')) {
                email = val;
              } else if (!phone && /^\d{10}$/.test(val.replace(/\D/g, ''))) {
                phone = val;
              } else if (!department && DEPARTMENTS.some((d) => d.toLowerCase().includes(val.toLowerCase()))) {
                department = val;
              } else if (!name && val.length >= 3 && isNaN(val) && !val.includes('@')) {
                name = val;
              }
            });
          }

          if (name || collegeId || email) {
            const cleanDigits = collegeId.replace(/\D/g, '');
            const finalErp = cleanDigits.length === 8 ? cleanDigits : (cleanDigits.length >= 4 ? cleanDigits : collegeId.toUpperCase());
            const finalEmail = email && email.includes('@')
              ? email.toLowerCase().trim()
              : finalErp ? `${finalErp.toLowerCase()}.dit@dypvp.edu.in` : '';
            const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : null;

            parsed.push({
              name: name || `Student ${finalErp}`,
              collegeId: finalErp || 'PENDING',
              email: finalEmail,
              phone: cleanPhone,
              department: matchDept(department),
              year: year || '1st Year',
            });
          }
        }

        if (parsed.length === 0) {
          showToast('Could not find student rows in the uploaded file.', 'error');
        } else {
          setScannedStudents(parsed);
          showToast(`Successfully scanned ${parsed.length} student records from ${file.name}!`, 'success');
        }
      } catch (err) {
        console.error('Spreadsheet scan error:', err);
        showToast('Error reading file. Please check format.', 'error');
      } finally {
        setBulkLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processStudentFile(file);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processStudentFile(file);
    }
  };

  // Submit scanned records to database
  const handleConfirmScannedImport = async () => {
    if (scannedStudents.length === 0) {
      showToast('No scanned student records to import.', 'error');
      return;
    }

    setBulkLoading(true);
    try {
      const res = await API.post('/admin/students/bulk-import', {
        students: scannedStudents,
      });

      if (res.data.success) {
        showToast(res.data.message, 'success');
        setBulkModalOpen(false);
        setScannedStudents([]);
        setScannedFile(null);
        setBulkRawText('');
        loadAllAdminData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to import student roster.', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  // --- Student Roster Handlers ---
  const handleSaveStudent = async (e) => {
    e.preventDefault();
    try {
      const formattedErp = studentFormData.collegeId.trim();
      const formattedEmail = studentFormData.email.trim() || `${formattedErp.toLowerCase()}.dit@dypvp.edu.in`;

      const payload = {
        ...studentFormData,
        collegeId: formattedErp,
        email: formattedEmail,
      };

      if (editingStudent) {
        // Edit existing student
        const res = await API.put(`/admin/students/${editingStudent.id}`, payload);
        if (res.data.success) {
          showToast('Student record updated successfully.', 'success');
          setStudents((prev) =>
            prev.map((s) => (s.id === editingStudent.id ? res.data.student : s))
          );
        }
      } else {
        // Add new student
        const res = await API.post('/admin/students', payload);
        if (res.data.success) {
          showToast(res.data.message, 'success');
          setStudents((prev) => [res.data.student, ...prev]);
        }
      }
      setStudentModalOpen(false);
      setEditingStudent(null);
      setStudentFormData({
        name: '',
        email: '',
        collegeId: '',
        phone: '',
        department: DEPARTMENTS[3],
        year: '1st Year',
      });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save student.', 'error');
    }
  };

  const handleBulkPasteImport = async (e) => {
    e.preventDefault();
    if (!bulkRawText.trim()) {
      showToast('Please paste CSV or tab-separated student rows.', 'error');
      return;
    }

    setBulkLoading(true);
    try {
      const res = await API.post('/admin/students/bulk-import', {
        rawText: bulkRawText,
      });

      if (res.data.success) {
        showToast(res.data.message, 'success');
        setBulkModalOpen(false);
        setBulkRawText('');
        loadAllAdminData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Bulk import failed.', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the college roster?`)) return;
    try {
      const res = await API.delete(`/admin/students/${id}`);
      if (res.data.success) {
        showToast('Student removed from roster.', 'success');
        setStudents((prev) => prev.filter((s) => s.id !== id));
        setSelectedStudentIds((prev) => prev.filter((i) => i !== id));
      }
    } catch (err) {
      showToast('Failed to delete student.', 'error');
    }
  };

  // Toggle single student selection
  const toggleSelectStudent = (id) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle select all filtered students
  const toggleSelectAll = () => {
    const currentFilteredIds = filteredStudents.map((s) => s.id);
    const allSelected = currentFilteredIds.every((id) => selectedStudentIds.includes(id));

    if (allSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !currentFilteredIds.includes(id)));
    } else {
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...currentFilteredIds])));
    }
  };

  // Multi-select bulk delete handler
  const handleBulkDeleteSelected = async () => {
    if (selectedStudentIds.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedStudentIds.length} selected students from the college database?`
      )
    ) {
      return;
    }

    try {
      const res = await API.post('/admin/students/bulk-delete', {
        ids: selectedStudentIds,
      });

      if (res.data.success) {
        showToast(res.data.message, 'success');
        setStudents((prev) => prev.filter((s) => !selectedStudentIds.includes(s.id)));
        setSelectedStudentIds([]);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete selected students.', 'error');
    }
  };

  // --- AI Moderation & Listing Removal Handlers ---
  const handleRemoveListing = async (listingId) => {
    try {
      const res = await API.post(`/admin/remove-listing/${listingId}`, {
        reason: removalReason || 'Restricted / Misleading campus item policy violation',
        sendWarning: true,
      });

      if (res.data.success) {
        showToast(res.data.message, 'success');
        setFlaggedListings((prev) => prev.filter((l) => l.id !== listingId));
        setSelectedListingToBan(null);
        setRemovalReason('');
        loadAllAdminData();
      }
    } catch (err) {
      showToast('Failed to remove listing.', 'error');
    }
  };

  const handleApproveListing = async (listingId) => {
    try {
      const res = await API.post(`/admin/approve-listing/${listingId}`);
      if (res.data.success) {
        showToast('Listing approved and made public!', 'success');
        setFlaggedListings((prev) => prev.filter((l) => l.id !== listingId));
      }
    } catch (err) {
      showToast('Failed to approve listing.', 'error');
    }
  };

  // --- Category Creation Handler ---
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await API.post('/categories', {
        name: newCatName.trim(),
        icon: newCatIcon,
      });
      if (res.data.success) {
        showToast('New category added to marketplace!', 'success');
        setCategories((prev) => [...prev, res.data.category]);
        setNewCatName('');
      }
    } catch (err) {
      showToast('Failed to create category.', 'error');
    }
  };

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.collegeId.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.phone.includes(studentSearch) ||
      (s.department && s.department.toLowerCase().includes(studentSearch.toLowerCase()));

    const matchesDept =
      selectedDepartmentFilter === 'ALL' || s.department === selectedDepartmentFilter;

    return matchesSearch && matchesDept;
  });

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-400 text-xs">
        Loading CampusSwap Administration Center...
      </div>
    );
  }

  // QR Code URL
  const qrCodeImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data=${encodeURIComponent(
    campaignUrl
  )}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-md">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black">Campus Safety & Admin Portal</h1>
              <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-md uppercase tracking-wider">
                Admin 1062
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Manage student ERP rosters, launch campus QR code posters, and moderate AI-flagged items.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setBulkModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Bulk Import Roster
          </button>
          <button
            onClick={() => {
              setEditingStudent(null);
              setStudentFormData({
                name: '',
                email: '',
                collegeId: '',
                phone: '',
                department: DEPARTMENTS[3],
                year: '1st Year',
              });
              setStudentModalOpen(true);
            }}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Student Roster</span>
            <Users className="w-5 h-5 text-brand-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{students.length}</p>
          <span className="text-[10px] text-slate-400">Pre-approved College Records</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Active Listings</span>
            <ShoppingBag className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{marketplaceData.stats.totalListings}</p>
          <span className="text-[10px] text-slate-400">Published Gear & Items</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Marketplace Swaps</span>
            <ArrowLeftRight className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{marketplaceData.stats.totalSwaps}</p>
          <span className="text-[10px] text-slate-400">Completed Transactions</span>
        </div>

        <div className={`p-5 rounded-3xl border shadow-card ${
          flaggedListings.length > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${flaggedListings.length > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
              AI Flagged Items
            </span>
            <AlertTriangle className={`w-5 h-5 ${flaggedListings.length > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <p className={`text-2xl font-black mt-2 ${flaggedListings.length > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {flaggedListings.length}
          </p>
          <span className="text-[10px] text-slate-400">Prohibited/Misleading Flags</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'students'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" /> Student Roster ({students.length})
        </button>

        <button
          onClick={() => setActiveTab('ai_moderation')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'ai_moderation'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" /> AI Content Moderation
          {flaggedListings.length > 0 && (
            <span className="px-1.5 py-0.2 bg-white text-rose-700 font-black rounded-full text-[10px]">
              {flaggedListings.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('qr_campaign')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'qr_campaign'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <QrCode className="w-4 h-4" /> Campus QR Poster & App Ads
        </button>

        <button
          onClick={() => setActiveTab('swaps')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'swaps'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" /> Swaps & Activity
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-4 h-4" /> Categories
        </button>
      </div>

      {/* TAB 1: STUDENT ROSTER MANAGEMENT */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2 max-w-xl">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search students by Name, ERP ID, Email, Phone..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <select
                value={selectedDepartmentFilter}
                onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-slate-900 shrink-0"
              >
                <option value="ALL">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              {selectedStudentIds.length > 0 && (
                <button
                  onClick={handleBulkDeleteSelected}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 animate-in fade-in"
                >
                  <Trash2 className="w-4 h-4" /> Delete Selected ({selectedStudentIds.length})
                </button>
              )}
              <button
                onClick={() => setBulkModalOpen(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Bulk Paste from Excel
              </button>
              <button
                onClick={() => {
                  setEditingStudent(null);
                  setStudentFormData({
                    name: '',
                    email: '',
                    collegeId: '',
                    phone: '',
                    department: DEPARTMENTS[3],
                    year: '1st Year',
                  });
                  setStudentModalOpen(true);
                }}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Student
              </button>
            </div>
          </div>

          {/* Roster Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3.5 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredStudents.length > 0 &&
                          filteredStudents.every((s) => selectedStudentIds.includes(s.id))
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                        title="Select All Students"
                      />
                    </th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Student ERP ID</th>
                    <th className="py-3.5 px-4">College Email</th>
                    <th className="py-3.5 px-4">Registered Phone</th>
                    <th className="py-3.5 px-4">Department & Year</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        No students found. Use "Bulk Paste from Excel" to import student section records.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr
                        key={s.id}
                        className={`transition-colors ${
                          selectedStudentIds.includes(s.id)
                            ? 'bg-rose-50/60'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(s.id)}
                            onChange={() => toggleSelectStudent(s.id)}
                            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 font-black text-xs flex items-center justify-center">
                            {s.name[0]}
                          </div>
                          {s.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-brand-700">
                          {s.collegeId}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{s.email}</td>
                        <td className="py-3.5 px-4 font-mono text-emerald-700 font-semibold">
                          {s.phone || <span className="text-slate-400 font-normal text-[11px]">—</span>}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {s.department} • <span className="font-semibold">{s.year}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingStudent(s);
                              setStudentFormData({
                                name: s.name,
                                email: s.email,
                                collegeId: s.collegeId,
                                phone: s.phone || '',
                                department: s.department || DEPARTMENTS[3],
                                year: s.year || '1st Year',
                              });
                              setStudentModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-brand-600 rounded-lg transition-colors"
                            title="Edit Student"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s.id, s.name)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI CONTENT MODERATION */}
      {activeTab === 'ai_moderation' && (
        <div className="space-y-4">
          <div className="bg-rose-50/70 border border-rose-200/80 p-4 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-rose-600" />
              <div>
                <h3 className="text-xs font-black text-rose-900">
                  AI Automated Prohibited & Misleading Content Detection
                </h3>
                <p className="text-[11px] text-rose-700">
                  Scans listings for prohibited items (e.g. condoms, sanitary pads, drugs, alcohol, weapons). Flagged listings are kept hidden from students until reviewed.
                </p>
              </div>
            </div>
          </div>

          {flaggedListings.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-card space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-black text-slate-900">All Clear! No Flagged Items</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                The AI engine has verified all listings on CampusSwap.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flaggedListings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white rounded-3xl p-5 border-2 border-rose-200 shadow-card space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={listing.imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=200'}
                        alt={listing.title}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-100"
                      />
                      <div>
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-black rounded-md uppercase">
                          AI Flagged
                        </span>
                        <h4 className="text-sm font-black text-slate-900 mt-1">{listing.title}</h4>
                        <p className="text-[11px] text-slate-500 font-semibold">
                          Price: ₹{listing.price} • Type: {listing.type}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200/80 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" /> AI Moderation Flag Reason:
                    </span>
                    <p className="text-xs font-semibold text-rose-900">
                      {listing.aiFlagReason || 'Restricted campus item detected by AI pattern analyzer.'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Posted By Student:
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{listing.seller?.name}</span>
                      <span className="font-mono text-brand-700 font-bold">
                        ERP: {listing.seller?.collegeId || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{listing.seller?.email}</span>
                      <span className="font-mono text-emerald-700 font-semibold">
                        Phone: {listing.seller?.phone || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleApproveListing(listing.id)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                    >
                      Approve (False Alarm)
                    </button>
                    <button
                      onClick={() => {
                        setSelectedListingToBan(listing);
                        setRemovalReason(listing.aiFlagReason || 'Prohibited / Misleading content policy violation');
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Ban className="w-3.5 h-3.5" /> Remove from Website
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CAMPUS QR POSTER & APP CAMPAIGN */}
      {activeTab === 'qr_campaign' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Controls & QR Settings */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-card space-y-5">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-brand-600" /> Campus QR Code Generator
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Print this QR code on college notice boards, hostel lobbies, and canteen flyers. Students scan it to instantly open the platform, verify their ERP, and install the mobile app!
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Website / App Destination URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={campaignUrl}
                  onChange={(e) => setCampaignUrl(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-mono font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(campaignUrl);
                    showToast('Target URL copied to clipboard!', 'success');
                  }}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600"
                  title="Copy URL"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Use your local campus IP (e.g. <code>http://192.168.1.109:5180</code>) or live custom domain.
              </span>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 space-y-2 text-xs">
              <strong className="block font-black flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-600" /> PWA Mobile App Support
              </strong>
              <p className="text-[11px] text-emerald-800">
                When students open this link on Android Chrome or iOS Safari, they can tap <strong>"Install CampusSwap"</strong> to add it directly to their home screen as a standalone app!
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Poster
              </button>
              <a
                href={qrCodeImageSrc}
                download="campusswap-qr.png"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" /> QR Image
              </a>
            </div>
          </div>

          {/* Right: Live Printable Campus Poster Preview */}
          <div className="lg:col-span-2 bg-gradient-to-tr from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-8 text-white shadow-2xl border-4 border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-8">
            
            <div className="space-y-4 max-w-md">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Official College Notice
              </div>
              
              <h2 className="text-3xl font-black tracking-tight leading-tight">
                Buy, Rent & Swap Gear Right On Campus! 🎓
              </h2>
              
              <p className="text-xs text-slate-300">
                Don't let unused textbooks, calculators, cycles, lab manuals, and hostel essentials sit idle. Swap them with peers safely inside college grounds!
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-emerald-200">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center text-[10px] font-bold">1</div>
                  <span>Scan the QR code with your phone camera</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-emerald-200">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center text-[10px] font-bold">2</div>
                  <span>Enter your pre-registered Student ERP ID</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-emerald-200">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center text-[10px] font-bold">3</div>
                  <span>Create your password & start swapping!</span>
                </div>
              </div>
            </div>

            {/* Live QR Box */}
            <div className="bg-white p-5 rounded-3xl text-slate-900 text-center shadow-2xl border-4 border-emerald-400/30 space-y-3 shrink-0">
              <img
                src={qrCodeImageSrc}
                alt="CampusSwap QR Code"
                className="w-48 h-48 rounded-2xl mx-auto border border-slate-100 shadow-xs"
              />
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                  Scan To Open & Install App
                </span>
                <span className="text-[10px] font-mono text-slate-500 block truncate max-w-[200px] mx-auto">
                  {campaignUrl}
                </span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 4: SWAPS & ACTIVITY */}
      {activeTab === 'swaps' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 text-white rounded-3xl flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black">Campus Marketplace Swap Activity Stream</h3>
              <p className="text-[11px] text-slate-400">
                Live oversight of all student transactions, swap requests, rentals, and reviews. (Private chat text excluded to protect student privacy).
              </p>
            </div>
            <span className="px-3 py-1 bg-white/10 rounded-xl text-xs font-mono font-bold text-emerald-400">
              {marketplaceData.transactions.length} Swaps Recorded
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3.5 px-4">Transaction Item</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Buyer / Requester</th>
                    <th className="py-3.5 px-4">Seller / Owner</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {marketplaceData.transactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    marketplaceData.transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {t.listing?.title || `Item #${t.listingId}`}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md uppercase">
                            {t.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 block">{t.buyer?.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">ERP: {t.buyer?.collegeId}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 block">{t.seller?.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">ERP: {t.seller?.collegeId}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                            t.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' :
                            t.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-card space-y-4">
            <h3 className="text-sm font-black text-slate-900">Add Marketplace Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lab Kits & Instruments"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Create Category
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-card space-y-4">
            <h3 className="text-sm font-black text-slate-900">Active Campus Categories ({categories.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((c) => (
                <div key={c.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                  <span className="text-xs font-bold text-slate-800 block">{c.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono block">slug: {c.slug}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: UNIVERSAL SPREADSHEET / FILE SCANNER & BULK IMPORT */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm">Universal College Student Data Scanner</h3>
                  <p className="text-[10px] text-slate-400">
                    Upload any student spreadsheet (.xlsx, .xls, .csv, .tsv, .txt, .json) or paste raw data
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setBulkModalOpen(false);
                  setScannedStudents([]);
                  setScannedFile(null);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tab Switcher */}
            <div className="px-6 pt-4 border-b border-slate-100 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setBulkImportTab('file')}
                className={`pb-3 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 ${
                  bulkImportTab === 'file'
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Upload className="w-4 h-4" /> Upload & Auto-Scan File (.xlsx, .csv, .txt, .json)
              </button>
              <button
                type="button"
                onClick={() => setBulkImportTab('paste')}
                className={`pb-3 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 ${
                  bulkImportTab === 'paste'
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Copy className="w-4 h-4" /> Direct Copy-Paste Rows
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* TAB 1: FILE DROPZONE & AUTO SCAN */}
              {bulkImportTab === 'file' && (
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.tsv,.txt,.json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(true);
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                      isDraggingFile
                        ? 'border-emerald-500 bg-emerald-50/50 scale-99'
                        : 'border-slate-300 hover:border-brand-500 bg-slate-50 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-200 mx-auto flex items-center justify-center text-brand-600 mb-3">
                      <FileUp className="w-7 h-7" />
                    </div>
                    <h4 className="text-sm font-black text-slate-800">
                      Drop student file here or <span className="text-brand-600 underline">browse files</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports Excel (<code>.xlsx</code>, <code>.xls</code>), <code>.csv</code>, <code>.txt</code>, and <code>.json</code> files from student section
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span className="px-2 py-0.5 bg-slate-200 rounded-md">8-Digit ERP ID</span>
                      <span>•</span>
                      <span className="px-2 py-0.5 bg-slate-200 rounded-md">Auto Email ({'{erpid}.dit@dypvp.edu.in'})</span>
                      <span>•</span>
                      <span className="px-2 py-0.5 bg-slate-200 rounded-md">12 Departments</span>
                    </div>
                  </div>

                  {/* Scanned Preview Table */}
                  {scannedStudents.length > 0 && (
                    <div className="space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-black text-slate-800">
                            Scanned Records Preview ({scannedStudents.length} Students Detected)
                          </span>
                        </div>
                        {scannedFile && (
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                            {scannedFile.name} ({(scannedFile.size / 1024).toFixed(1)} KB)
                          </span>
                        )}
                      </div>

                      <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-2xl bg-white shadow-inner">
                        <table className="w-full text-left text-xs text-slate-700">
                          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 text-[10px] font-black uppercase tracking-wider text-slate-500">
                            <tr>
                              <th className="py-2.5 px-3">#</th>
                              <th className="py-2.5 px-3">Student Name</th>
                              <th className="py-2.5 px-3">ERP ID</th>
                              <th className="py-2.5 px-3">College Email</th>
                              <th className="py-2.5 px-3">Phone</th>
                              <th className="py-2.5 px-3">Department</th>
                              <th className="py-2.5 px-3">Year</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-[11px]">
                            {scannedStudents.slice(0, 50).map((st, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                                <td className="py-2 px-3 font-bold text-slate-900">{st.name}</td>
                                <td className="py-2 px-3 font-mono font-bold text-brand-700">{st.collegeId}</td>
                                <td className="py-2 px-3 text-slate-600 font-mono text-[10px]">{st.email}</td>
                                <td className="py-2 px-3 text-emerald-700 font-mono">{st.phone || '—'}</td>
                                <td className="py-2 px-3 text-slate-500">{st.department}</td>
                                <td className="py-2 px-3 text-slate-500 font-semibold">{st.year}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {scannedStudents.length > 50 && (
                        <p className="text-[10px] text-slate-400 text-center italic">
                          Showing first 50 of {scannedStudents.length} rows. All {scannedStudents.length} records will be imported.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DIRECT PASTE ROWS */}
              {bulkImportTab === 'paste' && (
                <form onSubmit={handleBulkPasteImport} className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Copy cells from Excel or Google Sheets and paste here. Supports comma, tab, or semicolon separated columns: <code>Name, 8-Digit ERP, Email, Phone, Department, Year</code>.
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Paste Student Data Rows
                    </label>
                    <textarea
                      rows="7"
                      required
                      placeholder={`Atharva Patil, 20241042, 20241042.dit@dypvp.edu.in, 9823456789, Computer Engineering, 3rd Year\nRahul Sharma, 20231108, 20231108.dit@dypvp.edu.in, 9811122233, Mechanical Engineering, 4th Year\nPriya Mehta, 20241019, 20241019.dit@dypvp.edu.in, 9777788899, Electronics & Telecommunication, 3rd Year`}
                      value={bulkRawText}
                      onChange={(e) => setBulkRawText(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 text-slate-900"
                    ></textarea>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setBulkModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={bulkLoading}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {bulkLoading ? 'Importing Roster...' : 'Import Pasted Students'}
                    </button>
                  </div>
                </form>
              )}

              {/* Action buttons for File tab */}
              {bulkImportTab === 'file' && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    {scannedStudents.length > 0 ? `${scannedStudents.length} students ready to add` : 'No file scanned yet'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBulkModalOpen(false);
                        setScannedStudents([]);
                        setScannedFile(null);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={bulkLoading || scannedStudents.length === 0}
                      onClick={handleConfirmScannedImport}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {bulkLoading
                        ? 'Adding to College Database...'
                        : `Confirm & Add ${scannedStudents.length} Students to Database`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT SINGLE STUDENT */}
      {studentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-sm">
                  {editingStudent ? 'Edit Student Roster Entry' : 'Add Student to Campus Roster'}
                </h3>
              </div>
              <button
                onClick={() => setStudentModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Student Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Atharva Patil"
                  value={studentFormData.name}
                  onChange={(e) => setStudentFormData({ ...studentFormData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    8-Digit ERP ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 20241062"
                    value={studentFormData.collegeId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStudentFormData({
                        ...studentFormData,
                        collegeId: val,
                        // Auto-fill official email if email wasn't manually typed
                        ...(!editingStudent && (!studentFormData.email || studentFormData.email.endsWith('.dit@dypvp.edu.in')) && {
                          email: val ? `${val.toLowerCase()}.dit@dypvp.edu.in` : '',
                        }),
                      });
                    }}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Mobile No.</span>
                    <span className="text-[10px] text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9823456789"
                    value={studentFormData.phone}
                    onChange={(e) => setStudentFormData({ ...studentFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  College Email ({'{erpid}.dit@dypvp.edu.in'}) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. 20241062.dit@dypvp.edu.in"
                  value={studentFormData.email}
                  onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <select
                    value={studentFormData.department}
                    onChange={(e) => setStudentFormData({ ...studentFormData, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 text-slate-900"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Year of Study
                  </label>
                  <select
                    value={studentFormData.year}
                    onChange={(e) => setStudentFormData({ ...studentFormData, year: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 text-slate-900"
                  >
                    <option>1st Year</option>
                    <option>2nd Year</option>
                    <option>3rd Year</option>
                    <option>4th Year</option>
                    <option>Postgraduate</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStudentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {editingStudent ? 'Save Changes' : 'Add to Roster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REMOVE MISLEADING ITEM DIALOG */}
      {selectedListingToBan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5" />
                <h3 className="font-bold text-sm">Remove & Ban Item from CampusSwap</h3>
              </div>
              <button
                onClick={() => setSelectedListingToBan(null)}
                className="p-1 rounded-full text-rose-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Are you sure you want to remove item <strong>"{selectedListingToBan.title}"</strong> from the website? The student will receive an official policy violation warning.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reason for Removal / Student Policy Warning
                </label>
                <textarea
                  rows="3"
                  value={removalReason}
                  onChange={(e) => setRemovalReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 text-slate-900"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedListingToBan(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveListing(selectedListingToBan.id)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Confirm Removal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
