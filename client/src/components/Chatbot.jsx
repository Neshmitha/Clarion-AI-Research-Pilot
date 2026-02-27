import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bot, MessageSquare } from 'lucide-react';

const Chatbot = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Hide the floating button on specific pages
    const hiddenPaths = ['/', '/login', '/register', '/ai'];
    if (hiddenPaths.includes(location.pathname)) {
        return null;
    }

    const theme = localStorage.getItem('theme') || 'dark';
    const isDark = theme === 'dark';

    return (
        <div className="fixed bottom-8 right-8 z-[100]">
            <button
                onClick={() => navigate('/ai')}
                className={`group relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 ${isDark ? 'shadow-[0_0_20px_rgba(56,189,248,0.2)]' : 'shadow-[0_8px_30px_rgba(2,132,199,0.3)] hover:shadow-[0_12px_40px_rgba(2,132,199,0.4)] border border-[#bae6fd]'}`}
                style={{
                    background: isDark ? '#0a0a0a' : 'linear-gradient(135deg, #38bdf8, #0284c7)',
                    border: isDark ? '2px solid #38bdf8' : 'none',
                }}
            >
                {/* Glow Effect */}
                <div className={`absolute inset-0 rounded-full ${isDark ? 'bg-[#38bdf8]' : 'bg-[#fff]'} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300`}></div>

                {/* Icon */}
                <div className={`relative flex flex-col items-center justify-center ${isDark ? 'text-[#38bdf8]' : 'text-white'}`}>
                    <Bot size={28} className="group-hover:hidden" />
                    <MessageSquare size={28} className="hidden group-hover:block animate-pulse" />
                </div>
            </button>
        </div>
    );
};

export default Chatbot;
