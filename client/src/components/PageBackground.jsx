import React from 'react';

/** Plain #F8FAFC background — no gradients, no decorations */
export default function PageBackground({ children, className = '' }) {
  return (
    <div className={`min-h-screen w-full bg-[#F8FAFC] ${className}`}>
      {children}
    </div>
  );
}
