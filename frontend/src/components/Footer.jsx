import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, ShieldCheck, Heart, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold">
                <ArrowLeftRight className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">
                Campus<span className="text-brand-400">Swap</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              The verified campus marketplace for students to buy, sell, rent textbooks, electronics, cycles, hostel gear, and swap course materials safely.
            </p>
            <div className="flex items-center gap-2 text-xs text-brand-400 font-medium bg-brand-950/80 px-3 py-1.5 rounded-lg border border-brand-800/40 w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Campus Community Only</span>
            </div>
          </div>

          {/* Marketplace Navigation */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Marketplace</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/browse?category=books" className="hover:text-brand-400 transition-colors">Books & Textbooks</Link></li>
              <li><Link to="/browse?category=electronics" className="hover:text-brand-400 transition-colors">Electronics & Calculators</Link></li>
              <li><Link to="/browse?category=bicycles" className="hover:text-brand-400 transition-colors">Bicycles & Commute</Link></li>
              <li><Link to="/browse?category=hostel" className="hover:text-brand-400 transition-colors">Hostel Room Essentials</Link></li>
              <li><Link to="/browse?type=SWAP" className="hover:text-amber-400 transition-colors flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-400" /> Swap Items</Link></li>
            </ul>
          </div>

          {/* Student Hub */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Student Hub</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/create-listing" className="hover:text-brand-400 transition-colors">Sell or Rent an Item</Link></li>
              <li><Link to="/transactions" className="hover:text-brand-400 transition-colors">My Deals & Requests</Link></li>
              <li><Link to="/messages" className="hover:text-brand-400 transition-colors">Meetup Messages</Link></li>
              <li><Link to="/dashboard" className="hover:text-brand-400 transition-colors">Student Profile & Ratings</Link></li>
            </ul>
          </div>

          {/* Safety & Trust (BMC) */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">DIT Campus Location</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dr. D. Y. Patil Institute of Technology<br />
              Sant Tukaram Nagar, Pimpri, Pune - 411018<br />
              Maharashtra, India
            </p>
            <div className="mt-3 text-[11px] text-accent-400 font-semibold">
              <span>Official Portal: </span>
              <a href="https://engg.dypvp.edu.in" target="_blank" rel="noreferrer" className="underline hover:text-accent-300">
                engg.dypvp.edu.in
              </a>
            </div>
          </div>

        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} DIT CampusSwap • Dr. D. Y. Patil Institute of Technology, Pimpri, Pune.</p>
          <p className="flex items-center gap-1 text-accent-400/90 font-medium">
            <span>Empowerment Through Knowledge</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
