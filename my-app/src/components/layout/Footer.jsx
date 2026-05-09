import { Link } from 'react-router-dom';
import { Building2, Mail, MapPin } from 'lucide-react';

const cities = ['Jalandhar', 'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Pune'];

export default function Footer() {
    return (
        <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-civic-600 flex items-center justify-center">
                                <Building2 size={16} className="text-white" />
                            </div>
                            <span className="font-bold text-white text-sm">CivicSense</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">
                            Smart Civic Issue Reporting & Resolution Platform for Indian cities.
                            Report, track, and resolve civic issues transparently.
                        </p>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                            🚧 Demo Version — No real data submitted
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-semibold text-sm mb-3">Quick Links</h4>
                        <div className="flex flex-col gap-2">
                            {[
                                { to: '/report', label: 'Report an Issue' },
                                { to: '/track', label: 'Track Complaint' },
                                { to: '/map', label: 'View Map' },
                                { to: '/analytics', label: 'Analytics' },
                                { to: '/admin', label: 'Admin Panel' },
                            ].map(({ to, label }) => (
                                <Link key={to} to={to} className="text-xs hover:text-civic-400 transition-colors duration-200">
                                    → {label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Cities & Info */}
                    <div>
                        <h4 className="text-white font-semibold text-sm mb-3">Active Cities</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {cities.map((city) => (
                                <span key={city} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 text-slate-400 text-xs">
                                    <MapPin size={10} /> {city}
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <a href="mailto:demo@civicsense.in" className="flex items-center gap-1 hover:text-civic-400 transition-colors">
                                <Mail size={12} /> demo@civicsense.in
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-slate-600">
                        © 2026 CivicSense Demo. Built for Hackathon — Frontend only, no real backend.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span>Made with</span>
                        <span className="text-red-400">❤️</span>
                        <span>for Indian Smart Cities</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
