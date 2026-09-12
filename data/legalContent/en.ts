export interface LegalSection {
  id: string
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export interface FaqItem {
  id: string
  category: string
  question: string
  answer: string
}

export interface HelpCategory {
  id: string
  title: string
  description: string
  icon: 'start' | 'account' | 'payment' | 'booking' | 'safety' | 'owner'
  links: { label: string; href: string }[]
}

export interface SafetyTip {
  id: string
  title: string
  description: string
  severity: 'critical' | 'important' | 'tip'
  dos?: string[]
  donts?: string[]
}

export const LEGAL_LAST_UPDATED = '5 July 2026'

export const termsSections: LegalSection[] = [
  {
    id: 'acceptance',
    title: '1. Acceptance of terms',
    paragraphs: [
      'By accessing or using SmartBasa (“Platform”), you agree to these Terms & Conditions. If you do not agree, please do not use the Platform.',
      'The Platform is operated for users in Bangladesh and is intended to connect renters, students, travellers, and property owners for mess, hostel, apartment, and short-stay listings.',
    ],
  },
  {
    id: 'accounts',
    title: '2. Accounts & eligibility',
    paragraphs: [
      'You must provide a valid Bangladesh mobile number (+880) for OTP verification. You are responsible for activity under your account.',
    ],
    bullets: [
      'You must be at least 18 years old to register as an owner or enter binding rental agreements.',
      'Students may use the Platform with guardian consent where required by law.',
      'One person must not create multiple accounts to evade suspensions or limits.',
    ],
  },
  {
    id: 'listings',
    title: '3. Listings & bookings',
    paragraphs: [
      'Owners are responsible for accurate photos, rent amounts, availability, and house rules. Misleading listings may be removed and accounts suspended.',
      'Bookings may be instant or request-based. Approved bookings create an agreement between renter and owner; the Platform facilitates discovery and records but is not the landlord unless explicitly stated.',
    ],
    bullets: [
      'Rent, deposit, and move-in dates must match what is shown before payment.',
      'Cancellation and refund rules follow the listing policy and Bangladesh consumer practice.',
      'Platform commission on digital payments is disclosed before checkout.',
    ],
  },
  {
    id: 'payments',
    title: '4. Payments & fees',
    paragraphs: [
      'Payments may be processed via bKash, Nagad, Rocket, card gateways, or cash (where offered). Cash payments remain pending until the owner confirms receipt.',
      'Subscription plans for owners (Free, Basic, Premium) and featured listing boosts are billed as described on the Subscription page. Fees are shown in Bangladeshi Taka (৳).',
    ],
  },
  {
    id: 'conduct',
    title: '5. Acceptable use',
    paragraphs: ['You agree not to:'],
    bullets: [
      'Post fake listings, stolen photos, or properties you do not have authority to rent.',
      'Harass users, discriminate unlawfully, or share others’ NID or personal data without consent.',
      'Circumvent platform fees by directing users off-platform after initial contact.',
      'Attempt to hack, scrape, or disrupt the Platform.',
    ],
  },
  {
    id: 'verification',
    title: '6. Verification & trust',
    paragraphs: [
      'We may request NID, property documents, or phone verification. Verified badges indicate completed checks at the time of review; they do not guarantee future behaviour.',
      'Report suspicious activity via Complaints, Disputes, or our Safety page. We may investigate and cooperate with authorities where required.',
    ],
  },
  {
    id: 'liability',
    title: '7. Limitation of liability',
    paragraphs: [
      'The Platform is provided “as is”. We strive for accuracy but do not guarantee uninterrupted service or that every user will fulfil their obligations.',
      'To the fullest extent permitted by Bangladesh law, SmartBasa is not liable for indirect losses, disputes between users, or offline agreements made outside the Platform.',
    ],
  },
  {
    id: 'changes',
    title: '8. Changes & contact',
    paragraphs: [
      'We may update these terms. Material changes will be noted on this page with an updated date.',
      'Questions: info@smartbasa.com · +880 1991166550 · Dhaka, Bangladesh.',
    ],
  },
]

export const privacySections: LegalSection[] = [
  {
    id: 'overview',
    title: '1. Overview',
    paragraphs: [
      'SmartBasa respects your privacy. This Policy explains what we collect, why we use it, and your choices. It applies to our website and apps for users in Bangladesh.',
    ],
  },
  {
    id: 'collect',
    title: '2. Information we collect',
    paragraphs: ['We may collect:'],
    bullets: [
      'Phone number, name, email, and role (renter / owner / admin staff).',
      'Profile details: NID references, photos, job info, emergency contacts (when you provide them).',
      'Listing data: addresses, photos, rent, availability, verification documents.',
      'Transaction data: bill amounts, payment method, transaction IDs (not full wallet PINs).',
      'Usage data: pages visited, device type, IP address, and cookies for session security.',
    ],
  },
  {
    id: 'use',
    title: '3. How we use information',
    paragraphs: ['We use data to:'],
    bullets: [
      'Verify identity via OTP and reduce fraud.',
      'Match renters with listings and process rent / booking payments.',
      'Send notices, reminders, and support messages you opt into.',
      'Improve search, analytics, and platform safety.',
      'Comply with legal requests and resolve disputes.',
    ],
  },
  {
    id: 'share',
    title: '4. Sharing & disclosure',
    paragraphs: [
      'We do not sell your personal data. We may share limited information with:',
    ],
    bullets: [
      'Other users — e.g. owner sees renter contact for an approved booking; public listings show property info only.',
      'Payment partners — bKash, Nagad, Rocket, or card processors to complete transactions.',
      'Service providers — hosting, SMS/OTP, email (under confidentiality agreements).',
      'Authorities — when required by Bangladesh law or to prevent serious harm or fraud.',
    ],
  },
  {
    id: 'security',
    title: '5. Security & retention',
    paragraphs: [
      'We use encryption in transit (HTTPS), access controls, and audit logging for admin actions. No system is 100% secure — report concerns immediately.',
      'We retain data while your account is active and as needed for legal, tax, and dispute records, then delete or anonymise where possible.',
    ],
  },
  {
    id: 'rights',
    title: '6. Your rights',
    paragraphs: ['You may request to:'],
    bullets: [
      'Access or correct profile information from Profile settings.',
      'Delete your account (subject to outstanding bills or legal holds).',
      'Opt out of non-essential marketing SMS/email.',
      'Contact us to raise a privacy complaint: info@smartbasa.com.',
    ],
  },
  {
    id: 'cookies',
    title: '7. Cookies & session storage',
    paragraphs: [
      'We use session storage for demo login state and cookies for theme preferences. Production auth will use secure, httpOnly cookies where applicable.',
    ],
  },
  {
    id: 'updates',
    title: '8. Policy updates',
    paragraphs: [
      'We will post changes on this page with a new “Last updated” date. Continued use after changes means acceptance of the updated Policy.',
    ],
  },
]

export const faqItems: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'Getting started',
    question: 'How do I create an account?',
    answer:
      'Enter your Bangladesh mobile number on the login page, verify the OTP sent to your phone, then choose Renter or Owner. Admin staff use the separate admin login.',
  },
  {
    id: 'faq-2',
    category: 'Getting started',
    question: 'Is SmartBasa free for renters?',
    answer:
      'Browsing, saving favourites, and many renter features are free. You pay rent and booking amounts directly to owners or through the Platform payment flow where enabled.',
  },
  {
    id: 'faq-3',
    category: 'Account',
    question: 'Can I change my phone number?',
    answer:
      'Account recovery and phone change will be available in Profile once backend auth is connected. Contact support if you lose access to your number.',
  },
  {
    id: 'faq-4',
    category: 'Bookings',
    question: 'What is the difference between instant book and request?',
    answer:
      'Instant book confirms immediately if the listing is available. Request sends your details to the owner, who can approve or reject — common for apartments and mess seats.',
  },
  {
    id: 'faq-5',
    category: 'Bookings',
    question: 'Can I cancel a booking?',
    answer:
      'Yes, from My Bookings before move-in where policy allows. Refunds depend on the listing cancellation rules and payment method. Cash pending payments can be cancelled before owner confirmation.',
  },
  {
    id: 'faq-6',
    category: 'Payments',
    question: 'Which payment methods are supported?',
    answer:
      'bKash, Nagad, Rocket, card (gateway coming soon), and cash. Cash shows as pending until the owner records receipt on the Bills page.',
  },
  {
    id: 'faq-7',
    category: 'Payments',
    question: 'Why does the owner see a commission on my booking?',
    answer:
      'The platform charges a small fee on digital transactions (shown in admin settings, typically 5%). Owners see gross rent, platform fee, and net payout before confirming.',
  },
  {
    id: 'faq-8',
    category: 'Owners',
    question: 'What are the subscription plans?',
    answer:
      'Free plan includes up to 3 flats. Basic and Premium add more flats, analytics, and support. Featured boosts are one-time add-ons for search visibility. See Subscription in your owner dashboard.',
  },
  {
    id: 'faq-9',
    category: 'Owners',
    question: 'How do I publish a listing to search?',
    answer:
      'Go to My Listings → New listing, add photos and details, then Publish. Verified listings rank higher; you can purchase a Featured boost for extra visibility.',
  },
  {
    id: 'faq-10',
    category: 'Safety',
    question: 'How do I report a scam or fake listing?',
    answer:
      'Use the Safety page tips first, then file a Complaint from your dashboard or contact support. Never pay large advance deposits outside verified flows. Admins review fraud reports.',
  },
  {
    id: 'faq-11',
    category: 'Safety',
    question: 'What does “Verified” mean on a listing?',
    answer:
      'It means the owner submitted documents (NID, property proof) that passed our review at that time. Always visit in person before large payments.',
  },
  {
    id: 'faq-12',
    category: 'Support',
    question: 'How do I contact support?',
    answer:
      'Email info@smartbasa.com, call +880 1991166550, or use the Contact form. Help Center articles and this FAQ cover most common questions.',
  },
]

export const helpCategories: HelpCategory[] = [
  {
    id: 'start',
    title: 'Getting started',
    description: 'Login, roles, and your first search or listing.',
    icon: 'start',
    links: [
      { label: 'Create an account', href: '/faq#faq-1' },
      { label: 'Explore search', href: '/search' },
      { label: 'Renter vs owner', href: '/faq#faq-2' },
    ],
  },
  {
    id: 'account',
    title: 'Account & profile',
    description: 'Phone login, profile completion, verification.',
    icon: 'account',
    links: [
      { label: 'Change phone (coming soon)', href: '/faq#faq-3' },
      { label: 'Edit profile', href: '/profile' },
      { label: 'Verification badge', href: '/faq#faq-11' },
    ],
  },
  {
    id: 'booking',
    title: 'Bookings & rentals',
    description: 'Requests, approvals, move-in, and cancellations.',
    icon: 'booking',
    links: [
      { label: 'Instant vs request', href: '/faq#faq-4' },
      { label: 'My bookings', href: '/my-bookings' },
      { label: 'Cancel a booking', href: '/faq#faq-5' },
    ],
  },
  {
    id: 'payment',
    title: 'Payments & bills',
    description: 'bKash, Nagad, rent slips, and receipts.',
    icon: 'payment',
    links: [
      { label: 'Payment methods', href: '/faq#faq-6' },
      { label: 'Pay a bill', href: '/payments' },
      { label: 'Owner commission', href: '/faq#faq-7' },
    ],
  },
  {
    id: 'owner',
    title: 'For owners',
    description: 'Buildings, listings, subscriptions, and payouts.',
    icon: 'owner',
    links: [
      { label: 'Subscription plans', href: '/subscription' },
      { label: 'Publish a listing', href: '/faq#faq-9' },
      { label: 'Manage properties', href: '/my-properties' },
    ],
  },
  {
    id: 'safety',
    title: 'Safety & trust',
    description: 'Avoid scams, report fraud, and stay secure.',
    icon: 'safety',
    links: [
      { label: 'Anti-scam guide', href: '/safety' },
      { label: 'Report a problem', href: '/complaints' },
      { label: 'Terms & Privacy', href: '/terms' },
    ],
  },
]

export const safetyTips: SafetyTip[] = [
  {
    id: 'advance',
    title: 'Never pay full advance to strangers',
    description:
      'A common scam in Dhaka and other cities: fake agents ask for 2–6 months rent via bKash before you see the flat. Use Platform bookings and visit in person first.',
    severity: 'critical',
    dos: [
      'Pay small holding fees only through Platform payment with receipt.',
      'Visit the property with a friend, especially for mess/hostel seats.',
    ],
    donts: [
      'Send money to personal bKash numbers from Facebook groups without verification.',
      'Trust listings with only stock photos and no video walkthrough.',
    ],
  },
  {
    id: 'verify',
    title: 'Verify owner and property',
    description:
      'Check NID, utility bill, or ownership proof. Match the address on the listing with Google Maps and the building sign.',
    severity: 'critical',
    dos: [
      'Prefer listings with Verified badge and reviews.',
      'Ask for a written agreement before large deposits.',
    ],
    donts: [
      'Sign blank papers or hand over original NID without copies.',
    ],
  },
  {
    id: 'messenger',
    title: 'Stay on platform when possible',
    description:
      'Scammers try to move chat to WhatsApp quickly to avoid records. Use in-app Messages and documented payments.',
    severity: 'important',
    dos: [
      'Keep booking and payment history in SmartBasa.',
      'Screenshot suspicious chats and report via Complaints.',
    ],
    donts: [
      'Share OTP codes with anyone claiming to be “support”.',
    ],
  },
  {
    id: 'too-good',
    title: 'If rent looks too cheap, investigate',
    description:
      'Unrealistically low rent in Gulshan, Uttara, or Dhanmondi often signals bait listings or hidden fees after you arrive.',
    severity: 'important',
    dos: [
      'Compare similar listings in the same area on Search.',
      'Ask about all charges: service, meal, electricity, wifi.',
    ],
  },
  {
    id: 'student',
    title: 'Student & mess-specific tips',
    description:
      'Confirm seat availability, meal times, curfew, and guest rules before paying mess fees for a full semester.',
    severity: 'tip',
    dos: [
      'Use My Mess dashboard after official check-in.',
      'Read mess rules on the property page.',
    ],
  },
  {
    id: 'report',
    title: 'Report fraud immediately',
    description:
      'If you are scammed or see a fake listing, report it so we can suspend accounts and warn others.',
    severity: 'critical',
    dos: [
      'File a Complaint with evidence (screenshots, transaction ID).',
      'Contact local police for large financial loss.',
      'Email info@smartbasa.com with listing URL.',
    ],
  },
]

export const FAQ_CATEGORIES = [
  'All',
  ...Array.from(new Set(faqItems.map(f => f.category))),
]
