import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { analyticsAPI } from '../services/api';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, MapPin, Loader2, AlertCircle } from 'lucide-react';

const STATUS_COLORS = {
    'Resolved': '#22c55e',
    'In Progress': '#8b5cf6',
    'Assigned': '#3b82f6',
    'Pending': '#f59e0b'
};

const TYPE_COLORS = {
    'Pothole': '#ef4444',
    'Garbage': '#f97316',
    'Drainage': '#3b82f6',
    'Streetlight': '#eab308',
    'Water Leakage': '#06b6d4',
    'Tree Fall': '#22c55e',
    'Illegal Parking': '#64748b',
    'Other': '#8b5cf6'
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg text-xs">
            {label && <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</p>}
            {payload.map((p) => (
                <div key={p.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
                    <span className="text-slate-500">{p.name}:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{p.value?.toLocaleString('en-IN')}</span>
                </div>
            ))}
        </div>
    );
};

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-civic-100 dark:bg-civic-900/30 flex items-center justify-center">
            <Icon size={18} className="text-civic-600 dark:text-civic-400" />
        </div>
        <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
    </div>
);

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        issueTypes: [],
        statusBreakdown: [],
        monthlyTrend: [],
        hotspots: []
    });

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                const [typesRes, statusRes, monthlyRes, hotspotsRes] = await Promise.all([
                    analyticsAPI.issuesByType(),
                    analyticsAPI.statusBreakdown(),
                    analyticsAPI.monthly(),
                    analyticsAPI.hotspots()
                ]);

                const types = typesRes.data || [];
                const status = statusRes.data || [];
                const monthly = monthlyRes.data || [];
                const hotspots = hotspotsRes.data || [];

                // Map Issue Types
                const issueTypes = types.map(t => ({
                    type: t.type,
                    count: t.count,
                    color: TYPE_COLORS[t.type] || TYPE_COLORS['Other']
                }));

                // Map Status Breakdown
                const statusBreakdown = status.map(s => ({
                    name: s.name,
                    value: s.value,
                    color: STATUS_COLORS[s.name] || '#64748b'
                }));

                // Map Monthly Trend
                const monthlyTrend = monthly.map(m => ({
                    month: m.month,
                    complaints: m.complaints,
                    resolved: m.resolved
                })).slice(-6); // Last 6 months

                // Map Hotspots
                const mappedHotspots = hotspots.map(h => ({
                    area: h.area,
                    complaints: h.complaints,
                    resolved: h.resolved,
                    pending: h.pending
                }));

                setData({ issueTypes, statusBreakdown, monthlyTrend, hotspots: mappedHotspots });
            } catch (err) {
                console.error('Analytics fetch error:', err);
                setError('Failed to load real-time analytics. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 size={40} className="text-civic-600 animate-spin" />
                <p className="text-slate-500 font-medium">Fetching real-time data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl auto px-4 py-16 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} className="text-red-600" />
                </div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Oops!</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="btn-primary"
                >
                    Retry Loading
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
            <div className="mb-6">
                <h1 className="section-title">City Analytics</h1>
                <p className="section-subtitle">Data-driven insights into the city's real-time civic landscape</p>
            </div>

            {/* Summary Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {data.statusBreakdown.length > 0 ? (
                    data.statusBreakdown.map(({ name, value, color }) => (
                        <div key={name} className="card text-center hover:shadow-md transition-shadow">
                            <div className="text-2xl font-bold" style={{ color }}>{value.toLocaleString('en-IN')}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{name}</div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full card p-12 text-center text-slate-400 italic">
                        No complaint data available yet.
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                {/* Issue Type Bar Chart */}
                <div className="card">
                    <SectionHeader icon={BarChart3} title="Most Reported Issues" subtitle="By category across all areas" />
                    {data.issueTypes.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={data.issueTypes} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="type" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={90} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" name="Complaints" radius={[0, 6, 6, 0]}>
                                    {data.issueTypes.map((entry) => (
                                        <Cell key={entry.type} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[240px] flex items-center justify-center text-slate-400 italic text-sm">
                            No data to display
                        </div>
                    )}
                </div>

                {/* Status Pie Chart */}
                <div className="card">
                    <SectionHeader icon={PieChartIcon} title="Resolution Status" subtitle="Current breakdown of all complaints" />
                    {data.statusBreakdown.length > 0 ? (
                        <div className="flex flex-col sm:flex-row items-center justify-between">
                            <ResponsiveContainer width="100%" height={220} className="sm:w-[60%]">
                                <PieChart>
                                    <Pie
                                        data={data.statusBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={85}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {data.statusBreakdown.map(({ name, color }) => (
                                            <Cell key={name} fill={color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-col gap-2 pr-4 flex-1 w-full sm:w-auto mt-4 sm:mt-0">
                                {data.statusBreakdown.map(({ name, value, color }) => {
                                    const total = data.statusBreakdown.reduce((s, x) => s + x.value, 0);
                                    const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                    return (
                                        <div key={name} className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-slate-600 dark:text-slate-400 truncate">{name}</span>
                                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{pct}%</span>
                                                </div>
                                                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 mt-0.5 overflow-hidden">
                                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="h-[220px] flex items-center justify-center text-slate-400 italic text-sm">
                            No data to display
                        </div>
                    )}
                </div>
            </div>

            {/* Monthly Trend Chart */}
            <div className="card mb-5">
                <SectionHeader icon={TrendingUp} title="Monthly Trend" subtitle="Complaints filed vs resolved" />
                {data.monthlyTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={data.monthlyTrend} margin={{ left: 0, right: 10, top: 5, bottom: 0 }}>
                            <defs>
                                <linearGradient id="complaintGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                            <Area type="monotone" dataKey="complaints" name="Filed" stroke="#3b82f6" strokeWidth={2} fill="url(#complaintGrad)" />
                            <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#22c55e" strokeWidth={2} fill="url(#resolvedGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[220px] flex items-center justify-center text-slate-400 italic text-sm">
                        Trend data will appear as you report more issues
                    </div>
                )}
            </div>

            {/* Hotspot Table */}
            <div className="card">
                <SectionHeader icon={MapPin} title="Hotspot Areas" subtitle="Areas with highest complaint density" />
                <div className="overflow-x-auto">
                    {data.hotspots.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="text-left text-xs text-slate-500 dark:text-slate-400 font-semibold pb-2 uppercase tracking-wide">Area</th>
                                    <th className="text-right text-xs text-slate-500 dark:text-slate-400 font-semibold pb-2 uppercase tracking-wide">Total</th>
                                    <th className="text-right text-xs text-slate-500 dark:text-slate-400 font-semibold pb-2 uppercase tracking-wide">Resolved</th>
                                    <th className="text-right text-xs text-slate-500 dark:text-slate-400 font-semibold pb-2 uppercase tracking-wide">Pending</th>
                                    <th className="text-left text-xs text-slate-500 dark:text-slate-400 font-semibold pb-2 uppercase tracking-wide pl-4">Resolution Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {data.hotspots.sort((a, b) => b.complaints - a.complaints).map(({ area, complaints: total, resolved, pending }) => {
                                    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
                                    return (
                                        <tr key={area} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="py-3 font-medium text-slate-700 dark:text-slate-300">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin size={12} className="text-slate-400" />
                                                    {area}
                                                </div>
                                            </td>
                                            <td className="py-3 text-right font-semibold text-slate-700 dark:text-slate-300">{total}</td>
                                            <td className="py-3 text-right text-green-600 dark:text-green-400 font-medium">{resolved}</td>
                                            <td className="py-3 text-right text-amber-600 dark:text-amber-400 font-medium">{pending}</td>
                                            <td className="py-3 pl-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-500"
                                                            style={{ width: `${rate}%`, background: rate >= 80 ? '#22c55e' : rate >= 60 ? '#f59e0b' : '#ef4444' }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 w-8 text-right">{rate}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-12 text-center text-slate-400 italic text-sm">
                            No area data available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
