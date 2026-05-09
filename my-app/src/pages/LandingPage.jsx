import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ISSUE_TYPES } from '../data/mockData';
import { analyticsAPI } from '../services/api';
import {
    FileText, Search, MapPin, BarChart3, CheckCircle2,
    Clock, Users, Building2, Shield, ChevronRight, ArrowRight,
    Zap, Globe, Smartphone, Bot, MessageCircle
} from 'lucide-react';

function AnimatedNumber({ target, duration = 1500, prefix = '', suffix = '' }) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [target, duration]);
    return <span>{prefix}{count.toLocaleString('en-IN')}{suffix}</span>;
}

const colorMap = {
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', icon: 'text-blue-600 dark:text-blue-400', num: 'text-blue-700 dark:text-blue-300' },
    green: { bg: 'bg-green-100 dark:bg-green-900/30', icon: 'text-green-600 dark:text-green-400', num: 'text-green-700 dark:text-green-300' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', icon: 'text-amber-600 dark:text-amber-400', num: 'text-amber-700 dark:text-amber-300' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', icon: 'text-purple-600 dark:text-purple-400', num: 'text-purple-700 dark:text-purple-300' },
};

const HOW_IT_WORKS = [
    { step: '01', title: 'Report the Issue', desc: 'Take a photo, select issue type, and drop a pin on the map. Submit in under 30 seconds.', icon: FileText, color: 'bg-blue-500' },
    { step: '02', title: 'Track Progress', desc: 'Get a unique complaint ID instantly. Track resolution status in real time.', icon: Search, color: 'bg-purple-500' },
    { step: '03', title: 'See Resolution', desc: 'Assigned dept sends a team. You get notified when the issue is fixed.', icon: CheckCircle2, color: 'bg-green-500' },
];

const FUTURE_SCOPE = [
    { icon: Bot, title: 'AI Duplicate Detection', desc: 'ML model clusters similar issues to reduce redundant reports by 60%.' },
    { icon: MessageCircle, title: 'WhatsApp Bot Reporting', desc: 'Citizens report via WhatsApp without installing any app.' },
    { icon: Shield, title: 'Govt System Integration', desc: 'Direct API integration with municipal corporation ERP systems.' },
    { icon: Zap, title: 'Predictive Maintenance', desc: 'AI predicts infrastructure failures before they happen.' },
    { icon: Smartphone, title: 'Native Mobile App', desc: 'PWA and native apps for iOS & Android with offline support.' },
    { icon: Globe, title: 'Multi-City Expansion', desc: 'Scalable to 100+ cities with regional language support.' },
];

export default function LandingPage() {
    const [stats, setStats] = useState({
        total: 0,
        resolved: 0,
        avgDays: 4.2, // Default fallback
        cities: 1
    });
    const [monthlyData, setMonthlyData] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [summaryRes, monthlyRes] = await Promise.all([
                    analyticsAPI.summary(),
                    analyticsAPI.monthly()
                ]);
                const summary = summaryRes.data || {};
                const monthly = monthlyRes.data || [];

                setStats({
                    total: summary.totalComplaints || 0,
                    resolved: summary.resolvedIssues || 0,
                    avgDays: 4.2,
                    cities: 1
                });
                setMonthlyData(monthly.map(m => ({
                    month: m.month,
                    complaints: m.complaints,
                    resolved: m.resolved
                })).slice(-6));
            } catch (err) {
                console.error('Landing stats fetch error:', err);
            }
        };
        fetchStats();
    }, []);

    const statsData = [
        { label: 'Total Complaints', value: stats.total, icon: FileText, color: 'blue', prefix: '', suffix: '+' },
        { label: 'Resolved Issues', value: stats.resolved, icon: CheckCircle2, color: 'green', prefix: '', suffix: '+' },
        { label: 'Avg Resolution', value: stats.avgDays, icon: Clock, color: 'amber', prefix: '', suffix: ' days' },
        { label: 'Cities Covered', value: stats.cities, icon: Globe, color: 'purple', prefix: '', suffix: '' },
    ];

    return (
        <div className="page-enter">
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-br from-civic-900 via-civic-700 to-cyan-600 text-white">
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm mb-6 animate-fade-in">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-white/80">Live Demo — Smart City Platform 2026</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-slide-up">
                            Report Civic Issues.{' '}
                            <span className="text-cyan-300">Track Resolution.</span>{' '}
                            Build Better Cities.
                        </h1>
                        <p className="text-lg text-white/70 mb-8 max-w-xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
                            Empowering Indian citizens to report, track and resolve civic problems transparently.
                            From potholes to drainage — every issue gets heard.
                        </p>
                        <div className="flex flex-wrap gap-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            <Link to="/report" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-civic-700 font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
                                <FileText size={18} />
                                Report an Issue
                            </Link>
                            <Link to="/track" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/30 text-white font-bold rounded-xl hover:bg-white/20 transition-all duration-200">
                                <Search size={18} />
                                Track Complaint
                            </Link>
                            <Link to="/map" className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 font-bold rounded-xl hover:bg-cyan-500/30 transition-all duration-200">
                                <MapPin size={18} />
                                View Map
                            </Link>
                        </div>
                    </div>

                    {/* Floating issue type pills */}
                    <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col gap-3">
                        {ISSUE_TYPES.slice(0, 5).map((t, i) => (
                            <div
                                key={t.value}
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-sm text-white"
                                style={{ animation: `slideUp 0.4s ease-out ${i * 0.1}s both` }}
                            >
                                <span className="text-lg">{t.icon}</span>
                                <span>{t.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Wave separator */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 40L1440 40L1440 0C1200 30 960 40 720 40C480 40 240 30 0 0L0 40Z" className="fill-slate-50 dark:fill-slate-900" />
                    </svg>
                </div>
            </section>

            {/* Stats */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statsData.map(({ label, value, icon: Icon, color, prefix, suffix }) => {
                        const c = colorMap[color];
                        return (
                            <div key={label} className="card text-center hover:shadow-md transition-shadow">
                                <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center mx-auto mb-3`}>
                                    <Icon size={22} className={c.icon} />
                                </div>
                                <div className={`text-2xl font-bold ${c.num}`}>
                                    <AnimatedNumber target={value} prefix={prefix} suffix={suffix} />
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Issue Types Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <div className="text-center mb-8">
                    <h2 className="section-title">Report Any Civic Issue</h2>
                    <p className="section-subtitle">From infrastructure to sanitation — we cover it all</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {ISSUE_TYPES.map((t) => (
                        <Link key={t.value} to={`/report?type=${t.value}`}
                            className="card-hover flex flex-col items-center gap-2 py-5 text-center group">
                            <span className="text-3xl group-hover:scale-110 transition-transform duration-200">{t.icon}</span>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t.label}</span>
                            <span className="text-xs text-slate-400">{t.description}</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="section-title">How It Works</h2>
                        <p className="section-subtitle">Three simple steps to get your civic issue resolved</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                        {/* Connecting arrows (desktop) */}
                        <div className="hidden md:flex absolute top-16 left-1/3 right-1/3 items-center justify-between px-4 z-0">
                            <ArrowRight size={24} className="text-slate-300 dark:text-slate-600" />
                            <ArrowRight size={24} className="text-slate-300 dark:text-slate-600" />
                        </div>
                        {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon, color }) => (
                            <div key={step} className="card relative z-10 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                                    <Icon size={24} className="text-white" />
                                </div>
                                <div className="absolute top-4 right-4 text-4xl font-black text-slate-100 dark:text-slate-700">{step}</div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Monthly trend mini chart */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="section-title text-lg">Monthly Activity</h2>
                            <p className="section-subtitle">Complaints filed vs resolved (last 6 months)</p>
                        </div>
                        <Link to="/analytics" className="btn-secondary text-xs">
                            View Full Analytics <ChevronRight size={14} />
                        </Link>
                    </div>
                    <div className="flex items-end gap-3 h-28">
                        {monthlyData.length > 0 ? (
                            monthlyData.map(({ month, complaints, resolved }) => {
                                const maxVal = Math.max(...monthlyData.map(d => Math.max(d.complaints, d.resolved))) || 10;
                                return (
                                    <div key={month} className="flex-1 flex flex-col items-center gap-1">
                                        <div className="w-full flex flex-col items-center gap-0.5">
                                            <div className="w-full flex gap-0.5 items-end justify-center">
                                                <div
                                                    className="flex-1 bg-civic-200 dark:bg-civic-700 rounded-t-sm transition-all duration-500"
                                                    style={{ height: `${(complaints / maxVal) * 80}px` }}
                                                    title={`Reported: ${complaints}`}
                                                />
                                                <div
                                                    className="flex-1 bg-green-400 dark:bg-green-600 rounded-t-sm transition-all duration-500"
                                                    style={{ height: `${(resolved / maxVal) * 80}px` }}
                                                    title={`Resolved: ${resolved}`}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-400">{month}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="w-full flex items-center justify-center text-slate-400 italic text-sm">
                                Not enough data for trend analysis
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <div className="w-3 h-3 rounded-sm bg-civic-200 dark:bg-civic-700" /> Complaints
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <div className="w-3 h-3 rounded-sm bg-green-400" /> Resolved
                        </div>
                    </div>
                </div>
            </section>

            {/* Future Scope */}
            <section className="bg-gradient-to-br from-civic-900 to-slate-900 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-white">Future Roadmap</h2>
                        <p className="text-slate-400 text-sm mt-1">What's next for CivicSense 2.0</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {FUTURE_SCOPE.map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200">
                                <div className="w-10 h-10 rounded-xl bg-civic-600/30 flex items-center justify-center flex-shrink-0">
                                    <Icon size={18} className="text-civic-300" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
                                    <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
