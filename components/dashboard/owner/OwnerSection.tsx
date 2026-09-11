'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'

interface OwnerSectionProps {
  icon: React.ReactNode
  title: string
  description: string
  /** Main page for this feature — rendered as the "Open" button */
  href: string
  openLabel?: string
  children: React.ReactNode
}

/** Feature block on the owner dashboard: heading, stats, then quick links. */
export function OwnerSection({
  icon,
  title,
  description,
  href,
  openLabel = 'Open',
  children,
}: OwnerSectionProps) {
  return (
    <section className="rounded-2xl border bg-card/40 p-3 sm:p-4 md:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="shrink-0 rounded-xl border border-primary/20 bg-primary/10 p-2 text-primary sm:p-2.5">
            <div className="h-5 w-5 md:h-6 md:w-6">{icon}</div>
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold sm:text-lg md:text-xl">
              {title}
            </h2>
            <p className="text-pretty text-xs text-muted-foreground md:text-sm">
              {description}
            </p>
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full shrink-0 sm:w-auto"
        >
          <Link href={href}>{openLabel}</Link>
        </Button>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

export interface QuickLink {
  title: string
  subtitle: string
  href: string
  icon: React.ReactNode
}

/** Compact link tile — fits many feature entry points without dominating the page. */
export function QuickLinkTile({ link }: { link: QuickLink }) {
  return (
    <Link href={link.href} className="block h-full">
      <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-3 md:p-4">
          <div className="shrink-0 rounded-lg bg-muted p-2 text-foreground/80">
            <div className="h-4 w-4">{link.icon}</div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold md:text-base">
              {link.title}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {link.subtitle}
            </p>
          </div>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </CardHeader>
      </Card>
    </Link>
  )
}

export function QuickLinkGrid({ links }: { links: QuickLink[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {links.map(link => (
        <QuickLinkTile key={link.href + link.title} link={link} />
      ))}
    </div>
  )
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  // Stay 1-col through the awkward 360–639px band; 2-col from sm (640px).
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {children}
    </div>
  )
}
