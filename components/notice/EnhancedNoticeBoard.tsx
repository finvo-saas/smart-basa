'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Bell,
  AlertCircle,
  Info,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Download,
  CheckCircle2,
  XCircle,
  Calendar,
  Tag,
  Eye,
} from 'lucide-react'
import type { Notice } from '@/types/mess'
import { cn } from '@/lib/utils'
import { SafeText } from '@/components/security/SafeText'
import { format } from 'date-fns'
// Using regular img tag for dynamic/external images

interface EnhancedNoticeBoardProps {
  notices: Notice[]
  userId?: string
  onAcknowledge?: (noticeId: string) => void
  showAcknowledgment?: boolean
}

const priorityConfig = {
  high: {
    icon: AlertCircle,
    className:
      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800',
    label: 'High',
  },
  medium: {
    icon: AlertTriangle,
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    label: 'Medium',
  },
  low: {
    icon: Info,
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    label: 'Low',
  },
}

const categoryConfig = {
  general: {
    label: 'General',
    className:
      'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  },
  payment: {
    label: 'Payment',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  },
  maintenance: {
    label: 'Maintenance',
    className:
      'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  },
  event: {
    label: 'Event',
    className:
      'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  },
  announcement: {
    label: 'Announcement',
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  },
  rule: {
    label: 'Rule',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  },
  other: {
    label: 'Other',
    className:
      'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  },
}

export function EnhancedNoticeBoard({
  notices,
  userId,
  onAcknowledge,
  showAcknowledgment = true,
}: EnhancedNoticeBoardProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null)

  // Filter out expired notices
  const activeNotices = notices.filter(notice => {
    if (!notice.expiryDate) return true
    return new Date(notice.expiryDate) >= new Date()
  })

  // Sort newest published first
  const sortedNotices = [...activeNotices].sort((a, b) => {
    const aTime = new Date(a.createdAt || a.date).getTime()
    const bTime = new Date(b.createdAt || b.date).getTime()
    return bTime - aTime
  })

  const isAcknowledged = (notice: Notice) => {
    if (!userId || !notice.acknowledgments) return false
    return notice.acknowledgments.some(ack => ack.userId === userId)
  }

  const handleAcknowledge = (noticeId: string) => {
    if (onAcknowledge) {
      onAcknowledge(noticeId)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notice Board</CardTitle>
            {activeNotices.length !== notices.length && (
              <Badge variant="outline" className="ml-auto">
                {activeNotices.length} Active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sortedNotices.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Bell className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p>No notices available</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {sortedNotices.map(notice => {
                  const priority = priorityConfig[notice.priority]
                  const PriorityIcon = priority.icon
                  const category = notice.category
                    ? categoryConfig[notice.category]
                    : null
                  const acknowledged = isAcknowledged(notice)

                  return (
                    <div
                      key={notice.id}
                      className={cn(
                        'rounded-lg border p-4 transition-all hover:shadow-md',
                        acknowledged && 'bg-muted/30'
                      )}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold leading-tight">
                              {notice.title}
                            </h4>
                            {acknowledged && showAcknowledgment && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(notice.date), 'MMM dd, yyyy')}
                            </div>
                            {notice.expiryDate && (
                              <>
                                <span>•</span>
                                <span>
                                  Expires:{' '}
                                  {format(
                                    new Date(notice.expiryDate),
                                    'MMM dd, yyyy'
                                  )}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge
                            variant="outline"
                            className={cn('shrink-0', priority.className)}
                          >
                            <PriorityIcon className="mr-1 h-3 w-3" />
                            {priority.label}
                          </Badge>
                          {category && (
                            <Badge
                              variant="outline"
                              className={cn('text-xs', category.className)}
                            >
                              <Tag className="mr-1 h-3 w-3" />
                              {category.label}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <SafeText as="p" className="text-sm text-muted-foreground leading-relaxed mb-3">
                        {notice.content}
                      </SafeText>

                      {/* Attachments */}
                      {(notice.pdfUrl ||
                        (notice.imageUrls && notice.imageUrls.length > 0)) && (
                        <div className="mt-3 space-y-2">
                          {notice.pdfUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto"
                              onClick={() =>
                                setSelectedPdf(notice.pdfUrl || null)
                              }
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              View PDF
                              <Download className="ml-2 h-4 w-4" />
                            </Button>
                          )}

                          {notice.imageUrls && notice.imageUrls.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {notice.imageUrls.map((url, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedImage(url)}
                                  className="relative"
                                >
                                  <ImageIcon className="mr-2 h-4 w-4" />
                                  Image {index + 1}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Acknowledgment Button */}
                      {showAcknowledgment && userId && !acknowledged && (
                        <div className="mt-3 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcknowledge(notice.id)}
                            className="w-full sm:w-auto"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Acknowledge
                          </Button>
                        </div>
                      )}

                      {/* Acknowledgment Count */}
                      {notice.acknowledgments &&
                        notice.acknowledgments.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {notice.acknowledgments.length}{' '}
                            {notice.acknowledgments.length === 1
                              ? 'person has'
                              : 'people have'}{' '}
                            acknowledged this notice
                          </div>
                        )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Image Viewer Dialog */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative w-full h-[70vh] flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Notice image"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Dialog */}
      <Dialog open={!!selectedPdf} onOpenChange={() => setSelectedPdf(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>PDF Document</DialogTitle>
          </DialogHeader>
          {selectedPdf && (
            <div className="w-full h-[70vh]">
              <iframe
                src={selectedPdf}
                className="w-full h-full rounded-lg border"
                title="PDF Viewer"
              />
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = selectedPdf
                    link.download = 'notice.pdf'
                    link.click()
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
