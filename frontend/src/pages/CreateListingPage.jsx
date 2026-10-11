import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Sparkles,
  Clock,
  ShoppingCart,
  MapPin,
  ArrowLeft,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import API from '../services/api';
import { uploadToCloudinary } from '../services/uploadService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function CreateListingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showToast } = useNotification();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState('SELL');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [condition, setCondition] = useState('GOOD');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [pickupLocation, setPickupLocation] = useState('Main Library / Canteen');
  const [rentDuration, setRentDuration] = useState('per week');
  const [swapPreferences, setSwapPreferences] = useState('');

  // Sample quick images for easy demo
  const sampleImages = [
    { label: '📚 Textbook', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600' },
    { label: '💻 Tech / Calc', url: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&q=80&w=600' },
    { label: '🚲 Bicycle', url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=600' },
    { label: '🪑 Hostel Item', url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=600' },
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      showToast('Please log in to post a listing', 'info');
      navigate('/login');
      return;
    }

    const fetchCats = async () => {
      try {
        const res = await API.get('/categories');
        if (res.data.success) {
          setCategories(res.data.categories);
          if (res.data.categories.length > 0) {
            setCategoryId(res.data.categories[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCats();
  }, [isAuthenticated]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const maxBytes = isVideo ? 250 * 1024 * 1024 : 100 * 1024 * 1024;
      if (file.size > maxBytes) {
        showToast(
          `File size exceeds maximum allowed (${isVideo ? '250MB for video' : '100MB for photos'}).`,
          'error'
        );
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageUrl('');
    }
  };

  const handleSelectSampleImage = (url) => {
    setImageUrl(url);
    setImagePreview(url);
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !categoryId) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    setLoading(true);
    try {
      let finalMediaUrl = imageUrl;

      // Direct upload to cloud storage for images/videos
      if (imageFile) {
        showToast('Uploading media to secure cloud storage...', 'info');
        try {
          finalMediaUrl = await uploadToCloudinary(imageFile);
        } catch (uploadErr) {
          console.warn('Direct cloud upload failed, using fallback:', uploadErr.message);
          showToast('Image upload failed, publishing item with standard thumbnail.', 'info');
          finalMediaUrl = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600';
        }
      }

      if (!finalMediaUrl) {
        finalMediaUrl =
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600';
      }

      const payload = {
        title,
        description,
        categoryId: parseInt(categoryId),
        type,
        price: type === 'SWAP' ? 0 : parseFloat(price) || 0,
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        condition,
        imageUrl: finalMediaUrl,
        pickupLocation,
        rentDuration: type === 'RENT' ? rentDuration : null,
        swapPreferences: type === 'SWAP' ? swapPreferences : null,
      };

      const res = await API.post('/listings', payload);

      if (res.data.success) {
        showToast('Your item is live on CampusSwap! 🎉', 'success');
        navigate(`/listings/${res.data.listing.id}`);
      }
    } catch (err) {
      showToast(err.message || err.response?.data?.message || 'Failed to post listing.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Cancel & Back
      </button>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        
        {/* Title Header */}
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-black text-slate-900">Post an Item on Campus</h1>
          <p className="text-xs text-slate-500 mt-1">
            Sell unused textbooks, rent lab gear, or propose a swap with fellow students.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Type Selector (Sell / Rent / Swap) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Listing Type *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setType('SELL')}
                className={`p-3.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  type === 'SELL'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <span>For Sale</span>
              </button>

              <button
                type="button"
                onClick={() => setType('RENT')}
                className={`p-3.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  type === 'RENT'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-5 h-5 text-blue-600" />
                <span>For Rent</span>
              </button>

              <button
                type="button"
                onClick={() => setType('SWAP')}
                className={`p-3.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                  type === 'SWAP'
                    ? 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span>Item Swap</span>
              </button>
            </div>
          </div>

          {/* Item Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Casio fx-991EX Scientific Calculator (552 Functions)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          {/* Category & Condition Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Condition *
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="BRAND_NEW">Brand New (Unopened / Mint)</option>
                <option value="LIKE_NEW">Like New (Barely used)</option>
                <option value="GOOD">Good (Minor wear, fully working)</option>
                <option value="FAIR">Fair (Visible markings or scratches)</option>
              </select>
            </div>
          </div>

          {/* Conditional Pricing based on Type */}
          {type !== 'SWAP' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {type === 'RENT' ? 'Rental Price (₹) *' : 'Selling Price (₹) *'}
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 450"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full text-sm font-bold bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {type === 'SELL' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Original / Retail Price (₹) (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1200"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full text-sm bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Rental Duration Unit
                  </label>
                  <select
                    value={rentDuration}
                    onChange={(e) => setRentDuration(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="per day">per day</option>
                    <option value="per week">per week</option>
                    <option value="per month">per month</option>
                    <option value="per semester">per semester</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Conditional Swap Preferences */}
          {type === 'SWAP' && (
            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-1.5">
              <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">
                What item(s) would you like in exchange? *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Operating Systems textbook (Silberschatz) or badminton racket"
                value={swapPreferences}
                onChange={(e) => setSwapPreferences(e.target.value)}
                className="w-full text-xs bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          )}

          {/* Item Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Describe condition, edition, accessories included, reason for selling..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          {/* Image & Video Upload & Preview */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Item Photo or Video
            </label>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <label className="flex-1 w-full border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-slate-50">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-700 block">Click to upload photo or video</span>
                <span className="text-[11px] text-slate-400">Photos (up to 100MB) • Videos (MP4/WebM up to 250MB)</span>
                <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
              </label>

              {imagePreview && (
                <div className="w-28 h-28 rounded-2xl overflow-hidden border border-slate-200 shrink-0 relative bg-slate-100 flex items-center justify-center">
                  {imageFile && imageFile.type.startsWith('video/') ? (
                    <video src={imagePreview} className="w-full h-full object-cover" autoPlay muted loop />
                  ) : (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  )}
                </div>
              )}
            </div>

            {/* Quick Demo Sample Image Selector */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-400">Or use instant sample image:</span>
              <div className="flex flex-wrap gap-2">
                {sampleImages.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSampleImage(s.url)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pickup Location */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Campus Pickup Spot
            </label>
            <div className="relative">
              <input
                type="text"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="e.g. Main Library Entrance / Student Canteen"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Publishing Item...' : 'Publish Listing Now'}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}
