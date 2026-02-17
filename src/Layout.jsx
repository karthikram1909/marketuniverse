import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import VisitorTracker from './components/analytics/VisitorTracker';
import { WalletProvider } from './components/wallet/WalletContext';
import { ChatMessageStoreProvider } from './components/chat/ChatMessageStore';

export default function Layout({ children }) {
    const location = useLocation();

    // Fetch active social media image
    const { data: socialMediaImages = [] } = useQuery({
        queryKey: ['socialMediaImages'],
        queryFn: async () => {
            const { data, error } = await supabase.from('social_media_images').select('*').eq('is_active', true);
            if (error) {
                console.warn('Failed to fetch social media images:', error.message);
                return [];
            }
            return data || [];
        },
        staleTime: 300000,
        retry: false
    });

    const activeImage = socialMediaImages[0];

    useEffect(() => {
        // Force black background immediately
        document.documentElement.style.backgroundColor = '#000000';
        document.body.style.backgroundColor = '#000000';

        // Instant scroll with no animation
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, [location.pathname]);

    // Update meta tags for social sharing
    useEffect(() => {
        if (activeImage) {
            // Update or create og:image meta tag
            let ogImage = document.querySelector('meta[property="og:image"]');
            if (!ogImage) {
                ogImage = document.createElement('meta');
                ogImage.setAttribute('property', 'og:image');
                document.head.appendChild(ogImage);
            }
            ogImage.setAttribute('content', activeImage.image_url);

            // Update or create og:title meta tag
            let ogTitle = document.querySelector('meta[property="og:title"]');
            if (!ogTitle) {
                ogTitle = document.createElement('meta');
                ogTitle.setAttribute('property', 'og:title');
                document.head.appendChild(ogTitle);
            }
            ogTitle.setAttribute('content', activeImage.title);

            // Update or create og:description meta tag
            let ogDescription = document.querySelector('meta[property="og:description"]');
            if (!ogDescription) {
                ogDescription = document.createElement('meta');
                ogDescription.setAttribute('property', 'og:description');
                document.head.appendChild(ogDescription);
            }
            ogDescription.setAttribute('content', activeImage.description);

            // Add Twitter card meta tags
            let twitterCard = document.querySelector('meta[name="twitter:card"]');
            if (!twitterCard) {
                twitterCard = document.createElement('meta');
                twitterCard.setAttribute('name', 'twitter:card');
                document.head.appendChild(twitterCard);
            }
            twitterCard.setAttribute('content', 'summary_large_image');

            let twitterImage = document.querySelector('meta[name="twitter:image"]');
            if (!twitterImage) {
                twitterImage = document.createElement('meta');
                twitterImage.setAttribute('name', 'twitter:image');
                document.head.appendChild(twitterImage);
            }
            twitterImage.setAttribute('content', activeImage.image_url);
        }
    }, [activeImage]);

    return (
        <WalletProvider>
            <ChatMessageStoreProvider>
                <VisitorTracker />
                {children}
            </ChatMessageStoreProvider>
        </WalletProvider>
    );
}