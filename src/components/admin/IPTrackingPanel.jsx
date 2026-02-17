import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Globe, Copy, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import Pagination from '../common/Pagination';

export default function IPTrackingPanel() {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const { data: visits = [], isLoading, refetch } = useQuery({
        queryKey: ['allVisits'],
        queryFn: () => base44.entities.Visit.list('-created_date', 1000),
        staleTime: 60000,
        refetchInterval: false
    });

    // Filter visits
    const filteredVisits = visits.filter(visit => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            visit.ip_address?.toLowerCase().includes(query) ||
            visit.country?.toLowerCase().includes(query) ||
            visit.wallet_address?.toLowerCase().includes(query)
        );
    });

    // Pagination
    const itemsPerPage = 20;
    const totalPages = Math.ceil(filteredVisits.length / itemsPerPage);
    const paginatedVisits = filteredVisits.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Stats
    const uniqueIPs = new Set(visits.map(v => v.ip_address).filter(Boolean)).size;
    const uniqueCountries = new Set(visits.map(v => v.country).filter(Boolean)).size;
    const newVisitors = visits.filter(v => v.is_new_visitor).length;

    return (
        <div>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-6"
                >
                    <p className="text-gray-400 text-sm mb-1">Total Visits</p>
                    <p className="text-white text-3xl font-bold">{visits.length}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6"
                >
                    <p className="text-gray-400 text-sm mb-1">Unique IPs</p>
                    <p className="text-white text-3xl font-bold">{uniqueIPs}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6"
                >
                    <p className="text-gray-400 text-sm mb-1">Countries</p>
                    <p className="text-white text-3xl font-bold">{uniqueCountries}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-6"
                >
                    <p className="text-gray-400 text-sm mb-1">New Visitors</p>
                    <p className="text-white text-3xl font-bold">{newVisitors}</p>
                </motion.div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <Input
                    placeholder="🔍 Search by IP, country, or wallet address..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
            </div>

            {/* Visits Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-white/10 rounded-2xl p-6"
            >
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Date & Time</th>
                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">IP Address</th>
                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Country</th>
                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Wallet</th>
                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-gray-500">
                                        Loading visits...
                                    </td>
                                </tr>
                            ) : paginatedVisits.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-gray-500">
                                        No visits found
                                    </td>
                                </tr>
                            ) : (
                                paginatedVisits.map((visit, index) => (
                                    <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="py-3 px-4 text-gray-400 text-sm">
                                            {new Date(visit.created_date).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                {visit.ip_address ? (
                                                    <>
                                                        <span className={`text-cyan-400 font-mono text-sm ${
                                                            visit.ip_address.includes(':') ? 'text-xs' : ''
                                                        }`}>
                                                            {visit.ip_address.includes(':') 
                                                                ? `${visit.ip_address.split(':').slice(0, 3).join(':')}:...` 
                                                                : visit.ip_address
                                                            }
                                                        </span>
                                                        {visit.ip_address.includes(':') && (
                                                            <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-purple-500/20 text-purple-400">
                                                                IPv6
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(visit.ip_address);
                                                                alert('✅ IP address copied');
                                                            }}
                                                            className="text-gray-500 hover:text-white transition-colors"
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-500">N/A</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            {visit.country ? (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-green-400" />
                                                    <span className="text-white">
                                                        {visit.country}
                                                        {visit.country_code && (
                                                            <span className="text-gray-400 ml-1">({visit.country_code})</span>
                                                        )}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500">Unknown</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            {visit.wallet_address ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-mono text-sm">
                                                        {visit.wallet_address.slice(0, 6)}...{visit.wallet_address.slice(-4)}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(visit.wallet_address);
                                                            alert('✅ Wallet address copied');
                                                        }}
                                                        className="text-gray-500 hover:text-white transition-colors"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500">Not connected</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            {visit.is_new_visitor ? (
                                                <span className="px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400">
                                                    New
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 rounded text-xs font-bold bg-blue-500/20 text-blue-400">
                                                    Returning
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-6">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </motion.div>
        </div>
    );
}