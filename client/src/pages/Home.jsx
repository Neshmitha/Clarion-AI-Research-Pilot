import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadModal from '../components/UploadModal';
import AppSidebar from '../components/AppSidebar';
import HamburgerButton from '../components/HamburgerButton';

// ── Sparkling particle background ──────────────────────────────────────────
const SparkleCanvas = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;
        const setSize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
        setSize();
        window.addEventListener('resize', setSize);

        // Two particle layers: small drifters + occasional bright sparkles
        const particles = Array.from({ length: 120 }, () => ({
            x: Math.random(),
            y: Math.random(),
            r: Math.random() * 1.4 + 0.3,
            speed: Math.random() * 0.15 + 0.03,
            alpha: Math.random() * 0.6 + 0.15,
            flicker: Math.random() * Math.PI * 2,
            flickerSpeed: Math.random() * 0.04 + 0.01,
            drift: (Math.random() - 0.5) * 0.2,
        }));

        const draw = () => {
            const w = canvas.width, h = canvas.height;
            ctx.clearRect(0, 0, w, h);
            particles.forEach(p => {
                p.flicker += p.flickerSpeed;
                const a = p.alpha * (0.6 + 0.4 * Math.sin(p.flicker));
                const grd = ctx.createRadialGradient(p.x * w, p.y * h, 0, p.x * w, p.y * h, p.r * 2.5);
                grd.addColorStop(0, `rgba(147,218,255,${a})`);
                grd.addColorStop(1, `rgba(56,189,248,0)`);
                ctx.beginPath();
                ctx.arc(p.x * w, p.y * h, p.r * 2.5, 0, Math.PI * 2);
                ctx.fillStyle = grd;
                ctx.fill();
                p.y -= p.speed * 0.0004;
                p.x += p.drift * 0.0002;
                if (p.y < 0) { p.y = 1; p.x = Math.random(); }
                if (p.x < 0 || p.x > 1) p.drift *= -1;
            });
            animId = requestAnimationFrame(draw);
        };
        draw();
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', setSize); };
    }, []);
    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

const Home = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user')) || { username: 'Researcher', email: 'user@example.com' };
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const theme = localStorage.getItem('theme') || 'dark';
    const isDark = theme === 'dark';

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleUploadSuccess = () => {
        navigate('/workspace');
    };

    return (
        <div className={`flex h-screen font-sans overflow-hidden ${isDark ? 'text-white' : 'text-black'}`} style={{ background: isDark ? '#000000' : '#ffffff' }}>
            <AppSidebar isOpen={isSidebarOpen} activePage="home" isDark={isDark} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative">
                {/* Sparkling background */}
                <SparkleCanvas />
                {/* Subtle blue glow accents */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none" style={{ background: 'rgba(56,189,248,0.07)' }} />
                <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none" style={{ background: 'rgba(14,165,233,0.05)' }} />

                {/* Header */}
                <header className={`z-10 h-20 flex items-center justify-between px-8 border-b ${isDark ? 'border-white/5 bg-black/20 text-white' : 'border-black/5 bg-white/40 text-black'} backdrop-blur-md`}>
                    <div className="flex items-center gap-4">
                        <HamburgerButton isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} isDark={isDark} />
                        <h2 className="text-xl font-semibold">Dashboard</h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-black tracking-widest uppercase">{user.username}</p>
                        </div>
                        <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center font-black text-xl flex-shrink-0 ${isDark ? 'bg-black border-[#38bdf8]/30 text-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.2)]' : 'bg-white border border-transparent text-black shadow-[2px_2px_0_rgba(56,189,248,1)]'}`}>
                            {user.username ? user.username[0].toUpperCase() : 'U'}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-12 z-10 scrollbar-hide">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-16 animate-fade-in-up">
                            <h1 className={`text-6xl font-black mb-8 leading-[1.1] tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>
                                Welcome, <span className="text-transparent bg-clip-text" style={{ backgroundImage: isDark ? 'linear-gradient(to right, #38bdf8, #ffffff)' : 'linear-gradient(to right, #0284c7, #000000)' }}>{user.username}</span>
                            </h1>
                            <div className="relative inline-block">
                                <p className={`text-2xl font-black tracking-tight italic ${isDark ? 'text-[#38bdf8] drop-shadow-[0_0_15px_rgba(56,189,248,0.4)]' : 'text-[#0284c7] drop-shadow-[2px_2px_0px_rgba(0,0,0,0.05)]'}`}>
                                    "Rethinking Research with Intelligence"
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 p-1">
                            <QuickActionCard
                                icon={<Search size={26} />}
                                title="Discover Papers"
                                desc="Search and explore millions of research papers across all domains."
                                onClick={() => navigate('/search')}
                                isDark={isDark}
                            />
                            <QuickActionCard
                                icon={<Edit3 size={26} />}
                                title="Paper Drafting"
                                desc="Create high-quality paper drafts in IEEE and Springer formats."
                                onClick={() => navigate('/draft')}
                                isDark={isDark}
                            />
                            <QuickActionCard
                                icon={<Compass size={26} />}
                                title="Research Guide"
                                desc="Follow our guided 7-stage process to build your research paper."
                                onClick={() => navigate('/guide')}
                                isDark={isDark}
                            />
                        </div>

                        <div className="flex items-center gap-3 opacity-40">
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#38bdf8]/30 to-transparent"></div>
                            <span className={`text-[10px] font-black ${isDark ? 'text-[#38bdf8]' : 'text-black'} uppercase tracking-[0.4em] whitespace-nowrap`}>Powered by AI Assistant</span>
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#38bdf8]/30 to-transparent"></div>
                        </div>
                    </div>
                </div>
            </main>

            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUploadSuccess={handleUploadSuccess}
            />
        </div>
    );
};


const QuickActionCard = ({ icon, title, desc, onClick, isDark }) => (
    <div onClick={onClick} className={`p-8 rounded-[32px] transition-all duration-500 cursor-pointer backdrop-blur-md group relative overflow-hidden ${isDark ? 'bg-black/40 border border-[#38bdf8]/10 hover:border-[#38bdf8]/40 hover:bg-[#38bdf8]/5' : 'bg-white border border-transparent hover:-translate-y-1 hover:bg-[#f8fafc] hover:shadow-[0_0_20px_rgba(56,189,248,0.5)]'}`}>
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-colors ${isDark ? 'bg-[#38bdf8]/5 group-hover:bg-[#38bdf8]/10' : 'bg-blue-100/50 group-hover:bg-blue-200/50'}`}></div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 ${isDark ? 'bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-[#38bdf8] group-hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]' : 'bg-white border border-transparent text-black group-hover:shadow-[0_0_20px_rgba(56,189,248,0.8)]'}`}>
            {icon}
        </div>
        <h3 className={`text-2xl font-black mb-3 tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>{title}</h3>
        <p className={`text-sm leading-relaxed font-medium transition-colors ${isDark ? 'text-gray-500 group-hover:text-gray-400' : 'text-gray-600 group-hover:text-gray-800'}`}>{desc}</p>
        <div className={`mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 ${isDark ? 'text-[#38bdf8]' : 'text-black'}`}>
            Access Module <span className="text-lg">→</span>
        </div>
    </div>
);

export default Home;

