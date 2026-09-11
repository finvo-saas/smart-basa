'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Upload, X } from 'lucide-react'
import Image from 'next/image'
import type { FamilyMember } from '@/types/renterProfile'

const familyMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  relation: z.enum(['spouse', 'child', 'parent', 'sibling', 'other']),
  age: z.number().min(0).max(150),
  gender: z.enum(['male', 'female', 'other']),
  phone: z.string().optional(),
  nid: z.string().optional(),
  isEmergencyContact: z.boolean().default(false),
})

type FamilyMemberFormData = z.infer<typeof familyMemberSchema>

interface FamilyMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: FamilyMember
  onSubmit: (data: FamilyMemberFormData & { photoFile?: File }) => void
}

export function FamilyMemberDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: FamilyMemberDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.photoUrl || null
  )

  const form = useForm<FamilyMemberFormData>({
    resolver: zodResolver(familyMemberSchema),
    defaultValues: {
      name: initialData?.name || '',
      relation: initialData?.relation || 'child',
      age: initialData?.age || 0,
      gender: initialData?.gender || 'male',
      phone: initialData?.phone || '',
      nid: initialData?.nid || '',
      isEmergencyContact: initialData?.isEmergencyContact || false,
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      name: initialData?.name || '',
      relation: initialData?.relation || 'child',
      age: initialData?.age || 0,
      gender: initialData?.gender || 'male',
      phone: initialData?.phone || '',
      nid: initialData?.nid || '',
      isEmergencyContact: initialData?.isEmergencyContact || false,
    })
    setSelectedFile(null)
    setPreviewUrl(initialData?.photoUrl || null)
  }, [open, initialData, form])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSubmit = (data: FamilyMemberFormData) => {
    onSubmit({
      ...data,
      photoFile: selectedFile || undefined,
    })
    form.reset()
    setSelectedFile(null)
    setPreviewUrl(null)
    onOpenChange(false)
  }

  const handleClose = () => {
    form.reset()
    setSelectedFile(null)
    setPreviewUrl(initialData?.photoUrl || null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Family Member' : 'Add Family Member'}
          </DialogTitle>
          <DialogDescription>
            Add information about a family member
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Photo Upload */}
            <div className="space-y-2">
              <FormLabel>Photo</FormLabel>
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border bg-muted">
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-2xl">👤</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 hover:bg-accent"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload Photo</span>
                  </label>
                  {selectedFile && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {selectedFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Relation */}
            <FormField
              control={form.control}
              name="relation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relation</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Age */}
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter age"
                        {...field}
                        onChange={e =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Gender */}
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* NID */}
            <FormField
              control={form.control}
              name="nid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NID (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter NID number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Emergency Contact */}
            <FormField
              control={form.control}
              name="isEmergencyContact"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Emergency Contact
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Mark as emergency contact
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {initialData ? 'Update' : 'Add'} Member
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
