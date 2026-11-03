import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
  Search,
  PlusCircle,
  Bell,
  User,
  LogOut,
  Shield,
  KeyRound,
  GraduationCap,
  Briefcase,
  Bookmark,
  Sparkles,
  LayoutDashboard,
  FileText,
  Menu,
  X,
  Layers,
  ChevronDown,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenReportModal: (type: 'lost' | 'found') => void;
  onOpenAuthModal: () => void;
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenReportModal,
  onOpenAuthModal,
  onOpenNotifications,
}) => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const { unreadNotificationCount, getUserMatches } = useData();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userMatches = currentUser ? getUserMatches(currentUser.id) : [];
  const isAdminOrMod =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'moderator';

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
            <KeyRound className="w-3 h-3" /> Admin
          </span>
        );
      case 'moderator':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            <Shield className="w-3 h-3" /> Security
          </span>
        );
      case 'faculty':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Briefcase className="w-3 h-3" /> Faculty
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            <GraduationCap className="w-3 h-3" /> Student
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <div className="w-4 h-4 border-2 border-white rounded-xs"></div>
          </div>
          <div>
            <div className="font-bold text-xl tracking-tight text-slate-800 flex items-center">
              <span>Campus<span className="text-indigo-600">LF</span></span>
            </div>
            <div className="text-[9px] font-semibold text-slate-400 tracking-wider uppercase">
              Central University Network
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
          <button
            onClick={() => onNavigate('browse')}
            className={`px-3 py-2 rounded-md transition-colors ${
              currentView === 'browse' ? 'text-indigo-600 bg-indigo-50 font-bold' : 'hover:text-indigo-600 hover:bg-slate-50'
            }`}
          >
            Browse Items
          </button>

          <button
            onClick={() => onNavigate('matches')}
            className={`px-3 py-2 rounded-md flex items-center gap-1.5 transition-colors ${
              currentView === 'matches' ? 'text-indigo-600 bg-indigo-50 font-bold' : 'hover:text-indigo-600 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Matches
            {userMatches.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                {userMatches.length}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate('reports')}
            className={`px-3 py-2 rounded-md flex items-center gap-1.5 transition-colors ${
              currentView === 'reports' || currentView === 'my-reports' ? 'text-indigo-600 bg-indigo-50 font-bold' : 'hover:text-indigo-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            My Reports
          </button>

          {isAdminOrMod && (
            <button
              onClick={() => onNavigate('admin')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                currentView === 'admin'
                  ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin Console
            </button>
          )}
        </nav>

        {/* Right CTA / Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Report Buttons (Desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => onOpenReportModal('lost')}
              className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs rounded-lg border border-orange-200 shadow-2xs transition-all"
            >
              + Report Lost
            </button>
            <button
              onClick={() => onOpenReportModal('found')}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200 shadow-2xs transition-all"
            >
              + Report Found
            </button>
          </div>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-pulse">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {/* User Account / Profile Menu */}
          {isAuthenticated && currentUser ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-colors"
              >
                <img
                  src={
                    currentUser.avatar_url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={currentUser.full_name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                />
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {currentUser.full_name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium capitalize">
                    {currentUser.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-100">
                  <div className="p-3 border-b border-slate-100">
                    <div className="font-bold text-sm text-slate-900">{currentUser.full_name}</div>
                    <div className="text-xs text-slate-500 truncate">{currentUser.email}</div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {getRoleBadge(currentUser.role)}
                      <span className="text-[11px] text-slate-500 font-medium">
                        {currentUser.student_staff_id}
                      </span>
                    </div>
                  </div>

                  <div className="py-1 text-xs font-medium text-slate-700 space-y-0.5">
                    <button
                      onClick={() => {
                        onNavigate('reports');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 font-semibold text-slate-800"
                    >
                      <FileText className="w-4 h-4 text-indigo-600" />
                      My Reports Hub
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('dashboard');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4 text-blue-600" />
                      Activity & Claims
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('saved');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Bookmark className="w-4 h-4 text-amber-500" />
                      Saved / Bookmarks
                    </button>

                    {isAdminOrMod && (
                      <button
                        onClick={() => {
                          onNavigate('admin');
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-50 text-purple-700 font-bold flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4 text-purple-600" />
                        Admin Control Center
                      </button>
                    )}
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        logout();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 font-semibold text-xs flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
            >
              Sign In / Register
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2 text-sm font-semibold">
          <button
            onClick={() => {
              onNavigate('browse');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-700"
          >
            Browse Listings
          </button>
          <button
            onClick={() => {
              onNavigate('matches');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center justify-between"
          >
            <span>Potential Matches</span>
            {userMatches.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500 text-white">
                {userMatches.length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              onNavigate('reports');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            My Reports
          </button>
          <button
            onClick={() => {
              onNavigate('dashboard');
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-700"
          >
            Activity & Claims
          </button>

          {isAdminOrMod && (
            <button
              onClick={() => {
                onNavigate('admin');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 rounded-lg bg-purple-50 text-purple-700 font-bold flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Admin Portal
            </button>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                onOpenReportModal('lost');
                setIsMobileMenuOpen(false);
              }}
              className="py-2 px-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg text-center"
            >
              + Report Lost
            </button>
            <button
              onClick={() => {
                onOpenReportModal('found');
                setIsMobileMenuOpen(false);
              }}
              className="py-2 px-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg text-center"
            >
              + Report Found
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
