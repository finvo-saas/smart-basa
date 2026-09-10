'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Users, MapPin, Star } from 'lucide-react'

const statItems = [
  {
    key: 'propertiesListed',
    icon: <Building2 className="h-5 w-5 sm:h-8 sm:w-8" />,
    value: '10,000+',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    key: 'activeUsers',
    icon: <Users className="h-5 w-5 sm:h-8 sm:w-8" />,
    value: '50,000+',
    color: 'from-purple-500 to-pink-500',
  },
  {
    key: 'citiesCovered',
    icon: <MapPin className="h-5 w-5 sm:h-8 sm:w-8" />,
    value: '15+',
    color: 'from-green-500 to-emerald-500',
  },
  {
    key: 'userRating',
    icon: <Star className="h-5 w-5 sm:h-8 sm:w-8" />,
    value: '4.8/5',
    color: 'from-orange-500 to-red-500',
  },
] as const

export function StatsSection() {
  const t = useTranslations('home')

  return (
    <section className="py-10 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-6">
          {statItems.map(({ key, icon, value, color }) => (
            <Card
              key={key}
              className="group border-2 transition-all duration-300 hover:border-primary hover:shadow-lg"
            >
              <CardContent className="p-3 text-center sm:p-6">
                <div
                  className={`mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${color} text-white transition-transform duration-300 group-hover:scale-110 sm:mb-4 sm:h-16 sm:w-16 sm:rounded-xl`}
                >
                  {icon}
                </div>
                <div
                  className={`mb-1 text-xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent sm:mb-2 sm:text-4xl`}
                >
                  {value}
                </div>
                <p className="text-[11px] font-medium leading-snug text-muted-foreground sm:text-sm">
                  {t(`stats.${key}`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
