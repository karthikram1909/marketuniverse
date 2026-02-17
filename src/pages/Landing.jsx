import React from 'react';
import Navbar from '../components/landing/Navbar';
import NewsTape from '../components/news/NewsTape';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import StatsSection from '../components/landing/StatsSection';
import PoolBalancesSection from '../components/landing/PoolBalancesSection';

import TradingHeatmap from '../components/landing/TradingHeatmap';
import ActivityStream from '../components/landing/ActivityStream';
import CTASection from '../components/landing/CTASection';
import Footer from '../components/landing/Footer';

export default function Landing() {
    return (
        <div className="min-h-screen bg-[#0a0f1a] overflow-x-hidden">
            <Navbar />
            <NewsTape />
            <HeroSection />
            <FeaturesSection />
            <PoolBalancesSection />
            <StatsSection />

            <TradingHeatmap />
            <ActivityStream />
            <CTASection />
            <Footer />
        </div>
    );
}