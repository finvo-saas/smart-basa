'use client'

import { useTranslations } from 'next-intl'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Home,
  Building2,
  Hotel,
  Users,
  Shield,
  DollarSign,
  MessageCircle,
  MapPin,
} from 'lucide-react'

const featureKeys = [
  { key: 'findAccommodation', icon: <Home className="h-6 w-6" />, color: 'from-blue-500 to-cyan-500' },
  { key: 'apartmentManagement', icon: <Building2 className="h-6 w-6" />, color: 'from-purple-500 to-pink-500' },
  { key: 'hotelGuestHouse', icon: <Hotel className="h-6 w-6" />, color: 'from-orange-500 to-red-500' },
  { key: 'messHostel', icon: <Users className="h-6 w-6" />, color: 'from-green-500 to-emerald-500' },
  { key: 'verifiedTrusted', icon: <Shield className="h-6 w-6" />, color: 'from-indigo-500 to-blue-500' },
  { key: 'easyPayments', icon: <DollarSign className="h-6 w-6" />, color: 'from-yellow-500 to-orange-500' },
  { key: 'directChat', icon: <MessageCircle className="h-6 w-6" />, color: 'from-teal-500 to-cyan-500' },
  { key: 'locationSearch', icon: <MapPin className="h-6 w-6" />, color: 'from-rose-500 to-pink-500' },
] as const

export function FeaturesSection() {
  const t = useTranslations('home')

  return (
    <section className="py-10 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-12">
          <h2 className="mb-4 text-balance text-2xl font-bold sm:text-4xl lg:text-5xl">
            {t('features.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featureKeys.map(({ key, icon, color }) => (
            <Card
              key={key}
              className="group relative overflow-hidden border-2 transition-all duration-300 hover:border-primary hover:shadow-lg"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
              />

              <CardHeader>
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${color} text-white transition-transform duration-300 group-hover:scale-110`}
                >
                  {icon}
                </div>
                <CardTitle className="text-xl">
                  {t(`features.${key}.title`)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {t(`features.${key}.description`)}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
