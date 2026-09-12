'use client'

import { Layout } from '@/components/layout/Layout'
import { PageContainer, PageHeader } from '@/components/page'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Mail, MapPin, Phone, Send } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

export default function Contact() {
  const t = useTranslations('legal')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <Layout>
      <PageContainer>
        <PageHeader
          title={t('contact.title')}
          description={t('contact.description')}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">
              {t('contact.getInTouch')}
            </h2>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>info@smartbasa.com</span>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>+880 1991166550</span>
              </li>
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>Dhaka, Bangladesh</span>
              </li>
            </ul>
            <p className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
              {t('contact.demoNote')}
            </p>
          </div>

          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle>{t('contact.form.title')}</CardTitle>
              <CardDescription>{t('contact.form.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {sent ? (
                <div
                  className="rounded-lg border border-green-200 bg-green-50 py-8 text-center text-sm text-green-900 dark:border-green-900 dark:bg-green-950/40 dark:text-green-100"
                  role="status"
                >
                  {t('contact.form.success', {
                    name: formData.name || t('contact.form.successFallbackName'),
                  })}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('contact.form.name')}</Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('contact.form.email')}</Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">{t('contact.form.message')}</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={4}
                    />
                  </div>
                  <Button type="submit" className="w-full sm:w-auto">
                    <Send className="mr-2 h-4 w-4" />
                    {t('contact.form.submit')}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </Layout>
  )
}
