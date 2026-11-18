import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, Bell, Menu, Command, BrainCircuit } from 'lucide-react';

export default function Header({ onMenuClick }) {
  const location = useLocation();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const getPageTitle = (path) => {
    switch (path) {
      case '/dashboard': return 'Dashboard';
      case '/ai-assistant': return 'AI HR Assistant';
      case '/resumes': return 'Resume Evaluation';
      case '/employees': return 'Employee Directory';
      case '/onboarding': return 'New Hire Onboarding';
      case '/documents': return 'Knowledge Base';
      case '/analytics': return 'Workforce Intelligence';
      case '/settings': return 'System Settings';
      default: return 'HR Workspace';
    }
  };

  const notifications = [
    { id: 1, title: 'Knowledge Base Live', desc: 'Work-From-Home & Insurance guides active.', time: '10m ago' },
    { id: 2, title: 'Resume Evaluated', desc: 'Rahul Kumar matched for Full Stack role (91%).', time: '1h ago' },
    { id: 3, title: 'Milestone Completed', desc: 'Alex Rivera finished Security orientation.', time: '3h ago' }
  ];

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            {getPageTitle(location.pathname)}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Global Search Bar */}
        <div className="relative hidden md:block w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search policies, employees..."
            className="w-full pl-9 pr-10 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 focus:bg-white text-slate-900 placeholder:text-slate-400 font-medium transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-200/60 text-[10px] font-semibold text-slate-500">
            <Command className="w-2.5 h-2.5" /> K
          </div>
        </div>

        {/* AI Status Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>AI Engine Active</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 relative transition-colors cursor-pointer"
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-lg z-50 p-2 animate-fade-in">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">Notifications</span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">3 new</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                    <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{n.desc}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
