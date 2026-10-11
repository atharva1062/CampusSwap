import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  Star,
  Bookmark,
  Share2,
  MessageSquare,
  ShieldAlert,
  Calendar,
  CheckCircle,
  Eye,
  ArrowLeftRight,
  ShoppingCart
} from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import RequestModal from '../components/RequestModal';
import ReportModal from '../components/ReportModal';
import Avatar from '../components/Avatar';
import ProductCard from '../components/ProductCard';

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useNotification();

  const [listing, setListing] = useState(null);
  const [relatedListings, setRelatedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  // Modals
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/listings/${id}`);
        if (res.data.success) {
          setListing(res.data.listing);
          setRelatedListings(res.data.relatedListings || []);
          setIsSaved(res.data.listing.isSaved || false);
        }
      } catch (err) {
        showToast('Listing not found or removed.', 'error');
        navigate('/browse');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
    window.scrollTo(0, 0);
  }, [id]);

  const handleBookmarkToggle = async () => {
    if (!isAuthenticated) {
      showToast('Please log in to save items to your wishlist', 'info');
      navigate('/login');
      return;
    }

    try {
      const res = await API.post(`/listings/${listing.id}/save`);
      if (res.data.success) {
        setIsSaved(res.data.isSaved);
        showToast(res.data.message, 'success');
      }
    } catch (err) {
      showToast('Failed to bookmark listing.', 'error');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: listing.title,
        text: `Check out ${listing.title} on CampusSwap!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard!', 'success');
    }
  };

  const handleStartChat = () => {
    if (!isAuthenticated) {
      showToast('Please log in to message the seller', 'info');
      navigate('/login');
      return;
    }
    navigate(`/messages?user=${listing.sellerId}&listing=${listing.id}`);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 bg-slate-200 rounded-3xl"></div>
          <div className="space-y-4">
            <div className="h-6 bg-slate-200 rounded w-3/4"></div>
            <div className="h-10 bg-slate-200 rounded w-1/2"></div>
            <div className="h-32 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  const isOwner = user?.id === listing.sellerId;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Listings
      </button>

      {/* Main Listing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Image Gallery & Badges */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/3] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs">
            {listing.imageUrl?.match(/\.(mp4|webm|mov|ogg)($|\?)/i) || listing.imageUrl?.includes('/video/upload/') ? (
              <video
                src={listing.imageUrl}
                controls
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <img
                src={listing.imageUrl}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-md ${
                listing.type === 'SWAP'
                  ? 'bg-amber-500 text-white'
                  : listing.type === 'RENT'
                  ? 'bg-blue-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}>
                {listing.type === 'SWAP' ? '🔄 SWAP ONLY' : listing.type === 'RENT' ? '⏳ FOR RENT' : '🏷️ FOR SALE'}
              </span>

              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900/80 text-white backdrop-blur-md">
                {listing.condition?.replace('_', ' ')}
              </span>
            </div>

            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                onClick={handleBookmarkToggle}
                className={`p-3 rounded-2xl backdrop-blur-md shadow-md transition-transform active:scale-90 ${
                  isSaved ? 'bg-rose-500 text-white' : 'bg-white/80 hover:bg-white text-slate-700 hover:text-rose-500'
                }`}
                title="Save Item"
              >
                <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-3 rounded-2xl bg-white/80 hover:bg-white text-slate-700 backdrop-blur-md shadow-md transition-transform active:scale-90"
                title="Share Link"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Listing Details & Offer Action */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Header Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span className="text-brand-600 font-bold bg-brand-50 px-2 py-0.5 rounded-md">
                {listing.category?.name}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> {listing.views} views
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(listing.createdAt).toLocaleDateString()}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {listing.title}
            </h1>
          </div>

          {/* Pricing Box */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
            {listing.type === 'SWAP' ? (
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Exchange Preference</span>
                <p className="text-base font-extrabold text-slate-900">
                  {listing.swapPreferences || 'Looking for equal value study/hostel items'}
                </p>
              </div>
            ) : (
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 block mb-0.5">Price</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">₹{listing.price}</span>
                    {listing.originalPrice && listing.originalPrice > listing.price && (
                      <span className="text-sm text-slate-400 line-through">₹{listing.originalPrice}</span>
                    )}
                    {listing.type === 'RENT' && listing.rentDuration && (
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {listing.rentDuration}
                      </span>
                    )}
                  </div>
                </div>

                {listing.originalPrice && listing.originalPrice > listing.price && (
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                    {Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)}% SAVINGS
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {isOwner ? (
              <Link
                to={`/edit-listing/${listing.id}`}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                Edit Your Listing
              </Link>
            ) : listing.status !== 'AVAILABLE' ? (
              <div className="w-full py-3.5 bg-slate-200 text-slate-500 font-bold text-sm rounded-2xl text-center">
                This item is currently {listing.status}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      showToast('Please log in to make a proposal', 'info');
                      navigate('/login');
                      return;
                    }
                    setRequestModalOpen(true);
                  }}
                  className="py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {listing.type === 'SWAP' ? 'Propose Swap' : listing.type === 'RENT' ? 'Rent Item' : 'Buy Now'}
                </button>

                <button
                  onClick={handleStartChat}
                  className="py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <MessageSquare className="w-4 h-4 text-brand-400" />
                  Chat with Student
                </button>
              </div>
            )}

            {/* Meetup Pickup Location info */}
            {listing.pickupLocation && (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                <span>Pickup Spot: <strong>{listing.pickupLocation}</strong></span>
              </div>
            )}
          </div>

          {/* Seller Reputation Profile Box */}
          {listing.seller && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Listed by Verified Student
              </span>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={listing.seller.avatar}
                    alt={listing.seller.name}
                    className="w-12 h-12 rounded-xl ring-2 ring-slate-100"
                    iconClassName="w-6 h-6"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{listing.seller.name}</h4>
                    <p className="text-xs text-slate-500">{listing.seller.campus || 'Main Campus'}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-amber-500 font-black text-sm">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{listing.seller.averageRating || '5.0'}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    ({listing.seller.reviewCount || 0} reviews)
                  </span>
                </div>
              </div>

              {listing.seller.bio && (
                <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl">
                  "{listing.seller.bio}"
                </p>
              )}
            </div>
          )}

          {/* Report Button */}
          <div className="text-right">
            <button
              onClick={() => setReportModalOpen(true)}
              className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1 ml-auto"
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Report this listing
            </button>
          </div>

        </div>

      </div>

      {/* Product Description */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-lg font-black text-slate-900">Item Description & Condition</h3>
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          {listing.description}
        </p>
      </div>

      {/* Related Listings */}
      {relatedListings.length > 0 && (
        <div className="space-y-6 pt-6">
          <h3 className="text-xl font-black text-slate-900">More in {listing.category?.name}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedListings.map((item) => (
              <ProductCard key={item.id} listing={item} />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <RequestModal
        listing={listing}
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onSuccess={() => {
          navigate('/transactions');
        }}
      />

      <ReportModal
        listing={listing}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />

    </div>
  );
}
