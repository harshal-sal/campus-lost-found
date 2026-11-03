import React from 'react';
import { useData } from '../contexts/DataContext';
import { AppNotification, Item } from '../types';
import {
  Bell,
  X,
  Sparkles,
  ShieldCheck,
  PackageCheck,
  CheckCircle2,
  Clock,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (item: Item) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  onSelectItem,
}) => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotification,
    getItemById,
  } = useData();

  if (!isOpen) return null;

  const getNotifIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'match_detected':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'claim_approved':
        return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
      case 'handover_scheduled':
        return <PackageCheck className="w-4 h-4 text-indigo-600" />;
      case 'item_recovered':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-500" />;
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.related_item_id) {
      const found = getItemById(notif.related_item_id);
      if (found) {
        onSelectItem(found);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800 text-base">Campus Notifications</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllNotificationsAsRead}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-medium text-sm">No notifications yet</p>
              <p className="text-xs">We'll alert you when match or claim updates occur.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer relative group ${
                  notif.is_read
                    ? 'bg-white border-slate-200 hover:bg-slate-50'
                    : 'bg-indigo-50/60 border-indigo-200 shadow-xs hover:bg-indigo-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 shrink-0 mt-0.5 shadow-xs">
                    {getNotifIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-xs text-slate-800 truncate">{notif.title}</h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                    {notif.related_item_id && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 mt-1.5 hover:underline">
                        View item details
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearNotification(notif.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 text-slate-400 hover:text-orange-600 rounded transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
