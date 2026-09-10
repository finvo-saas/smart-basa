'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Search, Building2, CheckCircle } from 'lucide-react'
import { isLoggedIn } from '@/utils/auth'

export function CTASection() {
  const router = useRouter()
  const t = useTranslations('home')
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    setLoggedIn(isLoggedIn())
  }, [])

  return (
    <section className="py-10 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5">
          <CardHeader className="space-y-2 px-4 text-center sm:px-6">
            <CardTitle className="mb-2 text-balance text-2xl font-bold sm:mb-4 sm:text-4xl lg:text-5xl">
              {t('cta.title')}
            </CardTitle>
            <CardDescription className="mx-auto max-w-2xl text-pretty text-base sm:text-lg">
              {t('cta.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-stretch gap-3 px-4 sm:flex-row sm:items-center sm:justify-center sm:gap-4 sm:px-6">
            <Button
              size="lg"
              className="group w-full px-4 sm:w-auto sm:px-8"
              onClick={() => router.push('/search')}
            >
              <Search className="mr-2 h-5 w-5 shrink-0" />
              <span className="truncate">
                {loggedIn ? t('cta.browseProperties') : t('cta.findAccommodation')}
              </span>
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
                {loggedIn ? t('cta.manageProperties') : t('cta.listProperty')}
              </span>
            </Button>
          </CardContent>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-3 pb-5 text-xs text-muted-foreground sm:mt-8 sm:gap-6 sm:px-6 sm:pb-6 sm:text-sm">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-500 sm:h-4 sm:w-4" />
              <span>{t('cta.benefitFree')}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-500 sm:h-4 sm:w-4" />
              <span>{t('cta.benefitNoFees')}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-500 sm:h-4 sm:w-4" />
              <span>{t('cta.benefitVerified')}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-500 sm:h-4 sm:w-4" />
              <span>{t('cta.benefitSupport')}</span>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
