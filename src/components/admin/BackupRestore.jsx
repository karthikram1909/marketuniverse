import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Database, Download, Upload, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

export default function BackupRestore() {
    const queryClient = useQueryClient();
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    const createBackup = async () => {
        setIsBackingUp(true);
        try {
            // Fetch all data from all entities
            const entities = [
                'PoolInvestor',
                'PoolTrade',
                'PoolSettings',
                'StakingContract',
                'StakingSettings',
                'WithdrawalRequest',
                'DealOrNoDealGame',
                'PlayerProfile',
                'PlayerTrophy',
                'Trophy',
                'GameSettings',
                'LeaderboardPeriod',
                'LessonBooking',
                'LessonSettings',
                'UserAgreement',
                'Admin',
                'SupportMessage',
                'KYCVerification',
                'SocialMediaImage',
                'Visit',
                'PageView',
                'Notification',
                'ManualDeposit',
                'NFTSaleRequest',
                'BlockedWallet',
                'APIUsageLog',
                'APISettings'
            ];

            const backup = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                data: {}
            };

            // Fetch data from each entity
            for (const entityName of entities) {
                try {
                    const data = await base44.entities[entityName].list();
                    backup.data[entityName] = data;
                } catch (error) {
                    console.error(`Failed to backup ${entityName}:`, error);
                    backup.data[entityName] = [];
                }
            }

            // Create downloadable JSON file
            const json = JSON.stringify(backup, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `marketsuniverse_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('✅ Backup created successfully! File downloaded.');
        } catch (error) {
            alert('❌ Backup failed: ' + error.message);
        } finally {
            setIsBackingUp(false);
        }
    };

    const restoreBackup = async (file) => {
        setIsRestoring(true);
        try {
            const text = await file.text();
            const backup = JSON.parse(text);

            if (!backup.timestamp || !backup.data) {
                throw new Error('Invalid backup file format');
            }

            const confirmMsg = `⚠️ RESTORE DATABASE BACKUP?\n\nBackup Date: ${new Date(backup.timestamp).toLocaleString()}\n\nThis will:\n• DELETE all current data\n• RESTORE data from backup\n• Cannot be undone\n\nContinue?`;
            
            if (!confirm(confirmMsg)) {
                setIsRestoring(false);
                return;
            }

            // Restore each entity
            let restored = 0;
            let failed = 0;

            for (const [entityName, records] of Object.entries(backup.data)) {
                try {
                    // Delete existing records first (except Admin to prevent lockout)
                    if (entityName !== 'Admin') {
                        const existing = await base44.entities[entityName].list();
                        for (const record of existing) {
                            try {
                                await base44.entities[entityName].delete(record.id);
                                await new Promise(resolve => setTimeout(resolve, 100));
                            } catch (error) {
                                console.error(`Failed to delete ${entityName} record:`, error);
                            }
                        }
                    }

                    // Insert backup records
                    for (const record of records) {
                        try {
                            // Remove system fields
                            const { id, created_date, updated_date, created_by, ...cleanRecord } = record;
                            await base44.entities[entityName].create(cleanRecord);
                            restored++;
                            await new Promise(resolve => setTimeout(resolve, 100));
                        } catch (error) {
                            console.error(`Failed to restore ${entityName} record:`, error);
                            failed++;
                        }
                    }
                } catch (error) {
                    console.error(`Failed to restore ${entityName}:`, error);
                    failed++;
                }
            }

            // Refresh all queries
            queryClient.invalidateQueries();

            alert(`✅ Restore Complete!\n\nRecords Restored: ${restored}\nFailed: ${failed}\n\nPage will reload in 2 seconds...`);
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            alert('❌ Restore failed: ' + error.message);
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Backup Section */}
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <Database className="w-8 h-8 text-green-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-green-400 mb-2">📦 Create Database Backup</h3>
                        <p className="text-white mb-4">
                            Export all data from all entities into a single JSON file. This backup can be used to restore your database later.
                        </p>
                        <ul className="text-gray-300 text-sm space-y-1 mb-4 list-disc list-inside">
                            <li>Includes all pools, trades, withdrawals, staking contracts</li>
                            <li>Game data, player profiles, and trophies</li>
                            <li>User accounts, agreements, and KYC data</li>
                            <li>Support messages, notifications, and analytics</li>
                        </ul>
                        <Button
                            onClick={createBackup}
                            disabled={isBackingUp}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white font-bold"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            {isBackingUp ? 'Creating Backup...' : 'Download Backup'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Restore Section */}
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <Upload className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-blue-400 mb-2">📤 Restore from Backup</h3>
                        <p className="text-white mb-4">
                            Upload a previously created backup file to restore your database to that point in time.
                        </p>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                            <p className="text-red-400 text-sm font-semibold">
                                ⚠️ Warning: This will DELETE all current data and replace it with the backup data. This action cannot be undone!
                            </p>
                        </div>
                        <input
                            type="file"
                            accept=".json"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    restoreBackup(file);
                                    e.target.value = '';
                                }
                            }}
                            disabled={isRestoring}
                            className="block w-full text-sm text-gray-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-lg file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-500 file:text-white
                                hover:file:bg-blue-600
                                file:cursor-pointer cursor-pointer
                                disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {isRestoring && (
                            <p className="text-sm text-blue-400 mt-2">Restoring backup... Please wait, this may take a few minutes.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-yellow-400 text-sm space-y-2">
                        <p><strong>Best Practices:</strong></p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Create backups before major operations (resets, bulk changes)</li>
                            <li>Store backup files in a secure location (external drive, cloud storage)</li>
                            <li>Test restore process with non-critical backups first</li>
                            <li>Label backup files with date and purpose (e.g., "before_reset_2026-01-04")</li>
                            <li>Restore process takes 1-5 minutes depending on data size</li>
                        </ul>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}