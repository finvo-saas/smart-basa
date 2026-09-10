'use client'

import { Layout } from '@/components/layout/Layout'
import { HeroSection } from '@/components/home/HeroSection'
import { QuickExploreBar } from '@/components/home/QuickExploreBar'
import { LiveMarketplaceSection } from '@/components/home/LiveMarketplaceSection'
import { FeaturesSection } from '@/components/home/FeaturesSection'
import { HowItWorksSection } from '@/components/home/HowItWorksSection'
import { TargetUsersSection } from '@/components/home/TargetUsersSection'
import { TrustSection } from '@/components/home/TrustSection'
import { StatsSection } from '@/components/home/StatsSection'
import { CTASection } from '@/components/home/CTASection'

export default function Home() {
  return (
    <Layout>
      <div className="min-w-0">
        {/* Hero Section */}
        <HeroSection />
        <QuickExploreBar />
        <LiveMarketplaceSection />

        {/* Features Section */}
        <FeaturesSection />

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* Stats Section */}
        <StatsSection />

        {/* Target Users Section */}
        <TargetUsersSection />

        {/* Trust Section */}
        <TrustSection />

        {/* CTA Section */}
        <CTASection />
      </div>
    </Layout>
  )
}
