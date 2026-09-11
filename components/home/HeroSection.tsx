'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Search,
  Building2,
  Shield,
  CheckCircle,
} from 'lucide-react'
import { isLoggedIn } from '@/utils/auth'

export function HeroSection() {
  const router = useRouter()
  const t = useTranslations('home')
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    setLoggedIn(isLoggedIn())
  }, [])

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5 py-10 sm:py-16 lg:py-24">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl sm:h-96 sm:w-96" />
      </div>

      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-5 inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-full border bg-background/80 px-3 py-1.5 text-xs backdrop-blur-sm sm:mb-6 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm">
            <Shield className="h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" />
            <span className="min-w-0 text-balance font-medium leading-snug">
              {t('hero.badge')}
            </span>
          </div>

          <h1 className="mb-5 text-balance text-3xl font-bold tracking-tight leading-[1.2] sm:mb-6 sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="block">{t('hero.titleLine1')}</span>
            {/* pb + looser leading: bg-clip-text otherwise clips g/p descenders */}
            <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text pb-[0.15em] leading-[1.25] text-transparent">
              {t('hero.titleLine2')}
            </span>
            <span className="block">{t('hero.titleLine3')}</span>
          </h1>

          <p className="mx-auto mb-6 max-w-2xl text-pretty text-base text-muted-foreground sm:mb-8 sm:text-xl">
            {t('hero.subtitle')}
          </p>

          <div className="mb-6 flex w-full flex-col items-stretch justify-center gap-3 sm:mb-8 sm:flex-row sm:items-center sm:gap-4">
            <Button
              size="lg"
              className="group w-full px-4 sm:w-auto sm:px-8"
              onClick={() => router.push('/search')}
            >
              <Search className="mr-2 h-5 w-5 shrink-0" />
              <span className="truncate">{t('hero.browseProperties')}</span>
              <ArrowRight className="ml-2 h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full px-4 sm:w-auto sm:px-8"
              onClick={() => router.push(loggedIn ? '/dashboard' : '/login')}
            >
              <Building2 className="mr-2 h-5 w-5 shrink-0" />
              <span className="truncate">
                {loggedIn ? t('hero.goToDashboard') : t('hero.listProperty')}
              </span>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground sm:gap-6 sm:text-sm">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-500 sm:h-4 sm:w-4" />
              <span>{t('hero.trustVerified')}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-500 sm:h-4 sm:w-4" />
              <span>{t('hero.trustPayments')}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-500 sm:h-4 sm:w-4" />
              <span>{t('hero.trustSupport')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
