'use client'

import { useTranslations } from 'next-intl'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  GraduationCap,
  Briefcase,
  Building2,
  Hotel,
  Users,
  Home,
} from 'lucide-react'

const userTypeKeys = [
  { key: 'students', icon: <GraduationCap className="h-6 w-6" />, color: 'from-blue-500 to-indigo-500' },
  { key: 'jobHolders', icon: <Briefcase className="h-6 w-6" />, color: 'from-purple-500 to-pink-500' },
  { key: 'propertyOwners', icon: <Building2 className="h-6 w-6" />, color: 'from-green-500 to-emerald-500' },
  { key: 'hotelManagers', icon: <Hotel className="h-6 w-6" />, color: 'from-orange-500 to-red-500' },
  { key: 'messOwners', icon: <Users className="h-6 w-6" />, color: 'from-teal-500 to-cyan-500' },
  { key: 'renters', icon: <Home className="h-6 w-6" />, color: 'from-rose-500 to-pink-500' },
] as const

export function TargetUsersSection() {
  const t = useTranslations('home')

  return (
    <section className="py-10 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-12">
          <h2 className="mb-4 text-balance text-2xl font-bold sm:text-4xl lg:text-5xl">
            {t('targetUsers.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            {t('targetUsers.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {userTypeKeys.map(({ key, icon, color }) => (
            <Card
              key={key}
              className="group relative overflow-hidden border-2 transition-all duration-300 hover:border-primary hover:shadow-xl"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
              />

              <CardHeader>
                <div
                  className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                >
                  {icon}
                </div>
                <CardTitle className="text-2xl">
                  {t(`targetUsers.${key}.title`)}
                </CardTitle>
                <CardDescription className="text-base">
                  {t(`targetUsers.${key}.description`)}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
