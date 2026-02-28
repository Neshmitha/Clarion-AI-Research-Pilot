import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Search, FileText, Settings, LogOut,
    BookOpen, Bot, Edit3, Compass, Star, GitPullRequest
} from 'lucide-react';

// ─── Navigation Items ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
    { id: 'home', icon: LayoutDashboard, text: 'Home', path: '/home' },
    { id: 'search', icon: Search, text: 'Discover Papers', path: '/search' },
    { id: 'draft', icon: BookOpen, text: 'Paper Drafting', path: '/draft' },
    { id: 'docspace', icon: Edit3, text: 'DocSpace Editor', path: '/docspace' },
    { id: 'workspace', icon: FileText, text: 'Workspace', path: '/workspace' },
    { id: 'library', icon: Star, text: 'My Library', path: '/library' },
    { id: 'ai', icon: Bot, text: 'AI Assistant', path: '/ai' },
    { id: 'guide', icon: Compass, text: 'Research Guide', path: '/guide' },
    { id: 'contributions', icon: GitPullRequest, text: 'Contributions', path: '/contributions' },
];

// ─── Tooltip (visible only in icon-only mode) ─────────────────────────────────
const Tooltip = ({ text, isDark }) => (
    <div className={`
        absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap
        pointer-events-none opacity-0 group-hover:opacity-100
        transition-all duration-200 z-[100] shadow-xl
        ${isDark
            ? 'bg-[#1a1a1a] text-white border border-white/10'
            : 'bg-white text-black border border-gray-200 shadow-lg'}
    `}>
        {text}
        {/* Arrow */}
        <div className={`absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent
            ${isDark ? 'border-r-[#1a1a1a]' : 'border-r-white'}`} />
    </div>
);

// ─── AppSidebar ───────────────────────────────────────────────────────────────
/**
 * @param {boolean}  isOpen      - Whether sidebar is expanded (full) or collapsed (icon-only on desktop)
 * @param {string}   activePage  - ID of the active nav item (e.g. 'workspace')
 * @param {boolean}  isDark      - Theme flag
 * @param {Function} onClose     - Called when mobile backdrop is clicked
 * @param {Function} onToggle    - Called to toggle sidebar open/closed
 */
const AppSidebar = ({ isOpen, activePage, isDark, onClose, onToggle }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <>
            {/* ── Mobile Backdrop ── */}
            <div
                onClick={onClose}
                className={`
                    fixed inset-0 bg-black/50 z-40 backdrop-blur-sm
                    transition-opacity duration-300 lg:hidden
                    ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                `}
            />

            {/* ── Sidebar Panel ── */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 flex flex-col flex-shrink-0
                border-r backdrop-blur-xl
                transition-all duration-300 ease-in-out
                ${isDark
                    ? 'bg-black/90 border-white/5'
                    : 'bg-white/95 border-black/5 shadow-[4px_0_20px_rgba(0,0,0,0.06)]'}
                ${isOpen
                    ? 'w-64 translate-x-0'
                    : '-translate-x-full lg:translate-x-0 lg:w-[72px]'}
                lg:relative lg:inset-y-auto lg:left-auto
            `}>

                {/* ── Logo (clickable — toggles sidebar) ── */}
                <div
                    onClick={onToggle}
                    className={`
                        flex items-center border-b h-20 px-4 flex-shrink-0 cursor-pointer
                        transition-all duration-200 group
                        ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-black/5 hover:bg-black/[0.03]'}
                        ${isOpen ? 'gap-3' : 'justify-center'}
                    `}
                    title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    <div className={`
                        p-2 rounded-xl flex-shrink-0 transition-all duration-200
                        group-hover:shadow-[0_0_18px_rgba(56,189,248,0.45)]
                        ${isDark
                            ? 'bg-[#38bdf8]/10 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                            : 'bg-white shadow-[0_0_15px_rgba(56,189,248,0.3)]'}
                    `}>
                        <LayoutDashboard size={22} className="text-[#38bdf8]" />
                    </div>
                    <span
                        className={`
                            font-black tracking-tight text-transparent bg-clip-text text-xl
                            whitespace-nowrap overflow-hidden transition-all duration-300
                            ${isOpen ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}
                        `}
                        style={{
                            backgroundImage: isDark
                                ? 'linear-gradient(90deg, #38bdf8, #FFFFFF, #38bdf8)'
                                : 'linear-gradient(90deg, #0284c7, #000000, #0284c7)'
                        }}
                    >
                        CLARION
                    </span>
                </div>

                {/* ── Nav Items ── */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                    {NAV_ITEMS.map(item => {
                        const Icon = item.icon;
                        const active = activePage === item.id;
                        return (
                            <div
                                key={item.id}
                                onClick={() => navigate(item.path)}
                                className={`
                                    relative flex items-center gap-3 px-3 py-3 rounded-2xl
                                    cursor-pointer transition-all duration-300 group
                                    ${isOpen ? '' : 'justify-center'}
                                    ${active
                                        ? isDark
                                            ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                                            : 'bg-[#e0f2fe] text-[#0284c7] border border-[#38bdf8]'
                                        : isDark
                                            ? 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'
                                            : 'text-gray-600 border border-transparent hover:bg-white hover:border-[#38bdf8] hover:text-black hover:shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                                    }
                                `}
                            >
                                <div className={`flex-shrink-0 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                                    <Icon size={18} />
                                </div>
                                <span className={`
                                    font-medium text-sm tracking-wide whitespace-nowrap
                                    transition-all duration-300 overflow-hidden
                                    ${isOpen ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}
                                `}>
                                    {item.text}
                                </span>
                                {/* Tooltip for icon-only mode */}
                                {!isOpen && <Tooltip text={item.text} isDark={isDark} />}
                            </div>
                        );
                    })}
                </nav>

                {/* ── Bottom Actions ── */}
                <div className={`p-3 border-t space-y-1 flex-shrink-0 ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    {/* Settings */}
                    <div
                        onClick={() => navigate('/settings')}
                        className={`
                            relative flex items-center gap-3 px-3 py-3 rounded-2xl
                            cursor-pointer transition-all duration-300 group
                            ${isOpen ? '' : 'justify-center'}
                            ${isDark
                                ? 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'
                                : 'text-gray-600 border border-transparent hover:bg-white hover:border-[#38bdf8] hover:text-black hover:shadow-[0_0_15px_rgba(56,189,248,0.4)]'}
                        `}
                    >
                        <Settings size={18} className="flex-shrink-0 group-hover:scale-110 transition-transform" />
                        <span className={`font-medium text-sm whitespace-nowrap transition-all duration-300 overflow-hidden ${isOpen ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}`}>
                            Settings
                        </span>
                        {!isOpen && <Tooltip text="Settings" isDark={isDark} />}
                    </div>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className={`
                            relative flex items-center gap-3 w-full px-3 py-3 rounded-2xl
                            border border-transparent transition-all duration-300 group
                            ${isOpen ? '' : 'justify-center'}
                            ${isDark
                                ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/5'
                                : 'text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100'}
                        `}
                    >
                        <LogOut size={18} className="flex-shrink-0 group-hover:scale-110 transition-transform" />
                        <span className={`font-medium text-sm whitespace-nowrap transition-all duration-300 overflow-hidden ${isOpen ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}`}>
                            Sign Out
                        </span>
                        {!isOpen && <Tooltip text="Sign Out" isDark={isDark} />}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default AppSidebar;
