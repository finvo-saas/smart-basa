'use client'

import { useEffect, useState } from 'react'
import { Building2, Hotel, UtensilsCrossed, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  OWNER_VERTICAL_META,
  OWNER_VERTICALS,
  type OwnerVertical,
} from '@/lib/owner-focus'
import { useOwnerFocus } from '@/hooks/useOwnerFocus'
import { toast } from '@/lib/feedback/toast'

const ICONS: Record<OwnerVertical, typeof Building2> = {
  mess: UtensilsCrossed,
  apartment: Building2,
  hotel: Hotel,
}

type OwnerFocusDialogProps = {
  /** Force open to change business type even if focus already selected. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  mode?: 'required' | 'manage'
}

export function OwnerFocusDialog({
  open: controlledOpen,
  onOpenChange,
  mode = 'required',
}: OwnerFocusDialogProps) {
  const {
    needsFocusSelection,
    enabledVerticals,
    primaryFocus,
    saving,
    saveFocus,
    focusSelected,
  } = useOwnerFocus()

  const [selected, setSelected] = useState<OwnerVertical | ''>('')

  const isRequired = mode === 'required'
  const open =
    controlledOpen !== undefined
      ? controlledOpen
      : isRequired && needsFocusSelection

  useEffect(() => {
    if (!open) return
    if (focusSelected && (primaryFocus || enabledVerticals[0])) {
      setSelected(
        (primaryFocus && enabledVerticals.includes(primaryFocus)
          ? primaryFocus
          : enabledVerticals[0]) || 'mess',
      )
    } else if (!selected) {
      setSelected('mess')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once when opening
  }, [open])

  const handleSave = async () => {
    if (!selected) {
      toast.error('Select your business type.')
      return
    }
    const user = await saveFocus({
      enabledVerticals: [selected],
      primaryFocus: selected,
    })
    if (!user) {
      toast.error('Could not save your business type. Try again.')
      return
    }
    toast.success('Business type saved')
    onOpenChange?.(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (isRequired && needsFocusSelection && !next) return
        onOpenChange?.(next)
      }}
    >
      <DialogContent
        className="left-[50%] top-0 flex h-[100dvh] max-h-[100dvh] w-full max-w-full translate-x-[-50%] translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:top-[50%] sm:h-auto sm:max-h-[85vh] sm:w-[calc(100%-2rem)] sm:max-w-lg sm:translate-y-[-50%] sm:rounded-lg sm:border sm:p-0"
        onPointerDownOutside={e => {
          if (isRequired && needsFocusSelection) e.preventDefault()
        }}
        onEscapeKeyDown={e => {
          if (isRequired && needsFocusSelection) e.preventDefault()
        }}
      >
        <DialogHeader className="shrink-0 space-y-1.5 px-3 pb-2 pt-5 pr-10 text-left sm:px-6 sm:pt-6 sm:pr-12">
          <DialogTitle className="text-balance text-lg sm:text-xl">
            {isRequired && needsFocusSelection
              ? 'What do you manage?'
              : 'Your business type'}
          </DialogTitle>
          <DialogDescription className="text-pretty text-xs sm:text-sm">
            SmartBasa supports mess, apartments, and hotels. Choose{' '}
            <span className="font-medium text-foreground">one</span> business
            type so your dashboard and menus stay focused. You can switch later
            from your account menu.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-2 sm:px-6">
          {OWNER_VERTICALS.map(vertical => {
            const meta = OWNER_VERTICAL_META[vertical]
            const Icon = ICONS[vertical]
            const active = selected === vertical
            return (
              <button
                key={vertical}
                type="button"
                onClick={() => setSelected(vertical)}
                className={cn(
                  'w-full rounded-lg border p-3 text-left transition-colors sm:p-4',
                  active
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/40',
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
                      active ? 'bg-primary text-primary-foreground' : 'bg-muted',
                    )}
                  >
                    {active ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{meta.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {meta.description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t px-3 py-3 sm:px-6">
          {!isRequired || !needsFocusSelection ? (
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => onOpenChange?.(false)}
            >
              Cancel
            </Button>
          ) : null}
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={saving || !selected}
            onClick={() => void handleSave()}
          >
            {saving ? 'Saving…' : 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
