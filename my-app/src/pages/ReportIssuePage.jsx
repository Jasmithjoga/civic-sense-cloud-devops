import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ISSUE_TYPES } from '../data/mockData';
import { buildComplaint, checkDuplicate, getPriorityFromType, normalizeComplaint } from '../utils/helpers';
import { PriorityBadge } from '../components/ui/Badge';
import { complaintsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    MapPin, Camera, X, AlertTriangle, ThumbsUp, Loader2,
    Navigation, Send, Mail, CheckCircle2
} from 'lucide-react';

// Fix Leaflet default icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapEvents({ onClick, center }) {
    const map = useMap();
    useMapEvents({
        click(e) {
            onClick(e.latlng);
        },
    });
    useEffect(() => {
        if (center) {
            map.flyTo(center, 15);
        }
    }, [center, map]);
    return null;
}

export default function ReportIssuePage() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { addComplaint, complaints, upvoteComplaint } = useApp();
    const fileRef = useRef();

    const [form, setForm] = useState({
        title: '',
        type: params.get('type') || '',
        description: '',
        email: '',
    });

    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [locating, setLocating] = useState(false);
    const [location, setLocation] = useState(null);
    const [mapCenter, setMapCenter] = useState([31.3264, 75.5760]); // Jalandhar center
    const [duplicate, setDuplicate] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [selectedArea, setSelectedArea] = useState(null);

    // Real-time GPS detection
    const detectLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setMapCenter([latitude, longitude]);

                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();

                    const areaName = data.address.suburb || data.address.neighbourhood || data.address.road || data.address.subdistrict || "Detected Location";
                    const cityName = data.address.city || data.address.town || data.address.village || "Unknown City";

                    const detected = {
                        name: areaName,
                        city: cityName,
                        lat: latitude,
                        lng: longitude,
                        x: Math.random() * 300,
                        y: Math.random() * 200
                    };

                    setLocation(detected);
                    setSelectedArea(detected);
                    toast.success(`📍 Located at: ${areaName}, ${cityName}`);
                } catch (err) {
                    const fallback = {
                        name: "Current GPS Pos",
                        city: "Located",
                        lat: latitude,
                        lng: longitude,
                        x: 150, y: 150
                    };
                    setLocation(fallback);
                    setSelectedArea(fallback);
                    toast.success("📍 GPS Coordinates detected!");
                } finally {
                    setLocating(false);
                }
            },
            (error) => {
                setLocating(false);
                toast.error("Permission denied or GPS unavailable. Please select manually on map.");
                console.error('GPS Error:', error);
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    };

    const handleMapClick = async (latlng) => {
        const { lat, lng } = latlng;
        setLocating(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();

            const areaName = data.address.suburb || data.address.neighbourhood || data.address.road || data.address.subdistrict || "Selected Point";
            const cityName = data.address.city || data.address.town || data.address.village || "Unknown City";

            const selected = {
                name: areaName,
                city: cityName,
                lat,
                lng,
                x: Math.random() * 300,
                y: Math.random() * 200
            };
            setLocation(selected);
            setSelectedArea(selected);
        } catch (err) {
            const fallback = { name: "Manual Pin", city: "On Map", lat, lng, x: 150, y: 150 };
            setLocation(fallback);
            setSelectedArea(fallback);
        } finally {
            setLocating(false);
        }
    };

    // Check duplicate when type + area changes
    useEffect(() => {
        if (form.type && selectedArea) {
            const dup = checkDuplicate(form.type, selectedArea.name, complaints);
            setDuplicate(dup);
        } else {
            setDuplicate(null);
        }
    }, [form.type, selectedArea, complaints]);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
        setPhoto(file);
        const reader = new FileReader();
        reader.onload = (ev) => setPhotoPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) { toast.error('Please enter a title'); return; }
        if (!form.type) { toast.error('Please select an issue type'); return; }
        if (!form.description.trim()) { toast.error('Please describe the issue'); return; }
        if (!selectedArea) { toast.error('Please select location on map'); return; }
        if (form.description.trim().length < 20) { toast.error('Description must be at least 20 characters'); return; }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', form.title);
            formData.append('issueType', form.type);
            formData.append('description', form.description);
            formData.append('latitude', selectedArea.lat);
            formData.append('longitude', selectedArea.lng);
            formData.append('area', selectedArea.name);
            formData.append('city', selectedArea.city);
            if (form.email) formData.append('reporterEmail', form.email);
            if (photo) formData.append('image', photo);

            const data = await complaintsAPI.report(formData);
            const normalized = normalizeComplaint(data.complaint);

            if (data.message.includes('increased')) {
                toast.success('📈 Issue report count increased!');
                addComplaint(normalized);
                navigate(`/track/${normalized.id}`);
                return;
            }

            addComplaint(normalized);
            toast.success(`✅ Complaint submitted!`);
            navigate(`/success/${normalized.id}`);
        } catch (err) {
            toast.error(err.message || 'Failed to submit report');
        } finally {
            setSubmitting(false);
        }
    };

    const priority = getPriorityFromType(form.type);

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 page-enter">
            {/* Header */}
            <div className="mb-6">
                <h1 className="section-title">Report an Issue</h1>
                <p className="section-subtitle">Drop a pin on the map and describe the problem.</p>
            </div>

            {/* Duplicate Warning */}
            {duplicate && (
                <div className="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 animate-bounce-in">
                    <div className="flex items-start gap-3">
                        <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Similar Issue Nearby!</p>
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                                Complaint <strong>{duplicate.id}</strong> ({duplicate.status}) has been reported recently.
                            </p>
                            <button
                                onClick={() => { upvoteComplaint(duplicate.id); navigate(`/track/${duplicate.id}`); }}
                                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold"
                            >
                                <ThumbsUp size={12} /> Upvote Existing
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Title */}
                <div className="card">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Issue Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Large Pothole near Central Park"
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        maxLength={100}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Briefly summarize the issue in one line.</p>
                </div>

                {/* Issue Type */}
                <div className="card">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                        Issue Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {ISSUE_TYPES.map((t) => (
                            <button
                                key={t.value}
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 text-center ${form.type === t.value
                                    ? 'border-civic-500 bg-civic-50 dark:bg-civic-900/30'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-civic-300'
                                    }`}
                            >
                                <span className="text-2xl">{t.icon}</span>
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-tight">{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Description */}
                <div className="card">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        className="input-field resize-none"
                        rows={3}
                        placeholder="Detailed description (min 20 chars)..."
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        maxLength={500}
                    />
                </div>

                {/* Location Map */}
                <div className="card !p-0 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Location <span className="text-red-500">*</span>
                        </label>
                        <button
                            type="button"
                            onClick={detectLocation}
                            disabled={locating}
                            className="text-xs font-bold text-civic-600 flex items-center gap-1 hover:underline"
                        >
                            {locating ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                            Use My GPS
                        </button>
                    </div>

                    <div className="h-72 w-full relative">
                        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            />
                            <MapEvents onClick={handleMapClick} center={locating ? null : mapCenter} />
                            {location && (
                                <Marker position={[location.lat, location.lng]} />
                            )}
                        </MapContainer>
                        {!location && (
                            <div className="absolute inset-0 bg-slate-900/10 pointer-events-none flex items-center justify-center">
                                <span className="bg-white/90 px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 shadow-sm">
                                    Click anywhere on map to pick location
                                </span>
                            </div>
                        )}
                    </div>

                    {location && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 flex items-start gap-3">
                            <MapPin size={18} className="text-green-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-green-800 dark:text-green-300">{location.name}, {location.city}</p>
                                <p className="text-xs text-green-600/70">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Photo Upload */}
                <div className="card">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                        Upload Photo <span className="text-slate-400 text-xs font-normal">(optional)</span>
                    </label>
                    {photoPreview ? (
                        <div className="relative inline-block w-full">
                            <img src={photoPreview} alt="Preview" className="w-full max-h-48 object-cover rounded-xl" />
                            <button type="button" onClick={() => { setPhoto(null); setPhotoPreview(null); }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center"><X size={14} /></button>
                        </div>
                    ) : (
                        <button type="button" onClick={() => fileRef.current?.click()} className="w-full border-1 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center gap-1 hover:bg-slate-50 transition-colors">
                            <Camera size={24} className="text-slate-400" />
                            <span className="text-xs text-slate-500 font-medium">Click to upload photo</span>
                        </button>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </div>

                <div className="card">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email Notifications <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
                    <input type="email" className="input-field" placeholder="your@email.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>

                <button
                    type="submit"
                    disabled={submitting || !form.type || !form.description || !selectedArea}
                    className="w-full btn-primary justify-center py-3 text-base"
                >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /> Submit Complaint</>}
                </button>
            </form>
        </div>
    );
}
