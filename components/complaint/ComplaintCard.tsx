'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, User, MessageSquare, Home, Send, Pencil } from 'lucide-react'
import type { Complaint, ComplaintStatus } from '@/types/complaint'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useState } from 'react'
import { SafeText } from '@/components/security/SafeText'
import {
  postComplaintMessage,
  updateComplaintStatus,
  patchComplaint,
} from '@/lib/api/complaints'
import { toast } from '@/lib/feedback/toast'
import { Input } from '@/components/ui/input'

interface ComplaintCardProps {
  complaint: Complaint
  isOwner?: boolean
  /** Author can edit title/description they created */
  canEditContent?: boolean
  onUpdated?: (complaint: Complaint) => void
}

const statusConfig = {
  open: {
    label: 'Open',
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  },
  in_progress: {
    label: 'In Progress',
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  },
  resolved: {
    label: 'Resolved',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800',
  },
}

export function ComplaintCard({
  complaint,
  isOwner = false,
  canEditContent = false,
  onUpdated,
}: ComplaintCardProps) {
  const [imageError, setImageError] = useState(false)
  const [reply, setReply] = useState('')
  const [status, setStatus] = useState<ComplaintStatus>(complaint.status)
  const [sending, setSending] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(complaint.title)
  const [editDescription, setEditDescription] = useState(complaint.description)
  const [savingEdit, setSavingEdit] = useState(false)
  const statusUi = statusConfig[complaint.status]
  const messages = complaint.messages ?? []

  const handleSaveContent = async () => {
    setSavingEdit(true)
    try {
      const result = await patchComplaint(complaint.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      onUpdated?.(result.data)
      setEditing(false)
      toast.success('Complaint updated')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleSendReply = async () => {
    const body = reply.trim()
    if (!body) return
    setSending(true)
    try {
      const result = await postComplaintMessage(complaint.id, body)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      const next: Complaint = {
        ...complaint,
        response: result.data.isStaffReply ? result.data.body : complaint.response,
        status:
          complaint.status === 'open' && result.data.isStaffReply
            ? 'in_progress'
            : complaint.status === 'resolved'
              ? 'in_progress'
              : complaint.status,
        messages: [...messages, result.data],
        updatedAt: new Date().toISOString(),
      }
      setReply('')
      onUpdated?.(next)
      toast.success('Reply sent')
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (nextStatus: ComplaintStatus) => {
    setUpdatingStatus(true)
    try {
      const result = await updateComplaintStatus(
        complaint.id,
        nextStatus,
        nextStatus === 'resolved' ? reply.trim() || complaint.response : undefined,
      )
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setStatus(result.data.status)
      onUpdated?.(result.data)
      toast.success('Status updated')
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg sm:text-xl">
              <SafeText as="span">{complaint.title}</SafeText>
            </CardTitle>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {complaint.userName}
              </span>
              {(complaint.scopeName ||
                complaint.buildingName ||
                complaint.flatNumber ||
                complaint.targetLabel) && (
                <span className="inline-flex items-center gap-1">
                  <Home className="h-3.5 w-3.5" />
                  {[
                    complaint.scopeName || complaint.buildingName,
                    complaint.targetLabel ||
                      (complaint.flatNumber
                        ? `Flat ${complaint.flatNumber}`
                        : null),
                    complaint.scopeType === 'mess' ? 'Mess' : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              )}
              {complaint.category && (
                <Badge variant="outline" className="text-xs capitalize">
                  {complaint.category}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-start gap-2">
            {canEditContent && !editing && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditTitle(complaint.title)
                  setEditDescription(complaint.description)
                  setEditing(true)
                }}
                aria-label="Edit complaint"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Badge variant="outline" className={cn('shrink-0', statusUi.className)}>
              {statusUi.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {editing ? (
          <div className="space-y-3">
            <Input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              placeholder="Title"
            />
            <Textarea
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              rows={4}
              placeholder="Description"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={savingEdit}
                onClick={() => void handleSaveContent()}
              >
                {savingEdit ? 'Saving…' : 'Save'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={savingEdit}
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <SafeText as="p" className="text-sm leading-relaxed text-muted-foreground">
            {complaint.description}
          </SafeText>
        )}

        {complaint.imageUrl && !imageError && (
          <div className="relative h-48 w-full overflow-hidden rounded-lg bg-muted">
            <Image
              src={complaint.imageUrl}
              alt={complaint.title}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        )}

        {messages.length > 0 && (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Thread</p>
            <div className="max-h-56 space-y-2 overflow-y-auto">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm',
                    msg.isStaffReply
                      ? 'border-l-2 border-primary bg-primary/5'
                      : 'bg-background',
                  )}
                >
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">
                      {msg.authorName}
                      {msg.isStaffReply ? ' · Owner' : ''}
                    </span>
                    <span>
                      {new Date(msg.createdAt).toLocaleString(undefined, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  <SafeText as="p">{msg.body}</SafeText>
                </div>
              ))}
            </div>
          </div>
        )}

        {complaint.response && messages.length === 0 && (
          <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-3">
            <div className="flex items-start gap-2">
              <MessageSquare className="mt-0.5 h-4 w-4 text-primary" />
              <div className="flex-1">
                <p className="text-xs font-medium text-primary">Response</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {complaint.response}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Textarea
            placeholder={isOwner ? 'Reply to tenant…' : 'Add a follow-up…'}
            value={reply}
            onChange={e => setReply(e.target.value)}
            className="min-h-[72px]"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              className="flex-1"
              disabled={sending || !reply.trim()}
              onClick={() => void handleSendReply()}
            >
              <Send className="mr-2 h-4 w-4" />
              {sending ? 'Sending…' : 'Send reply'}
            </Button>
            {isOwner && (
              <Select
                value={status}
                onValueChange={value =>
                  void handleStatusChange(value as ComplaintStatus)
                }
                disabled={updatingStatus}
              >
                <SelectTrigger className="sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Created: {new Date(complaint.createdAt).toLocaleDateString()}
            </span>
          </div>
          {complaint.resolvedAt && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                Resolved: {new Date(complaint.resolvedAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
