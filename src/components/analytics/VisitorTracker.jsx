import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useWallet } from '../wallet/WalletContext';

const getVisitorId = () => {
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
        visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('visitor_id', visitorId);
    }
    return visitorId;
};

const getGeolocation = async () => {
    // Check cache first
    const cached = sessionStorage.getItem('geo_cache');
    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Cache for 1 hour
        if (Date.now() - timestamp < 3600000) {
            return data;
        }
    }

    try {
        const response = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
        const data = await response.json();
        const geoData = {
            ip: data.ip,
            country: data.country_name,
            countryCode: data.country_code,
            latitude: data.latitude,
            longitude: data.longitude
        };
        // Cache result
        sessionStorage.setItem('geo_cache', JSON.stringify({ data: geoData, timestamp: Date.now() }));
        return geoData;
    } catch (error) {
        console.error('Failed to get geolocation:', error);
        return null;
    }
};

export default function VisitorTracker() {
    const location = useLocation();
    const { account } = useWallet();
    const visitorId = getVisitorId();

    // Track visit on mount (memoized admin check)
    useEffect(() => {
        const trackVisit = async () => {
            // Skip if already checked admin status this session
            if (sessionStorage.getItem('admin_check_done') === 'true') {
                if (localStorage.getItem('admin_no_track') === 'true') {
                    return;
                }
            } else {
                // First check only
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                        if (profile?.role === 'admin') {
                            localStorage.setItem('admin_no_track', 'true');
                            sessionStorage.setItem('admin_check_done', 'true');
                            return;
                        }
                    }
                    sessionStorage.setItem('admin_check_done', 'true');
                } catch (error) {
                    sessionStorage.setItem('admin_check_done', 'true');
                }
            }

            // Quick localStorage check
            if (localStorage.getItem('admin_no_track') === 'true') {
                return;
            }

            const isNewVisitor = !localStorage.getItem('has_visited');
            const geo = await getGeolocation();

            try {
                const { error } = await supabase.from('visits').insert({
                    visitor_id: visitorId,
                    wallet_address: account?.toLowerCase() || null,
                    is_new_visitor: isNewVisitor,
                    ip_address: geo?.ip || null,
                    country: geo?.country || null,
                    country_code: geo?.countryCode || null,
                    latitude: geo?.latitude || null,
                    longitude: geo?.longitude || null,
                    user_agent: navigator.userAgent,
                    referrer: document.referrer || null
                });

                if (error) throw error;

                localStorage.setItem('has_visited', 'true');
            } catch (error) {
                console.error('Failed to track visit:', error);
            }
        };

        trackVisit();
    }, []);

    // Track wallet connection with new visit record
    useEffect(() => {
        const trackWalletConnection = async () => {
            if (!account) return;

            // Skip if already tracked this wallet connection
            const trackedKey = `wallet_tracked_${account.toLowerCase()}`;
            if (sessionStorage.getItem(trackedKey)) return;

            // Quick check - already verified in mount
            if (localStorage.getItem('admin_no_track') === 'true') {
                return;
            }

            try {
                const geo = await getGeolocation();

                // Create new visit record with wallet address
                const { error } = await supabase.from('visits').insert({
                    visitor_id: visitorId,
                    wallet_address: account.toLowerCase(),
                    is_new_visitor: false,
                    ip_address: geo?.ip || null,
                    country: geo?.country || null,
                    country_code: geo?.countryCode || null,
                    latitude: geo?.latitude || null,
                    longitude: geo?.longitude || null,
                    user_agent: navigator.userAgent,
                    referrer: document.referrer || null
                });

                if (error) throw error;

                sessionStorage.setItem(trackedKey, 'true');
                console.log('✅ Wallet connection tracked');
            } catch (error) {
                console.error('Failed to track wallet connection:', error);
            }
        };

        trackWalletConnection();
    }, [account, visitorId]);

    // Track page views - NON-BLOCKING
    useEffect(() => {
        // Skip if admin
        if (localStorage.getItem('admin_no_track') === 'true') {
            return;
        }

        const entryTime = new Date();
        let exitRecorded = false;

        const recordPageView = async (timeSpent) => {
            if (exitRecorded) return;
            exitRecorded = true;

            // Fire and forget - don't block navigation
            await supabase.from('page_views').insert({
                visitor_id: visitorId,
                wallet_address: account?.toLowerCase() || null,
                page_name: location.pathname,
                time_spent: Math.round(timeSpent),
                entry_time: entryTime.toISOString(),
                exit_time: new Date().toISOString()
            });
        };

        // Record on navigation or page unload
        return () => {
            const timeSpent = (new Date().getTime() - entryTime.getTime()) / 1000;
            recordPageView(timeSpent);
        };
    }, [location.pathname, visitorId, account]);

    return null;
}