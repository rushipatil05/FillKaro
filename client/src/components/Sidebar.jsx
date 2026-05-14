import { NavLink } from 'react-router-dom';
import { Users, Clock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV = [
  { to: '/profiles',  icon: Users,           label: 'Profiles'  },
  { to: '/history',   icon: Clock,            label: 'History'   },
];

export default function Sidebar() {
  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm leading-none">AutoForm AI</p>
            <p className="text-xs text-slate-400 mt-0.5">Smart Form Filler</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 2 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon size={17} className={isActive ? 'text-brand-600' : ''} />
                {label}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500"
                  />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100">
        <p className="text-xs text-slate-400">v1.0.0 · Local MongoDB</p>
      </div>
    </aside>
  );
}
