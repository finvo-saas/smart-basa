'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import {
  Shield,
  CheckCircle2,
  FileCheck,
  Lock,
  Award,
  Users,
} from 'lucide-react'

const trustKeys = [
  { key: 'verifiedListings', icon: <Shield className="h-6 w-6" /> },
  { key: 'documentVerification', icon: <FileCheck className="h-6 w-6" /> },
  { key: 'securePayments', icon: <Lock className="h-6 w-6" /> },
  { key: 'trustBadge', icon: <Award className="h-6 w-6" /> },
  { key: 'communityReviews', icon: <Users className="h-6 w-6" /> },
  { key: 'fraudProtection', icon: <CheckCircle2 className="h-6 w-6" /> },
] as const

export function TrustSection() {
  const t = useTranslations('home')

  return (
    <section className="bg-gradient-to-br from-primary/5 via-background to-primary/5 py-10 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-12">
          <div className="mb-4 inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 sm:gap-2 sm:px-4 sm:py-2">
            <Shield className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
            <span className="text-sm font-semibold sm:text-base">{t('trust.badge')}</span>
          </div>
          <h2 className="mb-4 text-balance text-2xl font-bold sm:text-4xl lg:text-5xl">
            {t('trust.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            {t('trust.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trustKeys.map(({ key, icon }) => (
            <Card
              key={key}
              className="group border-2 transition-all duration-300 hover:border-primary hover:shadow-lg"
            >
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                  {icon}
                </div>
                <h3 className="mb-2 text-lg font-bold">
                  {t(`trust.${key}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(`trust.${key}.description`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
