'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  BedDouble,
  CalendarCheck,
  ClipboardList,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Phone,
  Trash2,
  UserCheck,
  UserMinus,
  UserRound,
  UtensilsCrossed,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { WhatsAppIcon } from '@/components/contact/WhatsAppButton'
import { whatsappLink } from '@/lib/contact/whatsapp'
import type { MessMember } from '@/types/mess'

type MemberActionsMenuProps = {
  member: MessMember
  messId: string
  /** Mess / property display name for the WhatsApp greeting. */
  propertyName?: string
  onEdit: (member: MessMember) => void
  onVacateSeat: (member: MessMember) => void
  onToggleActive: (member: MessMember) => void
  onRemove: (member: MessMember) => void
}

export function MemberActionsMenu({
  member,
  messId,
  propertyName,
  onEdit,
  onVacateSeat,
  onToggleActive,
  onRemove,
}: MemberActionsMenuProps) {
  const t = useTranslations('mess.members.actions')
  const tContact = useTranslations('contact')
  const whatsapp = whatsappLink(
    member.whatsappNumber,
    tContact('messageRenter', {
      property: propertyName?.trim() || tContact('propertyFallback'),
    }),
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t('menu')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="truncate">{member.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/mess/${messId}/members/${member.id}`}>
            <UserRound className="mr-2 h-4 w-4" />
            {t('view')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(member)}>
          <Pencil className="mr-2 h-4 w-4" />
          {t('edit')}
        </DropdownMenuItem>
        {member.seatNumber ? (
          <DropdownMenuItem onClick={() => onVacateSeat(member)}>
            <BedDouble className="mr-2 h-4 w-4" />
            {t('vacate')}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={`tel:${member.phone}`}>
            <Phone className="mr-2 h-4 w-4" />
            {t('call')}
          </a>
        </DropdownMenuItem>
        {whatsapp ? (
          <DropdownMenuItem asChild>
            <a href={whatsapp} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="mr-2 h-4 w-4 text-[#25D366]" />
              {tContact('whatsapp')}
            </a>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem asChild>
          <Link href={`/mess/${messId}/sms`}>
            <MessageSquare className="mr-2 h-4 w-4" />
            {t('sms')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/mess/${messId}/attendance`}>
            <CalendarCheck className="mr-2 h-4 w-4" />
            {t('attendance')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/mess/${messId}/members/${member.id}/meals`}>
            <UtensilsCrossed className="mr-2 h-4 w-4" />
            {t('mealSheet')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/mess/${messId}/hisab`}>
            <ClipboardList className="mr-2 h-4 w-4" />
            {t('hisab')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onToggleActive(member)}>
          {member.isActive === false ? (
            <>
              <UserCheck className="mr-2 h-4 w-4" />
              {t('reactivate')}
            </>
          ) : (
            <>
              <UserMinus className="mr-2 h-4 w-4" />
              {t('markLeft')}
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onRemove(member)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t('remove')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
