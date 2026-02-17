import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AcceptTermsModal from './AcceptTermsModal';

const WalletContext = createContext();

const USDT_BEP20 = '0x55d398326f99059fF775485246999027B3197955';
const ERC20_ABI = [
    'function decimals() view returns (uint8)',
    'function balanceOf(address) view returns (uint256)'
];

export function WalletProvider({ children }) {
    const [account, setAccount] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [balance, setBalance] = useState(null);
    const [usdtBalance, setUsdtBalance] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [checkedAddresses, setCheckedAddresses] = useState(new Set());

    const checkIfWalletIsConnected = async () => {
        // Skip wallet detection on Chat pages - wallet is OPTIONAL
        const isChatPage = window.location.pathname.includes('/Chat') || window.location.pathname.includes('/chat');
        if (isChatPage) {
            console.log('🔇 Wallet auto-connect disabled on Chat page');
            return;
        }

        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    const address = accounts[0].toLowerCase();
                    setAccount(address);
                    await getBalance(address);
                    await getUsdtBalance(address);
                    const chain = await window.ethereum.request({ method: 'eth_chainId' });
                    setChainId(chain);
                    await checkTermsAcceptance(address);
                }
            } catch (error) {
                console.error('Error checking wallet connection:', error);
            }
        }
    };

    const checkTermsAcceptance = async (address) => {
        try {
            const addressLower = address.toLowerCase();

            // If we've already checked this address in this session, skip
            if (checkedAddresses.has(addressLower)) {
                return;
            }

            // Don't show modal on policy/terms pages so users can read them
            const currentPath = window.location.pathname;
            const allowedPages = ['/TermsOfService', '/PrivacyPolicy', '/CookiePolicy', '/FAQ'];
            const isOnPolicyPage = allowedPages.some(page => currentPath.includes(page));

            if (isOnPolicyPage) {
                return;
            }

            // Check if user is admin via authenticated session
            try {
                const { data: { user } } = await supabase.auth.getUser();
                // Check boolean flag in metadata or profile if available, otherwise just rely on Auth
                // For now, if authenticated, fetch profile to check role
                if (user) {
                    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
                    if (profile?.role === 'admin') {
                        // Admin user - skip terms modal
                        setTermsAccepted(true);
                        setShowTermsModal(false);
                        setCheckedAddresses(prev => new Set([...prev, addressLower]));
                        return;
                    }
                }
            } catch (error) {
                console.log('User not authenticated or error checking admin status');
                // Continue to check UserAgreement if admin check fails
            }

            // Check database for existing agreement
            const { data: agreements } = await supabase
                .from('user_agreements')
                .select('*')
                .eq('wallet_address', addressLower)
                .maybeSingle(); // or .limit(1) and check array

            // Logic below expects array, so let's stick to array return if possible or adapt
            const agreementList = agreements ? [agreements] : [];

            // Mark as checked to prevent re-checking in same session
            setCheckedAddresses(prev => new Set([...prev, addressLower]));

            if (agreementList.length > 0) {
                // User has already accepted
                const localKey = `terms_accepted_${addressLower}`;
                localStorage.setItem(localKey, 'true');
                setTermsAccepted(true);
                setShowTermsModal(false);
            } else {
                // New user - show modal
                setShowTermsModal(true);
            }
        } catch (error) {
            console.error('Error checking terms acceptance:', error);
        }
    };

    const handleTermsAccept = async () => {
        // Store acceptance in localStorage immediately
        if (account) {
            localStorage.setItem(`terms_accepted_${account.toLowerCase()}`, 'true');
        }
        setTermsAccepted(true);
        setShowTermsModal(false);
    };

    const getBalance = async (address) => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const balance = await window.ethereum.request({
                    method: 'eth_getBalance',
                    params: [address, 'latest']
                });
                const bnbBalance = parseInt(balance, 16) / Math.pow(10, 18);
                setBalance(bnbBalance.toFixed(8));
            } catch (error) {
                console.error('Error getting balance:', error);
            }
        }
    };

    const getUsdtBalance = async (address) => {
        if (typeof window.ethereum !== 'undefined' && typeof window.ethers !== 'undefined') {
            try {
                const { ethers } = window;
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const contract = new ethers.Contract(USDT_BEP20, ERC20_ABI, provider);
                const decimals = await contract.decimals();
                const balance = await contract.balanceOf(address);
                const formatted = ethers.utils.formatUnits(balance, decimals);
                setUsdtBalance(parseFloat(formatted).toFixed(2));
            } catch (error) {
                console.error('Error getting USDT balance:', error);
                setUsdtBalance('0.00');
            }
        }
    };

    const ensureBSC = async () => {
        const BSC_CHAIN_ID = '0x38';
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== BSC_CHAIN_ID) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: BSC_CHAIN_ID }]
                });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: BSC_CHAIN_ID,
                            chainName: 'BNB Smart Chain',
                            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                            rpcUrls: ['https://bsc-dataseed.binance.org'],
                            blockExplorerUrls: ['https://bscscan.com']
                        }]
                    });
                } else {
                    throw switchError;
                }
            }
        }
    };

    const connectWallet = async () => {
        if (typeof window.ethereum === 'undefined') {
            // Detect mobile device
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            if (isMobile) {
                // Open site in MetaMask app browser via deep link
                const currentUrl = window.location.href;
                window.location.href = `https://metamask.app.link/dapp/${currentUrl.replace(/^https?:\/\//, '')}`;
            } else {
                // Desktop - redirect to download
                alert('MetaMask is not installed. Please install MetaMask extension to continue.');
                window.open('https://metamask.io/download/', '_blank');
            }
            return;
        }

        setIsConnecting(true);
        try {
            await ensureBSC();
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts returned from MetaMask');
            }

            const address = accounts[0].toLowerCase();
            setAccount(address);
            await getBalance(address);
            await getUsdtBalance(address);
            const chain = await window.ethereum.request({ method: 'eth_chainId' });
            setChainId(chain);
            await checkTermsAcceptance(address);
        } catch (error) {
            console.error('Error connecting wallet:', error);
            if (error.code === 4001) {
                console.log('Connection rejected by user');
            } else if (error.code === -32002) {
                console.log('Connection request already pending');
            } else {
                console.error('MetaMask connection error:', error.message || error);
            }
            throw error;
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
        setBalance(null);
        setUsdtBalance(null);
        setChainId(null);
        setTermsAccepted(false);
        setShowTermsModal(false);
        setCheckedAddresses(new Set());
    };

    const formatAddress = (addr) => {
        if (!addr) return '';
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const getNetworkName = (chainId) => {
        const networks = {
            '0x1': 'Ethereum',
            '0x89': 'Polygon',
            '0x38': 'BSC',
            '0xa86a': 'Avalanche',
            '0xa4b1': 'Arbitrum',
            '0xa': 'Optimism',
            '0xaa36a7': 'Sepolia',
            '0x5': 'Goerli'
        };
        return networks[chainId] || 'Unknown Network';
    };

    useEffect(() => {
        checkIfWalletIsConnected();

        // Skip event listeners on Chat pages
        const isChatPage = window.location.pathname.includes('/Chat') || window.location.pathname.includes('/chat');
        if (isChatPage) {
            return;
        }

        if (typeof window.ethereum !== 'undefined') {
            const handleAccountsChanged = (accounts) => {
                if (accounts.length > 0) {
                    const address = accounts[0].toLowerCase();
                    setAccount(address);
                    getBalance(address);
                    getUsdtBalance(address);
                    checkTermsAcceptance(address);
                } else {
                    disconnectWallet();
                }
            };

            const handleChainChanged = (chain) => {
                setChainId(chain);
                window.location.reload(); // Recommended by MetaMask
            };

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            return () => {
                if (typeof window.ethereum !== 'undefined') {
                    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                    window.ethereum.removeListener('chainChanged', handleChainChanged);
                }
            };
        }
    }, []);

    return (
        <WalletContext.Provider value={{
            account,
            balance,
            usdtBalance,
            chainId,
            isConnecting,
            connectWallet,
            disconnectWallet,
            formatAddress,
            getNetworkName,
            termsAccepted
        }}>
            {children}
            {account && <AcceptTermsModal
                isOpen={showTermsModal}
                onAccept={handleTermsAccept}
                walletAddress={account}
            />}
        </WalletContext.Provider>
    );
}

export const useWallet = () => useContext(WalletContext);