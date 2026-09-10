'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Search, MessageCircle, CheckCircle, ArrowRight } from 'lucide-react'

const stepKeys = [
  { number: '01', key: 'step1', icon: <Search className="h-8 w-8" /> },
  { number: '02', key: 'step2', icon: <MessageCircle className="h-8 w-8" /> },
  { number: '03', key: 'step3', icon: <CheckCircle className="h-8 w-8" /> },
] as const

export function HowItWorksSection() {
  const t = useTranslations('home')

  return (
    <section className="bg-muted/50 py-10 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-12">
          <h2 className="mb-4 text-balance text-2xl font-bold sm:text-4xl lg:text-5xl">
            {t('howItWorks.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-0 right-0 top-24 hidden h-0.5 bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20 lg:block" />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {stepKeys.map(({ number, key, icon }, index) => (
              <div key={key} className="relative">
                <Card className="group relative h-full border-2 transition-all duration-300 hover:border-primary hover:shadow-lg">
                  <CardContent className="p-6 sm:p-8">
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary transition-transform duration-300 group-hover:scale-110">
                        {number}
                      </div>
                      {index < stepKeys.length - 1 && (
                        <ArrowRight className="hidden h-6 w-6 text-muted-foreground lg:block" />
                      )}
                    </div>

                    <div className="mb-4 text-primary">{icon}</div>

                    <h3 className="mb-3 text-xl font-bold">
                      {t(`howItWorks.${key}.title`)}
                    </h3>
                    <p className="text-muted-foreground">
                      {t(`howItWorks.${key}.description`)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
