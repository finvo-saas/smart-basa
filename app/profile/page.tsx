'use client'

import { UserVerificationPanel } from '@/components/auth/UserVerificationPanel'
import { CIMSBanner } from '@/components/compliance/CIMSBanner'
import { WhatsAppIcon } from '@/components/contact/WhatsAppButton'
import { CIMSRegistrationDialog } from '@/components/compliance/CIMSRegistrationDialog'
import { useConfirm } from '@/components/feedback'
import { LanguageSwitcher, useLocaleLabel } from '@/components/i18n'
import { Layout } from '@/components/layout/Layout'
import { DocumentCard } from '@/components/profile/DocumentCard'
import { DocumentUploadDialog } from '@/components/profile/DocumentUploadDialog'
import { EditProfileDialog } from '@/components/profile/EditProfileDialog'
import { EmergencyContactCard } from '@/components/profile/EmergencyContactCard'
import { EmergencyContactDialog } from '@/components/profile/EmergencyContactDialog'
import { FamilyMemberCard } from '@/components/profile/FamilyMemberCard'
import { FamilyMemberDialog } from '@/components/profile/FamilyMemberDialog'
import { JobInfoCard } from '@/components/profile/JobInfoCard'
import { JobInfoDialog } from '@/components/profile/JobInfoDialog'
import { RenterHistoryDialog } from '@/components/renter/RenterHistoryDialog'
import { useTheme } from '@/components/theme/ThemeProvider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMockQuery } from '@/hooks/useMockQuery'
import { useStoredRole } from '@/hooks/useStoredRole'
import { getCurrentAccountUserId } from '@/lib/api/account'
import { fetchCurrentUser, updateCurrentUser } from '@/lib/api/auth'
import { uploadMediaFile } from '@/lib/api/media'
import {
  fetchRenterHistory,
  fetchRenterProfile,
  saveRenterProfile,
} from '@/lib/api/profile'
import { toast } from '@/lib/feedback/toast'
import type { UserRole } from '@/types'
import type {
  Document,
  EmergencyContact,
  FamilyMember,
  JobInfo,
  RenterProfile,
} from '@/types/renterProfile'
import { getVerificationStatus, logout, syncUserDisplay, getProfilePhotoUrl, getDisplayName } from '@/utils/auth'
import {
  AlertCircle,
  Check,
  Edit,
  FileText,
  Globe,
  LogOut,
  Mail,
  Moon,
  Phone,
  Plus,
  Shield,
  Sun,
  User,
  Users,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

interface ProfileData {
  name: string
  phone: string
  whatsappNumber?: string
  email?: string
  role: UserRole
  verified: boolean
  heartbeatSmsOptIn: boolean
  pushOptIn: boolean
  profilePhotoUrl?: string | null
}

export default function ProfilePage() {
  const router = useRouter()
  const { confirm } = useConfirm()
  const { theme, toggle: toggleTheme } = useTheme()
  const localeLabel = useLocaleLabel()
  const tp = useTranslations('profile')
  const tContact = useTranslations('contact')
  const { role, ready } = useStoredRole()
  const profileUserId = getCurrentAccountUserId()
  const loadProfile = useCallback(
    () => fetchRenterProfile(profileUserId),
    [profileUserId]
  )
  const { data: profileData, refetch: refetchProfile } =
    useMockQuery(loadProfile)
  const renterHistoryUserId = profileUserId
  const loadHistory = useCallback(
    () => fetchRenterHistory(renterHistoryUserId),
    [renterHistoryUserId]
  )
  const { data: renterHistory } = useMockQuery(loadHistory)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [cimsDialogOpen, setCimsDialogOpen] = useState(false)
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    role: 'renter',
    verified: getVerificationStatus() === 'verified',
    heartbeatSmsOptIn: true,
    pushOptIn: true,
    profilePhotoUrl: null,
  })
  const [verificationStatus, setVerificationStatusState] = useState(
    getVerificationStatus()
  )

  // Extended profile (documents, job, family) — works for renter and owner
  const [userProfile, setUserProfile] = useState<RenterProfile>(() => ({
    userId: profileUserId,
    documents: [],
    familyMembers: [],
    emergencyContacts: [],
    updatedAt: new Date().toISOString(),
  }))
  const [showDocumentUpload, setShowDocumentUpload] = useState(false)
  const [showJobInfoDialog, setShowJobInfoDialog] = useState(false)
  const [showFamilyMemberDialog, setShowFamilyMemberDialog] = useState(false)
  const [editingFamilyMember, setEditingFamilyMember] =
    useState<FamilyMember | null>(null)
  const [showEmergencyContactDialog, setShowEmergencyContactDialog] =
    useState(false)
  const [editingEmergencyContact, setEditingEmergencyContact] =
    useState<EmergencyContact | null>(null)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)

  // Load profile from sessionStorage only after mount (hydration-safe)
  useEffect(() => {
    if (!ready) return
    if (profileData) {
      setUserProfile(profileData)
    }
    setVerificationStatusState(getVerificationStatus())
    // Show cached photo/name immediately while /accounts/me loads.
    setProfile(prev => ({
      ...prev,
      name: prev.name || getDisplayName(),
      profilePhotoUrl: getProfilePhotoUrl() || prev.profilePhotoUrl,
      role: (role as UserRole) || prev.role,
    }))
    void fetchCurrentUser().then(result => {
      if (!result.ok) return
      const user = result.data
      syncUserDisplay(user)
      setProfile({
        name: user.name || '',
        phone: user.phoneDigits || user.phone,
        whatsappNumber: user.whatsappNumber || '',
        email: user.email || '',
        role: user.role,
        verified: getVerificationStatus() === 'verified',
        heartbeatSmsOptIn: user.heartbeatSmsOptIn !== false,
        pushOptIn: user.pushOptIn !== false,
        profilePhotoUrl:
          user.profilePhotoUrl || user.profilePhoto || getProfilePhotoUrl(),
      })
    })
  }, [ready, role, profileData])

  const persistProfile = async (updated: RenterProfile) => {
    const previous = userProfile
    setUserProfile(updated)
    const result = await saveRenterProfile(profileUserId, updated)
    if (!result.ok) {
      setUserProfile(previous)
      toast.error(result.error || 'Could not save profile details')
      return false
    }
    setUserProfile(result.data)
    void refetchProfile()
    return true
  }

  const handleSave = async (data: {
    name: string
    phone: string
    whatsappNumber?: string
    email?: string
    photoFile?: File
  }): Promise<boolean> => {
    const result = await updateCurrentUser({
      name: data.name,
      email: data.email || '',
      whatsappNumber: data.whatsappNumber ?? '',
      profilePhoto: data.photoFile,
    })
    if (!result.ok) {
      toast.error(result.error)
      return false
    }
    syncUserDisplay(result.data)
    const photoUrl =
      result.data.profilePhotoUrl ||
      result.data.profilePhoto ||
      getProfilePhotoUrl()
    setProfile(prev => ({
      ...prev,
      name: result.data.name || data.name,
      phone: result.data.phoneDigits || data.phone,
      whatsappNumber: result.data.whatsappNumber || '',
      email: result.data.email || data.email,
      role: result.data.role,
      verified: getVerificationStatus() === 'verified',
      profilePhotoUrl: photoUrl || prev.profilePhotoUrl,
    }))
    toast.success('Profile updated successfully!')
    return true
  }

  // Document handlers
  const handleDocumentUpload = async (data: {
    type: Document['type']
    documentNumber: string
    file: File
    expiryDate?: Date
  }) => {
    const uploaded = await uploadMediaFile(data.file, 'document')
    if (!uploaded.ok) {
      toast.error(uploaded.error)
      return
    }
    const newDocument: Document = {
      id: `doc-${Date.now()}`,
      type: data.type,
      documentNumber: data.documentNumber,
      fileUrl: uploaded.data.url,
      fileKey: uploaded.data.key,
      fileName: data.file.name,
      fileSize: data.file.size,
      uploadedAt: new Date().toISOString(),
      expiryDate: data.expiryDate?.toISOString(),
      verificationStatus: 'pending',
    }
    void persistProfile({
      ...userProfile,
      documents: [...userProfile.documents, newDocument],
    })
  }

  const handleDocumentDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete document?',
      description: 'Are you sure you want to delete this document?',
      variant: 'destructive',
    })
    if (!ok) return
    persistProfile({
      ...userProfile,
      documents: userProfile.documents.filter(doc => doc.id !== id),
    })
  }

  // Job info handlers
  const handleJobInfoSave = (data: any) => {
    const newJobInfo: JobInfo = {
      id: userProfile.jobInfo?.id || `job-${Date.now()}`,
      ...data,
      employmentStartDate: data.employmentStartDate?.toISOString(),
      verificationStatus: 'pending',
    }
    persistProfile({ ...userProfile, jobInfo: newJobInfo })
  }

  // Family member handlers
  const handleFamilyMemberAdd = async (data: any) => {
    let photoUrl = editingFamilyMember?.photoUrl
    if (data.photoFile) {
      const uploaded = await uploadMediaFile(data.photoFile, 'profile')
      if (!uploaded.ok) {
        toast.error(uploaded.error)
        return
      }
      photoUrl = uploaded.data.url
    }
    const newMember: FamilyMember = {
      id: editingFamilyMember?.id || `fam-${Date.now()}`,
      name: data.name,
      relation: data.relation,
      age: data.age,
      gender: data.gender,
      phone: data.phone,
      nid: data.nid,
      photoUrl,
      isEmergencyContact: data.isEmergencyContact,
      createdAt: editingFamilyMember?.createdAt || new Date().toISOString(),
    }
    persistProfile({
      ...userProfile,
      familyMembers: editingFamilyMember
        ? userProfile.familyMembers.map(m =>
            m.id === editingFamilyMember.id ? newMember : m
          )
        : [...userProfile.familyMembers, newMember],
    })
    setEditingFamilyMember(null)
  }

  const handleFamilyMemberDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Remove family member?',
      description: 'Are you sure you want to remove this family member?',
      variant: 'destructive',
    })
    if (!ok) return
    persistProfile({
      ...userProfile,
      familyMembers: userProfile.familyMembers.filter(m => m.id !== id),
    })
  }

  // Emergency contact handlers
  const handleEmergencyContactAdd = (data: any) => {
    const newContact: EmergencyContact = {
      id: editingEmergencyContact?.id || `ec-${Date.now()}`,
      ...data,
    }
    persistProfile({
      ...userProfile,
      emergencyContacts: editingEmergencyContact
        ? userProfile.emergencyContacts.map(c =>
            c.id === editingEmergencyContact.id ? newContact : c
          )
        : [...userProfile.emergencyContacts, newContact],
    })
    setEditingEmergencyContact(null)
  }

  const handleEmergencyContactDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Remove emergency contact?',
      description: 'Are you sure you want to remove this emergency contact?',
      variant: 'destructive',
    })
    if (!ok) return
    persistProfile({
      ...userProfile,
      emergencyContacts: userProfile.emergencyContacts.filter(c => c.id !== id),
    })
  }

  const isRenter = profile.role === 'renter'
  const isOwner = profile.role === 'owner'

  if (!ready) {
    return (
      <Layout>
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 h-10 w-56 animate-pulse rounded-md bg-muted" />
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-lg bg-muted" />
            <div className="h-40 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl">Profile & Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isOwner
              ? 'Manage identity documents, job info, family, and account preferences'
              : 'Manage your profile, documents, family, and preferences'}
          </p>
        </div>
        <div className="mb-6">
          <CIMSBanner />
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList
            className={`w-full justify-start sm:grid ${isRenter ? 'sm:grid-cols-6' : 'sm:grid-cols-5'}`}
          >
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="family">Family</TabsTrigger>
            {isRenter && <TabsTrigger value="history">History</TabsTrigger>}
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Profile Information Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name */}
                <div className="flex items-start gap-4">
                  <Avatar
                    key={profile.profilePhotoUrl || 'no-photo'}
                    className="h-16 w-16 border border-border shadow-sm"
                  >
                    <AvatarImage
                      src={profile.profilePhotoUrl || undefined}
                      alt={profile.name || 'Profile photo'}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {profile.name?.trim() ? (
                        <span className="text-sm font-semibold">
                          {profile.name
                            .split(/\s+/)
                            .map(p => p[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      ) : (
                        <User className="h-7 w-7" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold">{profile.name}</p>
                      {profile.verified && (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                      {!profile.verified &&
                        verificationStatus === 'pending' && (
                          <Badge variant="secondary">
                            <Shield className="mr-1 h-3 w-3" />
                            Verification pending
                          </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {profile.role}
                    </p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{profile.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        {tContact('whatsappNumber')}
                      </p>
                      <p className="font-medium">
                        {profile.whatsappNumber || (
                          <span className="text-muted-foreground">
                            {tContact('notSet')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {profile.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{profile.email}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Role</p>
                      <p className="font-medium capitalize">{profile.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                    <div>
                      <p className="font-medium">Browser push notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Alerts on this device (vacancy checks, bills, messages).
                      </p>
                    </div>
                    <Switch
                      checked={profile.pushOptIn}
                      onCheckedChange={async checked => {
                        const previous = profile.pushOptIn
                        setProfile(prev => ({ ...prev, pushOptIn: checked }))
                        const result = await updateCurrentUser({
                          pushOptIn: checked,
                        })
                        if (!result.ok) {
                          setProfile(prev => ({
                            ...prev,
                            pushOptIn: previous,
                          }))
                          toast.error(result.error)
                        }
                      }}
                    />
                  </div>
                  {(profile.role === 'renter' || isOwner) && (
                    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                      <div>
                        <p className="font-medium">CIMS registration (DMP)</p>
                        <p className="text-sm text-muted-foreground">
                          Required for landlords and tenants in Dhaka.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCimsDialogOpen(true)}
                      >
                        Update
                      </Button>
                    </div>
                  )}
                  {isOwner && (
                    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                      <div>
                        <p className="font-medium">Vacancy SMS reminders</p>
                        <p className="text-sm text-muted-foreground">
                          Weekly SMS if you do not confirm via the app.
                        </p>
                      </div>
                      <Switch
                        checked={profile.heartbeatSmsOptIn}
                        onCheckedChange={async checked => {
                          const previous = profile.heartbeatSmsOptIn
                          setProfile(prev => ({
                            ...prev,
                            heartbeatSmsOptIn: checked,
                          }))
                          const result = await updateCurrentUser({
                            heartbeatSmsOptIn: checked,
                          })
                          if (!result.ok) {
                            setProfile(prev => ({
                              ...prev,
                              heartbeatSmsOptIn: previous,
                            }))
                            toast.error(result.error)
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Job/Institute Information */}
            <JobInfoCard
              jobInfo={userProfile.jobInfo}
              onEdit={() => setShowJobInfoDialog(true)}
            />
          </TabsContent>

          <TabsContent value="verification" className="space-y-6">
            <CIMSBanner />
            <UserVerificationPanel />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="mb-1 font-semibold">
                      {isOwner
                        ? 'Trust & verification documents'
                        : 'Rental agreements & checklists'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isOwner
                        ? 'Upload NID, passport, and police verification to build tenant trust in Bangladesh.'
                        : 'Manage rental agreements and move-in/move-out checklists.'}
                    </p>
                  </div>
                  {isRenter ? (
                    <Button asChild>
                      <Link href="/documents">
                        <FileText className="mr-2 h-4 w-4" />
                        View agreements
                      </Link>
                    </Button>
                  ) : (
                    <Button onClick={() => setShowDocumentUpload(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Upload document
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Identity & trust documents
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    NID, passport, driving license, police verification
                  </p>
                </div>
                <Button onClick={() => setShowDocumentUpload(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </CardHeader>
              <CardContent>
                {userProfile.documents.length > 0 ? (
                  <div className="space-y-4">
                    {userProfile.documents.map(doc => (
                      <DocumentCard
                        key={doc.id}
                        document={doc}
                        onView={() => {}}
                        onDelete={handleDocumentDelete}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p>No documents uploaded yet</p>
                    <Button
                      className="mt-4"
                      onClick={() => setShowDocumentUpload(true)}
                    >
                      Upload document
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Family Tab */}
          <TabsContent value="family" className="space-y-6">
            {/* Family Members */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Family Members
                </CardTitle>
                <Button
                  onClick={() => {
                    setEditingFamilyMember(null)
                    setShowFamilyMemberDialog(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </CardHeader>
              <CardContent>
                {userProfile.familyMembers.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {userProfile.familyMembers.map(member => (
                      <FamilyMemberCard
                        key={member.id}
                        member={member}
                        onEdit={m => {
                          setEditingFamilyMember(m)
                          setShowFamilyMemberDialog(true)
                        }}
                        onDelete={handleFamilyMemberDelete}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No family members added yet</p>
                    <Button
                      className="mt-4"
                      onClick={() => {
                        setEditingFamilyMember(null)
                        setShowFamilyMemberDialog(true)
                      }}
                    >
                      Add Family Member
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Emergency Contacts
                </CardTitle>
                <Button
                  onClick={() => {
                    setEditingEmergencyContact(null)
                    setShowEmergencyContactDialog(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Contact
                </Button>
              </CardHeader>
              <CardContent>
                {userProfile.emergencyContacts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {userProfile.emergencyContacts.map(contact => (
                      <EmergencyContactCard
                        key={contact.id}
                        contact={contact}
                        onEdit={c => {
                          setEditingEmergencyContact(c)
                          setShowEmergencyContactDialog(true)
                        }}
                        onDelete={handleEmergencyContactDelete}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No emergency contacts added yet</p>
                    <Button
                      className="mt-4"
                      onClick={() => {
                        setEditingEmergencyContact(null)
                        setShowEmergencyContactDialog(true)
                      }}
                    >
                      Add Emergency Contact
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab (renters only) */}
          {isRenter && (
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Rental History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const history = renterHistory

                    if (!history || history.rentalHistories.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No rental history available</p>
                          <p className="text-sm mt-2">
                            Your rental history will appear here once you start
                            renting properties.
                          </p>
                        </div>
                      )
                    }

                    return (
                      <div className="space-y-4">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                  Total Rentals
                                </p>
                              </div>
                              <p className="mt-1 text-2xl font-bold">
                                {history.totalRentals}
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                  Avg Rating
                                </p>
                              </div>
                              <p className="mt-1 text-2xl font-bold">
                                {history.averageRating.toFixed(1)}
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                  Complaints
                                </p>
                              </div>
                              <p className="mt-1 text-2xl font-bold">
                                {history.totalComplaints}
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                  Resolved
                                </p>
                              </div>
                              <p className="mt-1 text-2xl font-bold">
                                {history.resolvedComplaints}
                              </p>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Quick Preview */}
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold">
                            Recent Rentals
                          </h3>
                          {history.rentalHistories.slice(0, 3).map(rental => (
                            <Card
                              key={rental.id}
                              className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => setIsHistoryDialogOpen(true)}
                            >
                              <CardContent className="pt-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-semibold">
                                      {rental.propertyName}
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {rental.propertyAddress}
                                      {rental.flatNumber &&
                                        ` • Flat ${rental.flatNumber}`}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                      <span>
                                        {new Date(
                                          rental.moveInDate
                                        ).toLocaleDateString()}{' '}
                                        -{' '}
                                        {rental.moveOutDate
                                          ? new Date(
                                              rental.moveOutDate
                                            ).toLocaleDateString()
                                          : 'Present'}
                                      </span>
                                      <span>
                                        ৳{rental.monthlyRent.toLocaleString()}
                                        /month
                                      </span>
                                    </div>
                                  </div>
                                  <Badge variant="outline">
                                    {rental.status === 'ongoing'
                                      ? 'Current'
                                      : 'Completed'}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        {/* View Full History Button */}
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setIsHistoryDialogOpen(true)}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Full History
                        </Button>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Preferences Card */}
              <Card>
                <CardHeader>
                  <CardTitle>{tp('preferences')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div className="space-y-0.5">
                        <Label
                          htmlFor="language-toggle"
                          className="text-base font-medium"
                        >
                          {tp('language')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {localeLabel}
                        </p>
                      </div>
                    </div>
                    <LanguageSwitcher id="language-toggle" />
                  </div>

                  {/* Theme Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? (
                        <Moon className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Sun className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div className="space-y-0.5">
                        <Label
                          htmlFor="theme-toggle"
                          className="text-base font-medium"
                        >
                          Theme
                        </Label>
                        <p className="text-xs text-muted-foreground capitalize">
                          {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="theme-toggle"
                      checked={theme === 'dark'}
                      onCheckedChange={toggleTheme}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Account Actions Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/account/change-phone">
                      <Phone className="mr-2 h-4 w-4" />
                      Change phone number
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/privacy">Privacy policy</Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={async () => {
                      await logout()
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialogs — available for all roles */}
        <CIMSRegistrationDialog
          open={cimsDialogOpen}
          onOpenChange={setCimsDialogOpen}
        />

        <EditProfileDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          initialData={profile}
          onSave={handleSave}
        />

        <DocumentUploadDialog
          open={showDocumentUpload}
          onOpenChange={setShowDocumentUpload}
          onSubmit={handleDocumentUpload}
        />

        <JobInfoDialog
          open={showJobInfoDialog}
          onOpenChange={setShowJobInfoDialog}
          initialData={userProfile.jobInfo}
          onSubmit={handleJobInfoSave}
        />

        <FamilyMemberDialog
          open={showFamilyMemberDialog}
          onOpenChange={open => {
            setShowFamilyMemberDialog(open)
            if (!open) setEditingFamilyMember(null)
          }}
          initialData={editingFamilyMember || undefined}
          onSubmit={handleFamilyMemberAdd}
        />

        <EmergencyContactDialog
          open={showEmergencyContactDialog}
          onOpenChange={open => {
            setShowEmergencyContactDialog(open)
            if (!open) setEditingEmergencyContact(null)
          }}
          initialData={editingEmergencyContact || undefined}
          onSubmit={handleEmergencyContactAdd}
        />
      </div>

      {isRenter && (
        <RenterHistoryDialog
          renterId={renterHistoryUserId}
          renterName={profile.name}
          open={isHistoryDialogOpen}
          onOpenChange={setIsHistoryDialogOpen}
        />
      )}
    </Layout>
  )
}
