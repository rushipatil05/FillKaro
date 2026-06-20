import { NavLink } from 'react-router-dom';
import { Users, Clock, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const NAV = [
  { to: '/profiles', icon: Users, label: 'Profiles' },
  { to: '/history', icon: Clock, label: 'History' },
];

export default function Sidebar() {
  const [open, setOpen] = useState(true);

  return (
    <motion.aside
      layout
      initial={false}
      animate={{ width: open ? 240 : 64 }}
      className="flex-shrink-0 bg-white/95 border-r border-slate-200 flex flex-col h-screen shadow-sm backdrop-blur-sm"
    >
      {/* Logo + toggle */}
      <div className="px-4 py-4 border-b border-slate-200 relative">
        <button
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
          onClick={() => setOpen(v => !v)}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors shadow-sm"
        >
          {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>

        <div className="flex h-12 items-center justify-center">
          {open ? (
            <div className="text-center">
              <p className="font-semibold text-slate-900 text-sm leading-none">FillKaro</p>
              <p className="text-xs text-slate-400 mt-0.5">Smart Form Filler</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-2">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: open ? 2 : 0 }}
                className={`flex items-center ${open ? 'justify-start' : 'justify-center'} gap-3 px-3 py-3 rounded-3xl mb-2 text-sm font-medium transition-colors w-full border-l-4 ${isActive
                  ? 'border-brand-500 bg-brand-50/80 text-brand-700 shadow-sm ring-1 ring-brand-100'
                  : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
              >
                <Icon size={18} className={isActive ? 'text-brand-600' : ''} />
                {open && <span>{label}</span>}
                {open && isActive && (
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
    </motion.aside>
  );
}
