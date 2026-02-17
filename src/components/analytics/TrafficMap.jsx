import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import 'leaflet/dist/leaflet.css';

export default function TrafficMap() {
    const [mapReady, setMapReady] = useState(false);

    const { data: recentVisits = [] } = useQuery({
        queryKey: ['recentVisits'],
        queryFn: async () => {
            const visits = await base44.entities.Visit.list('-created_date', 100);
            
            // Get all admin wallet addresses to filter them out
            const admins = await base44.entities.Admin.list();
            const adminWallets = admins.map(a => a.wallet_address?.toLowerCase()).filter(Boolean);
            
            return visits.filter(v => 
                v.latitude && 
                v.longitude && 
                !adminWallets.includes(v.wallet_address?.toLowerCase())
            );
        },
        refetchInterval: 10000 // Refresh every 10 seconds
    });

    useEffect(() => {
        setMapReady(true);
    }, []);

    if (!mapReady) {
        return (
            <div className="w-full h-[500px] bg-white/5 rounded-xl flex items-center justify-center">
                <p className="text-gray-400">Loading map...</p>
            </div>
        );
    }

    return (
        <div className="w-full h-[500px] rounded-xl overflow-hidden border border-white/10">
            <MapContainer
                center={[20, 0]}
                zoom={2}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {recentVisits.map((visit, index) => {
                    const minutesAgo = Math.floor((new Date() - new Date(visit.created_date)) / 60000);
                    const opacity = Math.max(0.3, 1 - (minutesAgo / 60));
                    
                    return (
                        <CircleMarker
                            key={visit.id}
                            center={[visit.latitude, visit.longitude]}
                            radius={8}
                            fillColor={visit.is_new_visitor ? "#22d3ee" : "#a855f7"}
                            color={visit.is_new_visitor ? "#06b6d4" : "#9333ea"}
                            weight={2}
                            opacity={opacity}
                            fillOpacity={opacity * 0.6}
                        >
                            <Popup>
                                <div className="text-sm">
                                    <div className="font-bold mb-1">
                                        {visit.is_new_visitor ? '🆕 New Visitor' : '🔄 Returning Visitor'}
                                    </div>
                                    <div className="space-y-1">
                                        <div>📍 {visit.country || 'Unknown'}</div>
                                        <div>🕐 {minutesAgo < 1 ? 'Just now' : `${minutesAgo}m ago`}</div>
                                        {visit.wallet_address && (
                                            <div className="text-xs text-gray-600">
                                                💼 {visit.wallet_address.slice(0, 6)}...{visit.wallet_address.slice(-4)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Popup>
                        </CircleMarker>
                    );
                })}
            </MapContainer>
        </div>
    );
}