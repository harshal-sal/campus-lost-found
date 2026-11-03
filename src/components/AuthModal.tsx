import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserType } from '../types';
import {
  X,
  Lock,
  Mail,
  User,
  GraduationCap,
  Briefcase,
  Shield,
  Phone,
  Building,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [studentStaffId, setStudentStaffId] = useState('');
  const [department, setDepartment] = useState('');
  const [campus, setCampus] = useState('Main Campus');
  const [userType, setUserType] = useState<UserType>('student');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAccountHints, setShowAccountHints] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (mode === 'login') {
      const res = await login(email, password);
      setIsLoading(false);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Login failed. Please check your credentials.');
      }
    } else {
      if (!fullName.trim()) {
        setError('Please enter your full legal name.');
        setIsLoading(false);
        return;
      }
      const res = await register({
        email,
        password,
        full_name: fullName,
        user_type: userType,
        phone,
        student_staff_id: studentStaffId,
        department,
        campus,
      });
      setIsLoading(false);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Registration failed.');
      }
    }
  };

  const handleFillDemoAccount = (sampleEmail: string) => {
    setEmail(sampleEmail);
    setPassword('••••••••');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              CL
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {mode === 'login' ? 'Campus Account Sign In' : 'Create Campus Account'}
              </h2>
              <p className="text-[11px] text-slate-500">Official Campus Lost & Found Network</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation: Sign In vs Register */}
        <div className="px-6 pt-4 bg-white">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`py-2 text-xs font-bold rounded-md transition-all ${
                mode === 'login'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`py-2 text-xs font-bold rounded-md transition-all ${
                mode === 'register'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register New Account
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-orange-50 border border-orange-200 text-orange-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Campus Role / Affiliation *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'student', label: 'Student', icon: GraduationCap },
                    { id: 'faculty', label: 'Faculty', icon: Briefcase },
                    { id: 'staff', label: 'Staff / Admin', icon: Shield },
                  ].map((type) => {
                    const Icon = type.icon;
                    const isSelected = userType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setUserType(type.id as UserType)}
                        className={`p-2 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              University Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@campus.edu"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Must end with campus domain (e.g. .edu, .ac.in, campus.edu)
            </p>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Password *
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Student / Staff ID
                  </label>
                  <input
                    type="text"
                    value={studentStaffId}
                    onChange={(e) => setStudentStaffId(e.target.value)}
                    placeholder="e.g. STU-2024-8841"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department / Major
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Campus Zone
                  </label>
                  <input
                    type="text"
                    value={campus}
                    onChange={(e) => setCampus(e.target.value)}
                    placeholder="Main Campus"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              'Authenticating...'
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account & Sign In'
            )}
          </button>

          {/* Reference Demo Accounts Accordion / Helper */}
          {mode === 'login' && (
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAccountHints(!showAccountHints)}
                className="text-[11px] text-slate-500 hover:text-slate-700 font-medium flex items-center justify-center gap-1 w-full"
              >
                <Info className="w-3.5 h-3.5 text-indigo-500" />
                <span>{showAccountHints ? 'Hide' : 'Show'} Sample Campus Accounts</span>
              </button>

              {showAccountHints && (
                <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5 animate-in fade-in duration-100">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    Click to fill test credentials:
                  </p>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => handleFillDemoAccount('alex.rivera@campus.edu')}
                      className="w-full text-left p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-200 flex items-center justify-between text-[11px]"
                    >
                      <span className="font-semibold text-slate-800">alex.rivera@campus.edu</span>
                      <span className="text-[10px] text-indigo-600 font-medium">Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFillDemoAccount('sarah.jenkins@campus.edu')}
                      className="w-full text-left p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-200 flex items-center justify-between text-[11px]"
                    >
                      <span className="font-semibold text-slate-800">sarah.jenkins@campus.edu</span>
                      <span className="text-[10px] text-emerald-600 font-medium">Faculty</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFillDemoAccount('marcus.vance@campus.edu')}
                      className="w-full text-left p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-200 flex items-center justify-between text-[11px]"
                    >
                      <span className="font-semibold text-slate-800">marcus.vance@campus.edu</span>
                      <span className="text-[10px] text-amber-600 font-medium">Security Officer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFillDemoAccount('admin.elena@campus.edu')}
                      className="w-full text-left p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-200 flex items-center justify-between text-[11px]"
                    >
                      <span className="font-semibold text-slate-800">admin.elena@campus.edu</span>
                      <span className="text-[10px] text-purple-600 font-medium">Campus Admin</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
