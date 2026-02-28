import React from 'react';

/**
 * Animated hamburger → X button
 * @param {boolean}  isOpen   - Whether sidebar is open
 * @param {Function} onToggle - Toggle callback
 * @param {boolean}  isDark   - Theme flag
 */
const HamburgerButton = ({ isOpen, onToggle, isDark }) => (
    <button
        onClick={onToggle}
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
        className={`
            relative w-10 h-10 flex flex-col items-center justify-center gap-[5px]
            rounded-xl transition-all duration-200 group flex-shrink-0
            ${isDark
                ? 'bg-white/5 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(56,189,248,0.35)]'
                : 'bg-white border-2 border-transparent shadow-sm hover:border-[#38bdf8] hover:shadow-[0_0_15px_rgba(56,189,248,0.5)] hover:-translate-y-0.5'}
        `}
    >
        {/* Top bar */}
        <span className={`
            block h-[2px] rounded-full origin-center
            transition-all duration-300 ease-in-out
            ${isDark
                ? 'bg-gray-400 group-hover:bg-[#38bdf8]'
                : 'bg-gray-600 group-hover:bg-[#0284c7]'}
            ${isOpen
                ? 'w-4 rotate-45 translate-y-[7px]'
                : 'w-5'}
        `} />
        {/* Middle bar */}
        <span className={`
            block h-[2px] rounded-full
            transition-all duration-300 ease-in-out
            ${isDark
                ? 'bg-gray-400 group-hover:bg-[#38bdf8]'
                : 'bg-gray-600 group-hover:bg-[#0284c7]'}
            ${isOpen
                ? 'w-0 opacity-0'
                : 'w-4 opacity-100'}
        `} />
        {/* Bottom bar */}
        <span className={`
            block h-[2px] rounded-full origin-center
            transition-all duration-300 ease-in-out
            ${isDark
                ? 'bg-gray-400 group-hover:bg-[#38bdf8]'
                : 'bg-gray-600 group-hover:bg-[#0284c7]'}
            ${isOpen
                ? 'w-4 -rotate-45 -translate-y-[7px]'
                : 'w-5'}
        `} />
    </button>
);

export default HamburgerButton;
