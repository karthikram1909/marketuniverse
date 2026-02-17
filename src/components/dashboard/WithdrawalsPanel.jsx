import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '../wallet/WalletContext';
import WithdrawalForm from './WithdrawalForm';
import WithdrawalHistory from './WithdrawalHistory';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateTimeBasedBalances } from '../pools/TimeBasedCalculations';

const POOL_CONFIGS = {
    scalping: { name: 'Crypto Pool', color: 'from-purple-500 to-pink-500' },
    traditional: { name: 'Traditional Pool', color: 'from-orange-500 to-red-500' },
    vip: { name: 'VIP Pool', color: 'from-cyan-500 to-purple-500' }
};

export default function WithdrawalsPanel() {
    const { account } = useWallet();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('scalping');

    // Fetch data for active tab only - instant switching
    const { data: activeInvestors = [] } = useQuery({
        queryKey: ['poolInvestors', activeTab],
        queryFn: async () => {
            const { data } = await supabase.from('pool_investors').select('*').eq('pool_type', activeTab);
            return data || [];
        },
        enabled: !!account && activeTab !== 'staking',
        staleTime: 120000
    });

    const { data: activeTrades = [] } = useQuery({
        queryKey: ['poolTrades', activeTab],
        queryFn: async () => {
            const { data } = await supabase.from('pool_trades').select('*').eq('pool_type', activeTab);
            return data || [];
        },
        enabled: !!account && activeTab !== 'staking',
        staleTime: 120000
    });

    const { data: activeWithdrawals = [] } = useQuery({
        queryKey: ['poolWithdrawals', activeTab],
        queryFn: async () => {
            const { data } = await supabase.from('withdrawal_requests').select('*').eq('pool_type', activeTab);
            return data || [];
        },
        enabled: !!account && activeTab !== 'staking',
        staleTime: 120000
    });

    const { data: activeSettings } = useQuery({
        queryKey: ['poolSettings', activeTab],
        queryFn: async () => {
            if (activeTab === 'staking') {
                const { data } = await supabase.from('staking_settings').select('*');
                return data?.[0] || null;
            }
            const { data } = await supabase.from('pool_settings').select('*').eq('pool_type', activeTab);
            return data?.[0] || null;
        },
        enabled: !!account,
        staleTime: 120000
    });

    const { data: stakingContracts = [] } = useQuery({
        queryKey: ['stakingContracts', account],
        queryFn: async () => {
            const { data } = await supabase.from('staking_contracts').select('*').eq('wallet_address', account.toLowerCase());
            return data || [];
        },
        enabled: !!account && activeTab === 'staking',
        staleTime: 0,
        refetchOnMount: true
    });

    const getCurrentBalance = () => {
        if (activeTab === 'staking') {
            // Sum current_value of cancelled and completed contracts
            const withdrawable = stakingContracts.filter(c =>
                c.status === 'cancelled' || c.status === 'completed'
            );
            return withdrawable.reduce((sum, c) => sum + (c.current_value || 0), 0);
        }

        if (!account || activeInvestors.length === 0) return 0;

        const { userBalances } = calculateTimeBasedBalances({
            investors: activeInvestors,
            trades: activeTrades,
            withdrawals: activeWithdrawals,
            profitShareRate: activeSettings?.profit_share_rate || 0.20
        });

        return userBalances[account?.toLowerCase()]?.totalBalance || 0;
    };

    const currentBalance = getCurrentBalance();

    // Create withdrawal mutation
    const createWithdrawalMutation = useMutation({
        mutationFn: async ({ poolType, formData }) => {
            console.log('💥💥💥 MUTATION EXECUTING - poolType:', poolType);

            const { data: withdrawal, error } = await supabase.from('withdrawal_requests').insert({
                wallet_address: account.toLowerCase(),
                email: formData.email,
                payment_address: formData.payment_address,
                name_surname: formData.name_surname,
                amount: parseFloat(formData.amount),
                pool_type: poolType,
                status: 'pending',
                user_balance_at_request: currentBalance,
                crypto_type: poolType === 'staking' ? 'CRYPTO' : 'USDT'
            }).select().single();

            if (error) throw error;
            console.log('💥 Withdrawal created:', withdrawal.id);

            // Create notifications
            if (['vip', 'traditional', 'scalping', 'staking'].includes(poolType)) {
                const poolName = poolType === 'vip' ? 'VIP Pool' :
                    poolType === 'traditional' ? 'Traditional Pool' :
                        poolType === 'staking' ? 'Staking' : 'Crypto Pool';

                const userNotifType = poolType === 'vip' ? 'vip_withdrawal_request' :
                    poolType === 'traditional' ? 'traditional_withdrawal_request' :
                        poolType === 'staking' ? 'staking_withdrawal_request' : 'crypto_withdrawal_request';

                const adminNotifType = poolType === 'vip' ? 'admin_vip_withdrawal_request' :
                    poolType === 'traditional' ? 'admin_traditional_withdrawal_request' :
                        poolType === 'staking' ? 'admin_staking_withdrawal_request' : 'admin_crypto_withdrawal_request';

                const cryptoLabel = poolType === 'staking' ? formData.crypto_type || 'CRYPTO' : 'USDT';

                console.log('💥 Creating notifications...');
                await Promise.all([
                    supabase.from('notifications').insert({
                        wallet_address: account.toLowerCase(),
                        email: formData.email,
                        type: userNotifType,
                        title: `${poolName} Withdrawal Requested`,
                        message: `Your withdrawal request for ${formData.amount} ${cryptoLabel} has been submitted and is pending admin approval.`,
                        amount: parseFloat(formData.amount),
                        read: false,
                        is_admin: false
                    }),
                    supabase.from('notifications').insert({
                        wallet_address: account.toLowerCase(),
                        email: formData.email,
                        type: adminNotifType,
                        title: `New ${poolName} Withdrawal Request`,
                        message: `${formData.name_surname} has requested a withdrawal of ${formData.amount} ${cryptoLabel} from ${poolName}.`,
                        amount: parseFloat(formData.amount),
                        read: false,
                        is_admin: true
                    })
                ]);
                console.log('💥 Notifications created!');
            }

            return withdrawal;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['poolWithdrawals']);
            queryClient.invalidateQueries(['poolInvestors']);
            queryClient.invalidateQueries(['stakingContracts']);
            queryClient.invalidateQueries(['notifications']);
            queryClient.invalidateQueries(['adminNotifications']);
        }
    });

    const handleWithdrawalSubmit = async (poolType, formData) => {
        try {
            console.log('='.repeat(50));
            console.log('HANDLER CALLED - Pool:', poolType);
            console.log('Form Data:', formData);
            console.log('='.repeat(50));

            const result = await createWithdrawalMutation.mutateAsync({ poolType, formData });

            console.log('='.repeat(50));
            console.log('HANDLER SUCCESS');
            console.log('='.repeat(50));
            return result;
        } catch (error) {
            console.error('='.repeat(50));
            console.error('HANDLER ERROR:', error);
            console.error('='.repeat(50));
            throw error;
        }
    };

    if (!account) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-black/40 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 overflow-hidden"
            style={{
                boxShadow: '0 8px 32px 0 rgba(168, 85, 247, 0.1)'
            }}
        >
            <motion.div
                className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-transparent rounded-full blur-3xl"
                animate={{
                    scale: [1, 1.2, 1],
                    x: [0, 50, 0],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 5, repeat: Infinity }}
            />
            <motion.h2
                className="text-2xl font-bold mb-6 relative z-10 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
            >
                Withdrawals
            </motion.h2>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="relative z-10">
                <TabsList className="grid w-full grid-cols-4 mb-6 relative z-10">
                    <TabsTrigger value="scalping">Crypto</TabsTrigger>
                    <TabsTrigger value="traditional">Traditional</TabsTrigger>
                    <TabsTrigger value="vip">VIP</TabsTrigger>
                    <TabsTrigger value="staking">Staking</TabsTrigger>
                </TabsList>

                <TabsContent value="scalping" className="space-y-6">
                    <WithdrawalForm
                        poolType="scalping"
                        maxAmount={currentBalance}
                        onSubmit={(formData) => handleWithdrawalSubmit('scalping', formData)}
                        isSubmitting={createWithdrawalMutation.isLoading}
                        cryptoType="USDT"
                        withdrawalsLocked={activeSettings?.withdrawals_locked || false}
                    />
                </TabsContent>

                <TabsContent value="traditional" className="space-y-6">
                    <WithdrawalForm
                        poolType="traditional"
                        maxAmount={currentBalance}
                        onSubmit={(formData) => handleWithdrawalSubmit('traditional', formData)}
                        isSubmitting={createWithdrawalMutation.isLoading}
                        cryptoType="USDT"
                        withdrawalsLocked={activeSettings?.withdrawals_locked || false}
                    />
                </TabsContent>

                <TabsContent value="vip" className="space-y-6">
                    <WithdrawalForm
                        poolType="vip"
                        maxAmount={currentBalance}
                        onSubmit={(formData) => {
                            console.log('⭐ VIP TAB CALLBACK');
                            return handleWithdrawalSubmit('vip', formData);
                        }}
                        isSubmitting={createWithdrawalMutation.isLoading}
                        cryptoType="USDT"
                        withdrawalsLocked={activeSettings?.withdrawals_locked || false}
                    />
                </TabsContent>

                <TabsContent value="staking" className="space-y-6">
                    <WithdrawalForm
                        poolType="staking"
                        maxAmount={currentBalance}
                        onSubmit={(formData) => handleWithdrawalSubmit('staking', formData)}
                        isSubmitting={createWithdrawalMutation.isLoading}
                        cryptoType="CRYPTO"
                        withdrawalsLocked={activeSettings?.withdrawals_locked || false}
                    />
                </TabsContent>
            </Tabs>

            <div className="mt-6">
                <WithdrawalHistory walletAddress={account} />
            </div>
        </motion.div>
    );
}