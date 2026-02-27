import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Zap, Target, BookOpen, Layers, ShieldCheck, Cpu, Globe } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();

    // Removed auto-redirect so the user can view the landing page.
    // The redirect logic has been moved to the "Get Started" button.

    return (
        <div className="w-full bg-[#050505] text-white selection:bg-blue-500/30">
            {/* Hero Section */}
            <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
                {/* Background Video */}
                <div className="absolute inset-0 z-0">
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                    >
                        <source src="/Write_the_name_202602251046_6f9k5.mp4" type="video/mp4" />
                    </video>
                </div>

                {/* Sparkling Blue Button Case Below Center */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="relative z-10 mt-[32rem]"
                >
                    <div className="relative group">
                        <motion.div
                            animate={{
                                opacity: [0.2, 0.4, 0.2],
                                scale: [1, 1.05, 1],
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute -inset-6 bg-blue-500/15 rounded-full blur-2xl group-hover:bg-blue-400/30 transition-all z-0"
                        />
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-600 rounded-xl blur-sm opacity-30 group-hover:opacity-100 transition duration-500 animate-pulse border border-white/10"></div>
                        <button
                            onClick={() => navigate('/login')}
                            className="relative flex items-center gap-3 px-8 py-3.5 bg-black/40 backdrop-blur-md border border-blue-400/40 text-white font-bold text-sm rounded-xl shadow-[0_0_30px_-5px_rgba(59,130,246,0.5)] hover:border-blue-300 hover:bg-black/60 transition-all group overflow-hidden tracking-[0.2em]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            <Sparkles size={16} className="text-blue-300 animate-pulse" />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100 uppercase font-black">Get Started</span>
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </motion.div>
            </section>

            {/* Key Features Section */}
            <section className="py-24 px-8 max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-sm font-bold text-blue-500 uppercase tracking-[0.3em] mb-4">Foundation</h2>
                    <h3 className="text-4xl md:text-5xl font-black italic">Key Features</h3>
                    <div className="w-20 h-1 bg-blue-500 mx-auto mt-6 rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Cpu className="text-blue-400" />}
                        title="AI Research Engine"
                        desc="Powered by Gemini 2.0 Flash to analyze complex academic contexts and generate novel insights."
                    />
                    <FeatureCard
                        icon={<Layers className="text-cyan-400" />}
                        title="Multi-Stage Roadmap"
                        desc="A guided 6-phase journey from domain selection to final draft with AI feedback at every step."
                    />
                    <FeatureCard
                        icon={<Globe className="text-blue-500" />}
                        title="ArXiv Integration"
                        desc="Directly fetch and analyze the latest papers from arXiv to stay at the cutting edge of research."
                    />
                    <FeatureCard
                        icon={<BookOpen className="text-indigo-400" />}
                        title="Smart Drafting"
                        desc="Generate IEEE, Springer, and Nature standard skeletons with intelligent sectioning."
                    />
                    <FeatureCard
                        icon={<Target className="text-blue-300" />}
                        title="Gap Identification"
                        desc="Automatically detect unexplored territories in current literature to find your next breakthrough."
                    />
                    <FeatureCard
                        icon={<Zap className="text-cyan-300" />}
                        title="Real-time Assistant"
                        desc="An integrated chatbot that understands your specific research documents and answers queries."
                    />
                </div>
            </section>

            {/* Why Research Pilot Section */}
            <section className="py-24 bg-gradient-to-b from-transparent to-blue-950/10 px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="flex-1">
                            <h2 className="text-blue-500 font-bold uppercase tracking-[0.2em] mb-4 text-sm">Philosophical Edge</h2>
                            <h3 className="text-4xl md:text-6xl font-black mb-8 italic leading-tight">Why Research Pilot?</h3>
                            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                                Traditional research is fragmented, slow, and overwhelming.
                                Research Pilot centralizes the entire workflow, providing the
                                <span className="text-white font-bold px-1">intellectual scaffolding</span> needed
                                to transition from a vague idea to a publishable manuscript in record time.
                            </p>
                            <ul className="space-y-6">
                                <li className="flex gap-4 items-start">
                                    <div className="p-1 rounded-full bg-blue-500/20 text-blue-400 mt-1">
                                        <ShieldCheck size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Scalable Depth</h4>
                                        <p className="text-gray-500 text-sm">Move beyond surface-level summaries to deep technical justifications.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="p-1 rounded-full bg-blue-500/20 text-blue-400 mt-1">
                                        <ShieldCheck size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Academic Integrity</h4>
                                        <p className="text-gray-500 text-sm">Enforced standard formats (IEEE/Springer) for immediate professional output.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="p-1 rounded-full bg-blue-500/20 text-blue-400 mt-1">
                                        <ShieldCheck size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Time Efficiency</h4>
                                        <p className="text-gray-500 text-sm">Save 60% of time spent on searching, organizing, and preliminary drafting.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <div className="flex-1 relative flex items-center justify-center">
                            <div className="absolute -inset-4 bg-blue-500/20 rounded-3xl blur-3xl"></div>
                            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-white/5">
                                <img
                                    src="/Screenshot 2026-02-25 at 12.18.34 PM.png"
                                    alt="Research Pilot AI Interface"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t border-white/5 px-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 justify-center md:justify-start">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 shadow-lg shadow-blue-500/20">
                                <Zap size={20} className="text-white shrink-0" />
                            </div>
                            <span className="text-xl font-black italic tracking-tighter">ResearchPilot</span>
                        </div>
                        <p className="text-gray-600 max-w-xs text-sm">
                            Empowering the next generation of academic breakthrough through agentic AI.
                        </p>
                    </div>
                    <div className="flex gap-16 text-sm">
                        <div className="space-y-4">
                            <h4 className="font-bold text-white uppercase text-xs tracking-widest">Platform</h4>
                            <ul className="text-gray-500 space-y-2">
                                <li className="hover:text-blue-400 cursor-pointer transition">Guide</li>
                                <li className="hover:text-blue-400 cursor-pointer transition">Library</li>
                                <li className="hover:text-blue-400 cursor-pointer transition">Doc Space</li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-bold text-white uppercase text-xs tracking-widest">Company</h4>
                            <ul className="text-gray-500 space-y-2">
                                <li className="hover:text-blue-400 cursor-pointer transition">Our Mission</li>
                                <li className="hover:text-blue-400 cursor-pointer transition">Privacy</li>
                                <li className="hover:text-blue-400 cursor-pointer transition">Terms</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-gray-600 text-[10px] uppercase font-bold tracking-widest gap-4">
                    <span>© 2026 ResearchPilot. All rights reserved.</span>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        Systems Active across 12 nodes
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }) => (
    <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-blue-500/30 transition-all group hover:bg-white/[0.04]">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform bg-gradient-to-br from-white/5 to-white/[0.02]">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-gray-500 leading-relaxed text-sm">{desc}</p>
    </div>
);

export default Landing;
