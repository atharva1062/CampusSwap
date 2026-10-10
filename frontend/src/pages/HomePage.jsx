import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  ArrowLeftRight,
  ShieldCheck,
  TrendingUp,
  BookOpen,
  Laptop,
  Bike,
  Home,
  FileText,
  Dumbbell,
  CheckCircle2,
  Users,
  ShoppingBag,
  Clock,
  ChevronRight,
  PlusCircle
} from 'lucide-react';
import API from '../services/api';
import ProductCard from '../components/ProductCard';
import CategoryFilter from '../components/CategoryFilter';

export default function HomePage() {
  const navigate = useNavigate();
  const [featuredListings, setFeaturedListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 1420,
    totalListings: 86,
    completedDeals: 320,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [listingsRes, categoriesRes, statsRes] = await Promise.all([
          API.get('/listings?limit=8&status=AVAILABLE&sortBy=popular'),
          API.get('/categories'),
          API.get('/stats/overview'),
        ]);

        if (listingsRes.data.success) {
          setFeaturedListings(listingsRes.data.listings);
        }
        if (categoriesRes.data.success) {
          setCategories(categoriesRes.data.categories);
        }
        if (statsRes.data.success) {
          setStats(statsRes.data.stats);
        }
      } catch (err) {
        console.error('Home data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="space-y-16 pb-12">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-white to-slate-50 pt-12 pb-20 border-b border-slate-200/60">
        <div className="absolute inset-0 bg-[radial-gradient(#16a34a_1px,transparent_1px)] [background-size:24px_24px] opacity-15"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            
            {/* Campus Trust Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100/80 border border-brand-200/80 text-brand-800 text-xs font-bold tracking-wide animate-fade-in shadow-xs">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>Verified Student-to-Student Marketplace</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Buy, Sell, Rent & <span className="text-brand-600">Swap</span> on Campus
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Don't let expensive textbooks and hostel gear collect dust. Connect directly with college peers for instant on-campus exchanges without shipping fees.
            </p>

            {/* Hero Search Box */}
            <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto pt-2">
              <div className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-white rounded-2xl sm:rounded-full shadow-card border border-slate-200/90 focus-within:ring-4 focus-within:ring-brand-500/15 focus-within:border-brand-500 transition-all">
                <div className="flex items-center flex-1 w-full px-4 py-2">
                  <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
                  <input
                    type="text"
                    placeholder="Search engineering books, scientific calculators, cycles, lab coats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl sm:rounded-full shadow-sm hover:shadow-md transition-all shrink-0 active:scale-95"
                >
                  Find on Campus
                </button>
              </div>
            </form>

            {/* Quick Action Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-semibold text-slate-600">
              <span className="text-slate-400">Popular:</span>
              <Link to="/browse?category=books" className="px-2.5 py-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 shadow-2xs">📚 Textbooks</Link>
              <Link to="/browse?category=electronics" className="px-2.5 py-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 shadow-2xs">💻 Calculators</Link>
              <Link to="/browse?category=bicycles" className="px-2.5 py-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 shadow-2xs">🚲 Cycles</Link>
              <Link to="/browse?type=SWAP" className="px-2.5 py-1 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-lg border border-amber-200 shadow-2xs flex items-center gap-1 font-bold">
                <Sparkles className="w-3 h-3 text-amber-600" /> Swaps
              </Link>
            </div>

          </div>

          {/* Highlights & Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-center">
              <p className="text-2xl sm:text-3xl font-black text-brand-600">{stats.totalStudents}+</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Verified Students</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-center">
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.activeListings || stats.totalListings || 45}+</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Live Campus Listings</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-center">
              <p className="text-2xl sm:text-3xl font-black text-amber-600">{stats.completedDeals || 120}+</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Deals Completed</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-center">
              <p className="text-2xl sm:text-3xl font-black text-emerald-600">0 mins</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Shipping Wait Time</p>
            </div>
          </div>

        </div>
      </section>

      {/* Category Explorer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Browse Categories</h2>
            <p className="text-xs text-slate-500 mt-1">Everything you need for your semester at student friendly prices.</p>
          </div>
          <Link
            to="/browse"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
          >
            View All <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(slug) => {
            if (slug) navigate(`/browse?category=${slug}`);
            else navigate('/browse');
          }}
        />
      </section>

      {/* Featured Items Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse"></span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Trending Campus Deals</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">Available for immediate inspection and pickup across campus.</p>
          </div>
          <Link
            to="/browse"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
          >
            Explore Market ({stats.activeListings || featuredListings.length})
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse h-72"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredListings.map((listing) => (
              <ProductCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* How CampusSwap Works (BMC Value Prop) */}
      <section className="bg-slate-900 text-white py-16 my-8 rounded-3xl max-w-7xl mx-auto px-6 sm:px-12">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Simple & Safe</span>
          <h2 className="text-3xl font-black tracking-tight">How CampusSwap Works</h2>
          <p className="text-xs text-slate-400">
            A 4-step verified workflow designed specifically for hostel & campus life.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 relative">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-lg mb-4">
              1
            </div>
            <h3 className="font-bold text-base text-white mb-1">List or Browse</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Post your unused course books, lab items, or gadgets in 30 seconds with photos and meetup location.
            </p>
          </div>

          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 relative">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg mb-4">
              2
            </div>
            <h3 className="font-bold text-base text-white mb-1">Choose Your Deal</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Buy directly, rent per semester, or propose a 1-to-1 swap with another textbook or item you own.
            </p>
          </div>

          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 relative">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg mb-4">
              3
            </div>
            <h3 className="font-bold text-base text-white mb-1">Meet on Campus</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Coordinate via in-app chat and meet at the library or student canteen. Inspect condition before handing over.
            </p>
          </div>

          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg mb-4">
              4
            </div>
            <h3 className="font-bold text-base text-white mb-1">Review & Trust</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Rate your peer with 1-5 stars. Build your campus reputation badge as a trusted student trader.
            </p>
          </div>

        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-brand-600 to-emerald-600 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <h2 className="text-3xl font-black tracking-tight">Have textbooks or gear you don't use anymore?</h2>
            <p className="text-brand-100 text-sm leading-relaxed">
              Help junior students save money while earning back your semester expenses. List your first item in under a minute!
            </p>
          </div>
          <Link
            to="/create-listing"
            className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 shrink-0 flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5 text-brand-600" />
            Post a Listing Now
          </Link>
        </div>
      </section>

    </div>
  );
}
