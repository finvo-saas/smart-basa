'use client'

import { useState } from 'react'
import { nameInitials } from '@/lib/chat/initials'
import { cn } from '@/lib/utils'

type ChatAvatarProps = {
  name: string
  avatar?: string
  className?: string
}

export function ChatAvatar({ name, avatar, className }: ChatAvatarProps) {
  const [failed, setFailed] = useState(false)
  const photo = avatar?.trim()
  const showPhoto = Boolean(photo) && !failed

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10',
        className,
      )}
    >
      {showPhoto ? (
        <img
          src={photo}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="px-0.5 text-center text-[10px] font-semibold leading-none text-primary sm:text-xs">
          {nameInitials(name)}
        </span>
      )}
    </div>
  )
}
