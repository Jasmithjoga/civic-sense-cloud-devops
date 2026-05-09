import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getStatusColor, getIssueIcon, formatDateShort } from '../utils/helpers';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { Link } from 'react-router-dom';
import { X, MapPin, Filter, Search } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const STATUS_FILTERS = ['All', 'Pending', 'Assigned', 'In Progress', 'Resolved'];

export default function MapViewPage() {
    const { complaints } = useApp();
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = complaints.filter((c) => {
        const matchesStatus = statusFilter === 'All' || c.status === statusFilter;

        // Safety checks for undefined values
        const typeStr = c.type ? String(c.type).toLowerCase() : '';
        const areaStr = c.area ? String(c.area).toLowerCase() : '';
        const searchStr = searchQuery.toLowerCase();

        const matchesSearch = typeStr.includes(searchStr) || areaStr.includes(searchStr);
        return matchesStatus && matchesSearch;
    });

    const createCustomIcon = (type, color) => {
        return L.divIcon({
            html: `
                <div class="custom-marker-container" style="position: relative; width: 36px; height: 42px;">
                    <div style="
                        background: ${color}; 
                        width: 32px; 
                        height: 32px; 
                        border-radius: 50% 50% 50% 0; 
                        border: 2px solid white; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        font-size: 16px; 
                        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3); 
                        transform: rotate(-45deg); 
                        cursor: pointer;
                        position: absolute;
                        top: 0;
                        left: 2px;
                    ">
                        <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
                            ${getIssueIcon(type)}
                        </div>
                    </div>
                    <div class="pin-pulse" style="
                        position: absolute; 
                        bottom: 0; 
                        left: 50%; 
                        transform: translateX(-50%); 
                        width: 10px; 
                        height: 10px; 
                        border-radius: 50%; 
                        background: ${color};
                        z-index: -1;
                    "></div>
                </div>
            `,
            className: 'custom-pin-marker',
            iconSize: [36, 42],
            iconAnchor: [18, 42], // Tip of the pin
            popupAnchor: [0, -42]
        });
    };

    return (
        <div className="page-enter h-[calc(100vh-4rem)] flex flex-col">
            {/* Controls */}
            <div className="flex-shrink-0 px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-white">
                    <MapPin size={18} className="text-civic-600" />
                    City Map View
                </div>

                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                        type="text"
                        placeholder="Search area or issue type..."
                        className="input-field !pl-9 !py-1.5 text-xs"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                    {STATUS_FILTERS.map((s) => {
                        const count = s === 'All' ? complaints.length : complaints.filter(c => c.status === s).length;
                        return (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${statusFilter === s
                                    ? 'bg-civic-600 text-white shadow-md'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                                    }`}
                            >
                                {s} <span className="opacity-70 ml-1">({count})</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative z-0">
                <MapContainer center={[31.3264, 75.5760]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    {filtered
                        .filter(c => c.lat !== undefined && c.lng !== undefined)
                        .map((c) => (
                            <Marker
                                key={c.id}
                                position={[c.lat, c.lng]}
                                icon={createCustomIcon(c.type, getStatusColor(c.status))}
                            >
                                <Popup className="custom-popup">
                                    <div className="p-3 w-64">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">{getIssueIcon(c.type)}</span>
                                                <div>
                                                    <h3 className="text-sm font-bold text-slate-900 leading-tight">{c.type}</h3>
                                                    <p className="text-[10px] text-slate-500 uppercase font-semibold">{c.area || 'Unknown Area'}</p>
                                                </div>
                                            </div>
                                            <PriorityBadge priority={c.priority} />
                                        </div>
                                        <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">{c.description}</p>
                                        <div className="flex items-center justify-between">
                                            <StatusBadge status={c.status} />
                                            <Link to={`/track/${c.id}`} className="text-xs font-bold text-civic-600 hover:underline">
                                                View Details →
                                            </Link>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                </MapContainer>

                {/* Floating Info */}
                <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2">
                    {statusFilter !== 'All' && (
                        <div className="bg-amber-50 dark:bg-amber-900/40 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-amber-200 dark:border-amber-700/50">
                            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                                <Filter size={10} /> Showing {statusFilter} only
                            </p>
                        </div>
                    )}
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-white/20 dark:border-slate-700 pointer-events-none">
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Showing {filtered.length} of {complaints.length} issues
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
