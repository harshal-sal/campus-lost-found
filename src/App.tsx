import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { Navbar } from './components/Navbar';
import { HomeView } from './views/HomeView';
import { BrowseView } from './views/BrowseView';
import { MatchesView } from './views/MatchesView';
import { DashboardView } from './views/DashboardView';
import { MyReportsView } from './views/MyReportsView';
import { AdminPortalView } from './views/AdminPortalView';
import { ItemDetailModal } from './components/ItemDetailModal';
import { ReportItemModal } from './components/ReportItemModal';
import { ClaimModal } from './components/ClaimModal';
import { HandoverModal } from './components/HandoverModal';
import { AbuseReportModal } from './components/AbuseReportModal';
import { AuthModal } from './components/AuthModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { Item, ItemType, Claim, Handover } from './types';
import {
  ShieldCheck,
  Phone,
  Building,
  Mail,
  MapPin,
  Sparkles,
  CheckCircle2,
  Heart,
  Lock,
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const { items } = useData();

  // Navigation State
  const [currentView, setCurrentView] = useState<string>('home');
  const [searchParams, setSearchParams] = useState<{
    query: string;
    categoryId?: string;
    type?: 'all' | 'lost' | 'found';
  }>({ query: '', categoryId: 'all', type: 'all' });

  // Modal States
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<ItemType>('lost');
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimItem, setClaimItem] = useState<Item | null>(null);
  const [selectedHandover, setSelectedHandover] = useState<Handover | null>(null);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [isAbuseModalOpen, setIsAbuseModalOpen] = useState(false);
  const [abuseItem, setAbuseItem] = useState<Item | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Success Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenReportModal = (type: ItemType) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setReportType(type);
    setIsReportModalOpen(true);
  };

  const handleOpenClaimModal = (item: Item) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setClaimItem(item);
    setIsClaimModalOpen(true);
  };

  const handleOpenAbuseModal = (item: Item) => {
    setAbuseItem(item);
    setIsAbuseModalOpen(true);
  };

  const handleOpenHandoverModal = (handover: Handover) => {
    setSelectedHandover(handover);
    setIsHandoverModalOpen(true);
  };

  const handleSearchFromHome = (
    query: string,
    categoryId?: string,
    type?: 'all' | 'lost' | 'found'
  ) => {
    setSearchParams({ query, categoryId: categoryId || 'all', type: type || 'all' });
  };

  const handleReportSuccess = (item: Item) => {
    showToast(`Successfully published ${item.type === 'lost' ? 'Lost' : 'Found'} report for "${item.title}"!`);
  };

  const handleClaimSuccess = (claim: Claim) => {
    showToast('Ownership claim submitted for campus security verification!');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/60 font-sans text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* 1. Main Responsive Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenReportModal={handleOpenReportModal}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* 2. Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 3. Active View Rendering */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomeView
            onSelectItem={setSelectedItem}
            onNavigate={setCurrentView}
            onOpenReportModal={handleOpenReportModal}
            onSearch={handleSearchFromHome}
          />
        )}

        {currentView === 'browse' && (
          <BrowseView
            initialSearch={searchParams.query}
            initialCategory={searchParams.categoryId}
            initialType={searchParams.type}
            onSelectItem={setSelectedItem}
            onOpenReportModal={handleOpenReportModal}
          />
        )}

        {currentView === 'matches' && (
          <MatchesView
            onSelectItem={setSelectedItem}
            onOpenClaim={handleOpenClaimModal}
            onNavigate={setCurrentView}
          />
        )}

        {(currentView === 'reports' || currentView === 'my-reports') && (
          <MyReportsView
            onSelectItem={setSelectedItem}
            onOpenReportModal={handleOpenReportModal}
            onNavigate={setCurrentView}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {currentView === 'dashboard' && (
          <DashboardView
            onSelectItem={setSelectedItem}
            onOpenReportModal={handleOpenReportModal}
            onOpenHandoverModal={handleOpenHandoverModal}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {currentView === 'saved' && (
          <DashboardView
            onSelectItem={setSelectedItem}
            onOpenReportModal={handleOpenReportModal}
            onOpenHandoverModal={handleOpenHandoverModal}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {currentView === 'admin' && (
          <AdminPortalView
            onSelectItem={setSelectedItem}
            onOpenHandoverModal={handleOpenHandoverModal}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}
      </main>

      {/* 5. Modals */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onOpenClaim={handleOpenClaimModal}
        onOpenReportAbuse={handleOpenAbuseModal}
        onSelectMatchedItem={setSelectedItem}
      />

      <ReportItemModal
        initialType={reportType}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={handleReportSuccess}
      />

      <ClaimModal
        item={claimItem}
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        onSuccess={handleClaimSuccess}
      />

      <HandoverModal
        handover={selectedHandover}
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
        onSuccess={() => showToast('Item handover confirmed and marked as Recovered!')}
      />

      <AbuseReportModal
        item={abuseItem}
        isOpen={isAbuseModalOpen}
        onClose={() => setIsAbuseModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectItem={setSelectedItem}
      />

      {/* 6. Campus Footer */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 pt-12 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-xs">
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-black text-sm">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                CL
              </div>
              Campus Lost & Found
            </div>
            <p className="text-slate-400 leading-relaxed">
              Official university lost and found network protecting student belongings with strict privacy, automated similarity matching, and safe security handovers.
            </p>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              End-to-end confidential claim verification
            </div>
          </div>

          {/* Quick Hubs */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Designated Campus Hubs
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" /> Main Library Front Circulation Desk
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" /> Campus Public Safety (Admin Annex 102)
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" /> Student Union Information Desk
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" /> Recreation Center Check-in
              </li>
            </ul>
          </div>

          {/* Emergency & Support */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Campus Safety Helpline
            </h4>
            <div className="space-y-1.5 text-slate-400">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                <span>24/7 Security: (555) 019-911</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>lostandfound@campus.edu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-400" />
                <span>Mon - Fri: 8:00 AM - 8:00 PM</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Quick Navigation
            </h4>
            <div className="flex flex-col space-y-1.5 text-slate-400 font-medium">
              <button
                onClick={() => setCurrentView('browse')}
                className="text-left hover:text-white"
              >
                Browse All Listings
              </button>
              <button
                onClick={() => handleOpenReportModal('lost')}
                className="text-left hover:text-white"
              >
                Report Lost Belongings
              </button>
              <button
                onClick={() => handleOpenReportModal('found')}
                className="text-left hover:text-white"
              >
                Report Found Items
              </button>
              <button
                onClick={() => setCurrentView('matches')}
                className="text-left hover:text-white"
              >
                Smart Similarity Matches
              </button>
              <button
                onClick={() => setCurrentView('admin')}
                className="text-left hover:text-purple-400 font-bold"
              >
                Campus Admin & SQL Schema
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500 text-[11px]">
          <div>© {new Date().getFullYear()} Campus Lost & Found System. Central University Network.</div>
          <div className="flex items-center gap-4">
            <span>Campus Privacy & Security Policy</span>
            <span>•</span>
            <span>Terms of Recovery</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainAppContent />
      </DataProvider>
    </AuthProvider>
  );
}
