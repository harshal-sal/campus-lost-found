import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Item, Claim, ReportAbuse, Handover, AuditLog } from '../types';
import { StatusBadge, TypeBadge } from '../components/StatusBadge';
import { SUPABASE_DATABASE_SCHEMA_SQL as SUPABASE_SCHEMA_SQL } from '../data/supabaseSchemaSQL';
import {
  Shield,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Layers,
  Database,
  Search,
  Trash2,
  Eye,
  FileCode,
  Copy,
  Check,
  Building,
  Flag,
  UserCheck,
  TrendingUp,
  MapPin,
  Lock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface AdminPortalViewProps {
  onSelectItem: (item: Item) => void;
  onOpenHandoverModal: (handover: Handover) => void;
  onOpenAuthModal?: () => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  onSelectItem,
  onOpenHandoverModal,
  onOpenAuthModal,
}) => {
  const { currentUser } = useAuth();
  const {
    items,
    claims,
    handovers,
    abuseReports,
    auditLogs,
    categories,
    locations,
    reviewClaim,
    resolveAbuseReport,
    deleteItem,
    updateItemStatus,
  } = useData();

  const [activeTab, setActiveTab] = useState<
    'claims' | 'items' | 'abuse' | 'audit' | 'database'
  >('claims');

  const [selectedClaimForReview, setSelectedClaimForReview] = useState<Claim | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [handoverLocation, setHandoverLocation] = useState(
    'Public Safety Central Desk - Admin Annex Room 102'
  );
  const [copiedSql, setCopiedSql] = useState(false);

  const isAuthorized =
    currentUser?.role === 'admin' || currentUser?.role === 'moderator';

  if (!isAuthorized) {
    return (
      <div className="max-w-xl mx-auto my-16 px-4">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto border border-indigo-200 shadow-2xs">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 mb-2">
              Campus Security & Administration
            </span>
            <h2 className="text-xl font-bold text-slate-800">Restricted Operations Portal</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-md mx-auto">
              This area requires authorized Campus Public Safety Officer or University Administrator credentials to review ownership verification keys, moderate listings, and execute physical handovers.
            </p>
          </div>

          <div className="pt-2">
            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors inline-flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                Sign In with Authorized Account
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const pendingClaims = claims.filter((c) => c.status === 'pending');
  const pendingAbuseReports = abuseReports.filter((r) => r.status === 'pending');
  const activeLostCount = items.filter((i) => i.type === 'lost' && i.status === 'lost').length;
  const activeFoundCount = items.filter((i) => i.type === 'found' && i.status === 'found').length;
  const recoveredCount = items.filter((i) => i.status === 'recovered').length;
  const recoveryRate = items.length > 0 ? Math.round((recoveredCount / items.length) * 100) : 0;

  const handleApproveClaim = async (claimId: string) => {
    await reviewClaim(
      claimId,
      'approved',
      reviewerNotes || 'Verified matching ownership details against campus records.',
      handoverLocation
    );
    setSelectedClaimForReview(null);
    setReviewerNotes('');
  };

  const handleRejectClaim = async (claimId: string) => {
    await reviewClaim(
      claimId,
      'rejected',
      reviewerNotes || 'Provided details do not match item verification key.'
    );
    setSelectedClaimForReview(null);
    setReviewerNotes('');
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header & KPI Summary Cards */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200 mb-1">
              <Shield className="w-3.5 h-3.5" />
              Campus Safety & Admin Control Center
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              Campus Lost & Found Operations Portal
            </h1>
            <p className="text-xs text-slate-500">
              Review ownership verification claims, moderate item listings, resolve flagged abuse reports, and audit safety logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              Role: <strong className="capitalize text-slate-900">{currentUser?.role}</strong>
            </span>
          </div>
        </div>

        {/* 5 KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-2xl font-bold text-slate-800">{items.length}</div>
            <div className="text-xs font-medium text-slate-500">Total Campus Reports</div>
          </div>

          <div className="p-4 bg-amber-50/70 rounded-lg border border-amber-200">
            <div className="text-2xl font-bold text-amber-700">{pendingClaims.length}</div>
            <div className="text-xs font-medium text-amber-900">Pending Claim Reviews</div>
          </div>

          <div className="p-4 bg-orange-50/70 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-700">{pendingAbuseReports.length}</div>
            <div className="text-xs font-medium text-orange-900">Flagged Abuse Reports</div>
          </div>

          <div className="p-4 bg-emerald-50/70 rounded-lg border border-emerald-200">
            <div className="text-2xl font-bold text-emerald-700">{recoveredCount}</div>
            <div className="text-xs font-medium text-emerald-900">Items Recovered</div>
          </div>

          <div className="p-4 bg-indigo-50/70 rounded-lg border border-indigo-200">
            <div className="text-2xl font-bold text-indigo-700">{recoveryRate}%</div>
            <div className="text-xs font-medium text-indigo-900">Recovery Rate</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs flex flex-wrap gap-1.5">
        {[
          { id: 'claims', label: 'Claim Verification Queue', count: pendingClaims.length, icon: Shield },
          { id: 'items', label: 'Item Listings Moderation', count: items.length, icon: Layers },
          { id: 'abuse', label: 'Abuse & Flagged Reports', count: pendingAbuseReports.length, icon: Flag },
          { id: 'audit', label: 'Security Audit Logs', count: auditLogs.length, icon: Clock },
          { id: 'database', label: 'Supabase SQL & Schema', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Claims Verification Workbench */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          {claims.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <div className="font-bold text-slate-800">All Caught Up!</div>
              <p className="text-xs">No pending ownership claims awaiting review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map((claim) => {
                const item = items.find((i) => i.id === claim.item_id);
                const matchedHandover = handovers.find((h) => h.claim_id === claim.id);
                const isSelectedForReview = selectedClaimForReview?.id === claim.id;

                return (
                  <div
                    key={claim.id}
                    className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-800">
                            Claim from {claim.claimant_name} ({claim.claimant_type})
                          </h3>
                          <StatusBadge status={claim.status} />
                        </div>
                        <p className="text-xs text-slate-500">
                          Claimed on {new Date(claim.created_at).toLocaleString()} • Student/Staff ID:{' '}
                          {claim.claimant_id_number || 'N/A'} • Phone: {claim.claimant_phone || 'N/A'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {item && (
                          <button
                            onClick={() => onSelectItem(item)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Inspect Item
                          </button>
                        )}
                        {matchedHandover && (
                          <button
                            onClick={() => onOpenHandoverModal(matchedHandover)}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg flex items-center gap-1"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                            PIN: {matchedHandover.verification_pin}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Verification Comparison Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: What the Claimant Submitted */}
                      <div className="p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-2">
                        <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 uppercase tracking-wider">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                          Claimant Verification Answers
                        </div>
                        <div className="text-xs text-slate-700 space-y-1.5">
                          <p>
                            <strong>Details: </strong>
                            {claim.verification_details}
                          </p>
                          {claim.unique_identifier && (
                            <p>
                              <strong>Serial / Identifier: </strong>
                              {claim.unique_identifier}
                            </p>
                          )}
                          <p>
                            <strong>Misplaced Circumstances: </strong>
                            {claim.lost_place_time}
                          </p>
                          {claim.proof_url && (
                            <p>
                              <strong>Uploaded Proof Document: </strong>
                              <a
                                href={claim.proof_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 underline font-semibold break-all"
                              >
                                {claim.proof_url}
                              </a>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Secret Verification Key from Item Report */}
                      <div className="p-4 bg-slate-900 text-white rounded-lg border border-slate-800 space-y-2">
                        <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                          <Lock className="w-3.5 h-3.5" />
                          Hidden Verification Key (Stored Secret)
                        </div>
                        <div className="text-xs text-slate-200 space-y-1.5">
                          <p>
                            <strong>Item: </strong>
                            {item?.title || 'Unknown Item'}
                          </p>
                          <p>
                            <strong>Original Secret Key: </strong>
                            {item?.secret_verification_key ||
                              'No private key set. Verify by physical visual inspection.'}
                          </p>
                          <p>
                            <strong>Distinguishing Features: </strong>
                            {item?.distinguishing_features || 'None listed.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Review Action Controls */}
                    {claim.status === 'pending' && (
                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex-1 w-full sm:w-auto">
                          <input
                            type="text"
                            value={
                              isSelectedForReview ? reviewerNotes : ''
                            }
                            onChange={(e) => {
                              setSelectedClaimForReview(claim);
                              setReviewerNotes(e.target.value);
                            }}
                            placeholder="Reviewer notes for official record / claimant feedback..."
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRejectClaim(claim.id)}
                            className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs rounded-lg border border-orange-200 flex items-center gap-1 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject Claim
                          </button>

                          <button
                            onClick={() => handleApproveClaim(claim.id)}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve & Schedule Handover PIN
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Item Listings Moderation Table */}
      {activeTab === 'items' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Reporter</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-800">{item.title}</div>
                          <div className="text-slate-500 text-[11px] truncate max-w-xs">
                            {item.location_detail || 'Campus Area'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <TypeBadge type={item.type} />
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{item.owner_name}</div>
                      <div className="text-slate-400 text-[10px]">{item.owner_email}</div>
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="px-4 py-3 text-slate-500">
                      {new Date(item.date_occurred).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => onSelectItem(item)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => updateItemStatus(item.id, 'recovered')}
                        className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg"
                        title="Mark Recovered"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-slate-100 rounded-lg"
                        title="Delete listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Abuse Reports Resolution Queue */}
      {activeTab === 'abuse' && (
        <div className="space-y-4">
          {abuseReports.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <div className="font-bold text-slate-800">No Abuse Reports</div>
              <p className="text-xs">Campus listings are clean with zero unresolved flags.</p>
            </div>
          ) : (
            abuseReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-orange-600" />
                    <span className="font-bold text-sm text-slate-800">
                      Report for: {report.item_title}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        report.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {report.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    <strong>Reason: </strong> {report.reason.replace('_', ' ')} •{' '}
                    <strong>Details: </strong> {report.description}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    Submitted on {new Date(report.created_at).toLocaleString()}
                  </span>
                </div>

                {report.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => resolveAbuseReport(report.id, 'dismissed')}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg"
                    >
                      Dismiss Flag
                    </button>
                    <button
                      onClick={() => {
                        deleteItem(report.item_id);
                        resolveAbuseReport(report.id, 'item_removed');
                      }}
                      className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg shadow-xs"
                    >
                      Remove Item Listing
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: Security Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Campus System Audit Trail
            </h3>
            <span className="text-xs text-slate-500">{auditLogs.length} total events logged</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5">Action</th>
                  <th className="px-4 py-2.5">User</th>
                  <th className="px-4 py-2.5">Entity</th>
                  <th className="px-4 py-2.5">Metadata Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 font-mono text-[11px]">
                    <td className="px-4 py-2 text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2 font-bold text-indigo-700">{log.action}</td>
                    <td className="px-4 py-2 text-slate-800">{log.user_name}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {log.entity_type} #{log.entity_id.slice(-6)}
                    </td>
                    <td className="px-4 py-2 text-slate-500 font-sans text-xs">
                      {JSON.stringify(log.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Supabase SQL Schema Exporter */}
      {activeTab === 'database' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                Production Supabase SQL Schema & Row Level Security (RLS)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ready-to-execute PostgreSQL migration script with strict Row Level Security (RLS) policies and performance indexes.
              </p>
            </div>

            <button
              onClick={handleCopySql}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
            >
              {copiedSql ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied SQL to Clipboard!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Supabase SQL
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <pre className="p-4 bg-slate-900 text-emerald-300 font-mono text-xs rounded-lg overflow-x-auto max-h-[500px] border border-slate-800">
              {SUPABASE_SCHEMA_SQL}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
