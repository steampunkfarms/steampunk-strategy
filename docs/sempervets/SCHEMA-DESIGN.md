# SemperVets Command Center — Database Schema Design

> ORM: Drizzle ORM + Neon PostgreSQL (dedicated instance)
> Design principle: PM and Sales schemas are logically separable via feature flags
> All tables include `createdAt`, `updatedAt`, `deletedAt` (soft delete) unless noted
> All PII fields encrypted at rest via Neon's encryption
> Created: 2026-03-14

---

## Core Tables

### users
The auth + identity table. Every person in the system.

```sql
users
├── id                  UUID PRIMARY KEY
├── email               VARCHAR(255) UNIQUE NOT NULL
├── name                VARCHAR(255)
├── phone               VARCHAR(50)
├── role                ENUM('buyer','seller','pm_client','investor','vendor','lender','agent','admin','superadmin')
├── secondaryRoles      JSONB          -- allows multiple roles per user
├── avatarUrl           VARCHAR(500)
├── militaryBranch      VARCHAR(50)    -- Army, Navy, Marines, Air Force, Coast Guard, Space Force
├── isVeteran           BOOLEAN DEFAULT false
├── vaEligible          BOOLEAN
├── dreNumber           VARCHAR(50)    -- for licensed agents
├── onboardingComplete  BOOLEAN DEFAULT false
├── lastLoginAt         TIMESTAMP
├── createdAt           TIMESTAMP DEFAULT NOW()
├── updatedAt           TIMESTAMP DEFAULT NOW()
├── deletedAt           TIMESTAMP      -- soft delete
```

### sessions / accounts / verification_tokens
Standard NextAuth v5 tables (magic-link + Google SSO).

### contacts
The CRM contact record — extends user or stands alone for non-portal contacts.

```sql
contacts
├── id                  UUID PRIMARY KEY
├── userId              UUID REFERENCES users(id) -- nullable (contact may not have portal access)
├── firstName           VARCHAR(100) NOT NULL
├── lastName            VARCHAR(100) NOT NULL
├── email               VARCHAR(255)
├── phone               VARCHAR(50)
├── phoneSecondary      VARCHAR(50)
├── address             TEXT
├── city                VARCHAR(100)
├── state               VARCHAR(2)
├── zip                 VARCHAR(10)
├── source              VARCHAR(100)  -- "website", "referral", "open_house", "zillow", etc.
├── sourceDetail        VARCHAR(255)  -- referrer name, specific form, QR code ID
├── type                ENUM('buyer','seller','pm_owner','pm_tenant','investor','vendor','lender','other')
├── pipelineStage       ENUM('guest_card','lead','qualified','active','under_contract','closed','post_close','lost')
├── assignedTo          UUID REFERENCES users(id) -- Starlene or Ashlyn
├── militaryBranch      VARCHAR(50)
├── isVeteran           BOOLEAN DEFAULT false
├── vaEligible          BOOLEAN
├── vaEntitlementUsed   DECIMAL(12,2)
├── tags                JSONB          -- flexible tagging: ["VA", "PCS", "investor", "Camp Pendleton"]
├── notes               TEXT
├── customFields        JSONB          -- role-specific data (investment goals, property prefs, etc.)
├── lastContactedAt     TIMESTAMP
├── nextFollowUpAt      TIMESTAMP
├── createdAt           TIMESTAMP DEFAULT NOW()
├── updatedAt           TIMESTAMP DEFAULT NOW()
├── deletedAt           TIMESTAMP
```

### contact_relationships
Links contacts together (spouse, co-borrower, lender, inspector).

```sql
contact_relationships
├── id                  UUID PRIMARY KEY
├── contactId           UUID REFERENCES contacts(id) NOT NULL
├── relatedContactId    UUID REFERENCES contacts(id) NOT NULL
├── relationship        VARCHAR(50) -- "spouse", "co_borrower", "lender", "inspector", "agent"
├── createdAt           TIMESTAMP DEFAULT NOW()
```

### activities
Every interaction logged — calls, emails, showings, documents, notes.

```sql
activities
├── id                  UUID PRIMARY KEY
├── contactId           UUID REFERENCES contacts(id) NOT NULL
├── userId              UUID REFERENCES users(id)    -- who performed the activity
├── type                ENUM('call','email_sent','email_received','showing','document','note',
│                             'offer','sms','meeting','form_submission','status_change',
│                             'ai_analysis','payment','signature','login')
├── title               VARCHAR(255)
├── description         TEXT
├── metadata            JSONB          -- type-specific data (call duration, email subject, etc.)
├── aiSummary           TEXT           -- Claude-generated summary
├── aiSentiment         VARCHAR(20)    -- "positive", "neutral", "hesitant", "urgent"
├── aiNextActions       JSONB          -- suggested follow-ups
├── relatedEntityType   VARCHAR(50)    -- "listing", "property", "transaction", "document"
├── relatedEntityId     UUID
├── createdAt           TIMESTAMP DEFAULT NOW()
```

---

## Sales Module Tables

### listings
Active and historical property listings.

```sql
listings
├── id                  UUID PRIMARY KEY
├── mlsNumber           VARCHAR(50)
├── status              ENUM('draft','active','pending','sold','withdrawn','expired')
├── propertyType        ENUM('single_family','condo','townhouse','multi_family','land','ranch',
│                             'equestrian','farm','commercial','mobile_home')
├── address             TEXT NOT NULL
├── city                VARCHAR(100)
├── state               VARCHAR(2)
├── zip                 VARCHAR(10)
├── county              VARCHAR(100)
├── latitude            DECIMAL(10,7)
├── longitude           DECIMAL(10,7)
├── listPrice           DECIMAL(12,2)
├── soldPrice           DECIMAL(12,2)
├── bedrooms            INTEGER
├── bathrooms           DECIMAL(3,1)
├── sqft                INTEGER
├── lotSizeAcres        DECIMAL(10,2)
├── yearBuilt           INTEGER
├── -- Rural-specific fields (our differentiator)
├── waterRights         JSONB          -- type, amount, source
├── wellInfo            JSONB          -- depth, GPM, last tested
├── septicInfo          JSONB          -- type, capacity, last pumped
├── equestrianFacilities JSONB         -- barn, arena, pasture acres, fencing
├── huntingPotential    BOOLEAN
├── offGridCapable      BOOLEAN
├── solarInstalled      BOOLEAN
├── internetAvailability JSONB         -- providers, speeds, type (fiber/satellite/fixed wireless)
├── roadAccess          VARCHAR(100)   -- "paved", "graded dirt", "4WD required"
├── fireStationMiles    DECIMAL(5,1)
├── nearestBaseMiles    DECIMAL(5,1)   -- distance to nearest military base
├── nearestBase         VARCHAR(100)   -- "Camp Pendleton", "MCAS Miramar", etc.
├── vaAppraisalNotes    TEXT
├── zoningCode          VARCHAR(50)
├── -- Media
├── photos              JSONB          -- array of Vercel Blob URLs
├── virtualTourUrl      VARCHAR(500)   -- Matterport or video tour link
├── droneVideoUrl       VARCHAR(500)
├── -- AI-generated
├── aiDescription       TEXT           -- Claude-written listing description
├── aiHighlights        JSONB          -- key selling points extracted by AI
├── investmentFitScore  INTEGER        -- 0-100 for investor matching
├── lifestyleMatchData  JSONB          -- pre-computed match factors
├── -- Metadata
├── sellerContactId     UUID REFERENCES contacts(id)
├── listingAgentId      UUID REFERENCES users(id)
├── listDate            DATE
├── soldDate            DATE
├── daysOnMarket        INTEGER
├── createdAt           TIMESTAMP DEFAULT NOW()
├── updatedAt           TIMESTAMP DEFAULT NOW()
├── deletedAt           TIMESTAMP
```

### buyer_profiles
AI-generated buyer persona from Mission Briefing questionnaire.

```sql
buyer_profiles
├── id                  UUID PRIMARY KEY
├── contactId           UUID REFERENCES contacts(id) UNIQUE NOT NULL
├── questionnaire       JSONB          -- raw answers from Mission Briefing
├── personaProfile      JSONB          -- AI-generated: lifestyle, family needs, VA fit, etc.
├── preferredBedrooms   INTEGER
├── preferredBathrooms  DECIMAL(3,1)
├── minSqft             INTEGER
├── maxSqft             INTEGER
├── minAcres            DECIMAL(10,2)
├── maxAcres            DECIMAL(10,2)
├── maxPrice            DECIMAL(12,2)
├── minPrice            DECIMAL(12,2)
├── preferredCities     JSONB          -- ["Julian", "Ramona", "Santa Ysabel"]
├── propertyTypes       JSONB          -- ["single_family", "ranch", "equestrian"]
├── mustHaves           JSONB          -- ["fenced_yard", "well_water", "horse_facilities"]
├── niceToHaves         JSONB
├── dealBreakers        JSONB
├── vaLoanInterest      BOOLEAN
├── preApprovalStatus   VARCHAR(50)    -- "not_started", "in_progress", "approved", "not_using"
├── preApprovalAmount   DECIMAL(12,2)
├── lenderId            UUID REFERENCES contacts(id)
├── baseProximityPref   VARCHAR(100)   -- "Camp Pendleton < 30 min"
├── schoolDistrictPref  JSONB
├── lifestyleNotes      TEXT           -- AI summary of lifestyle preferences
├── matchScoreWeights   JSONB          -- custom weighting for match algorithm
├── createdAt           TIMESTAMP DEFAULT NOW()
├── updatedAt           TIMESTAMP DEFAULT NOW()
```

### investor_profiles
Capital Command — Investment Doctrine data.

```sql
investor_profiles
├── id                  UUID PRIMARY KEY
├── contactId           UUID REFERENCES contacts(id) UNIQUE NOT NULL
├── capitalBriefing     JSONB          -- raw answers from questionnaire
├── investorDoctrine    TEXT           -- AI-generated strategy document
├── strategy            ENUM('cash_flow','appreciation','hybrid','brrrr','house_hack','flip')
├── riskTolerance       ENUM('conservative','moderate','aggressive')
├── targetCapRate       DECIMAL(5,2)
├── targetCashOnCash    DECIMAL(5,2)
├── maxInvestment       DECIMAL(12,2)
├── preferredPropertyTypes JSONB       -- ["multi_family", "single_family", "land"]
├── vaEntitlementAvailable DECIMAL(12,2)
├── disabledVetStatus   BOOLEAN
├── disabledVetRating   INTEGER        -- percentage (0-100)
├── preferredLocations  JSONB
├── baseProximityPref   VARCHAR(100)
├── exitStrategy        VARCHAR(100)   -- "hold_5yr", "hold_10yr", "flip", "1031_exchange"
├── createdAt           TIMESTAMP DEFAULT NOW()
├── updatedAt           TIMESTAMP DEFAULT NOW()
```

### offers
Offer tracking for sellers and buyers.

```sql
offers
├── id                  UUID PRIMARY KEY
├── listingId           UUID REFERENCES listings(id) NOT NULL
├── buyerContactId      UUID REFERENCES contacts(id) NOT NULL
├── sellerContactId     UUID REFERENCES contacts(id) NOT NULL
├── status              ENUM('draft','submitted','countered','accepted','rejected','expired','withdrawn')
├── offerPrice          DECIMAL(12,2) NOT NULL
├── earnestMoney        DECIMAL(12,2)
├── closingDate         DATE
├── contingencies       JSONB          -- inspection, appraisal, financing, etc.
├── sellerConcessions   DECIMAL(12,2)
├── financingType       VARCHAR(50)    -- "VA", "FHA", "conventional", "cash"
├── documentUrl         VARCHAR(500)   -- uploaded offer PDF in Vault
├── -- AI Analysis
├── aiExtractedTerms    JSONB          -- AI-parsed terms from offer PDF
├── aiNetProceeds       DECIMAL(12,2)  -- calculated net for seller
├── aiRiskFlags         JSONB          -- ["low appraisal risk", "tight closing timeline"]
├── aiRanking           INTEGER        -- relative rank among multiple offers
├── aiAnalysis          TEXT           -- full AI narrative
├── counterOfferData    JSONB          -- AI-generated counter scenarios
├── createdAt           TIMESTAMP DEFAULT NOW()
├── updatedAt           TIMESTAMP DEFAULT NOW()
```

---

## Property Management Module Tables (Feature-Flagged — Decouples Cleanly)

### pm_properties
Managed properties under RHRPM.

```sql
pm_properties
├── id                  UUID PRIMARY KEY
├── ownerContactId      UUID REFERENCES contacts(id) NOT NULL
├── address             TEXT NOT NULL
├── city                VARCHAR(100)
├── state               VARCHAR(2)
├── zip                 VARCHAR(10)
├── propertyType        VARCHAR(50)
├── bedrooms            INTEGER
├── bathrooms           DECIMAL(3,1)
├── sqft                INTEGER
├── lotSizeAcres        DECIMAL(10,2)
├── monthlyRent         DECIMAL(10,2)
├── leaseStartDate      DATE
├── leaseEndDate        DATE
├── managementFeePercent DECIMAL(5,2)
├── status              ENUM('active','vacant','maintenance','onboarding','terminated')
├── appfolioId          VARCHAR(100)   -- link to AppFolio record when API available
├── insuranceProvider   VARCHAR(255)
├── insuranceExpiry     DATE
├── lastInspectionDate  DATE
├── nextInspectionDue   DATE
├── emergencyContacts   JSONB
├── propertyNotes       TEXT
├── createdAt           TIMESTAMP DEFAULT NOW()
├── updatedAt           TIMESTAMP DEFAULT NOW()
├── deletedAt           TIMESTAMP
```

### pm_tenants

```sql
pm_tenants
├── id                  UUID PRIMARY KEY
├── contactId           UUID REFERENCES contacts(id)
├── propertyId          UUID REFERENCES pm_properties(id) NOT NULL
├── leaseStartDate      DATE
├── leaseEndDate        DATE
├── monthlyRent         DECIMAL(10,2)
├── securityDeposit     DECIMAL(10,2)
├── status              ENUM('active','notice_given','eviction','former')
├── appfolioId          VARCHAR(100)
├── screeningResults    JSONB          -- TransUnion/Rentec data when available
├── createdAt           TIMESTAMP DEFAULT NOW()
├── updatedAt           TIMESTAMP DEFAULT NOW()
```

### pm_maintenance_requests

```sql
pm_maintenance_requests
├── id                  UUID PRIMARY KEY
├── propertyId          UUID REFERENCES pm_properties(id) NOT NULL
├── tenantId            UUID REFERENCES pm_tenants(id)
├── requestedBy         UUID REFERENCES users(id)
├── category            VARCHAR(100)   -- "plumbing", "electrical", "HVAC", "appliance", etc.
├── urgency             ENUM('emergency','urgent','routine','preventive')
├── description         TEXT
├── photos              JSONB          -- uploaded images
├── status              ENUM('submitted','reviewed','approved','dispatched','in_progress','completed','cancelled')
├── vendorId            UUID REFERENCES contacts(id)
├── estimatedCost       DECIMAL(10,2)
├── actualCost          DECIMAL(10,2)
├── ownerApprovalRequired BOOLEAN DEFAULT false
├── ownerApprovedAt     TIMESTAMP
├── ownerApprovedBy     UUID REFERENCES users(id)
├── aiCostEstimate      DECIMAL(10,2)  -- AI-suggested cost
├── aiVendorSuggestion  UUID REFERENCES contacts(id)
├── aiRoiImpact         TEXT           -- AI analysis of repair's impact on property value
├── aiPredicted         BOOLEAN DEFAULT false -- was this flagged by predictive maintenance?
├── completedAt         TIMESTAMP
├── createdAt           TIMESTAMP DEFAULT NOW()
├── updatedAt           TIMESTAMP DEFAULT NOW()
```

### pm_financials
Monthly financial records per property.

```sql
pm_financials
├── id                  UUID PRIMARY KEY
├── propertyId          UUID REFERENCES pm_properties(id) NOT NULL
├── month               DATE NOT NULL   -- first of month
├── rentCollected       DECIMAL(10,2)
├── managementFee       DECIMAL(10,2)
├── maintenanceCosts    DECIMAL(10,2)
├── otherExpenses       DECIMAL(10,2)
├── netIncome           DECIMAL(10,2)
├── notes               TEXT
├── aiSummary           TEXT           -- AI-generated monthly narrative
├── quickbooksSync      BOOLEAN DEFAULT false
├── createdAt           TIMESTAMP DEFAULT NOW()
├── updatedAt           TIMESTAMP DEFAULT NOW()
```

---

## Financial Module Tables

### transactions
Every real estate transaction (sale or PM management agreement).

```sql
transactions
├── id                  UUID PRIMARY KEY
├── type                ENUM('sale','pm_management','referral')
├── status              ENUM('pending','active','closed','cancelled')
├── listingId           UUID REFERENCES listings(id)
├── propertyId          UUID REFERENCES pm_properties(id)
├── buyerContactId      UUID REFERENCES contacts(id)
├── sellerContactId     UUID REFERENCES contacts(id)
├── salePrice           DECIMAL(12,2)
├── closingDate         DATE
├── gciTotal            DECIMAL(10,2)  -- Gross Commission Income
├── redHawkSplitPercent DECIMAL(5,2)   -- 25-50% for sales | 0% for RHRPM
├── redHawkSplitAmount  DECIMAL(10,2)
├── gcrNetAmount        DECIMAL(10,2)  -- what GCR Inc receives
├── division            ENUM('sales','pm') NOT NULL -- for decoupling
├── notes               TEXT
├── createdAt           TIMESTAMP DEFAULT NOW()
├── updatedAt           TIMESTAMP DEFAULT NOW()
```

### commission_splits
The 50/50 ledger — Starlene and Ashlyn's running balance.

```sql
commission_splits
├── id                  UUID PRIMARY KEY
├── transactionId       UUID REFERENCES transactions(id) NOT NULL
├── starleneAmount      DECIMAL(10,2) NOT NULL
├── ashlynAmount        DECIMAL(10,2) NOT NULL
├── starleneRunning     DECIMAL(12,2) NOT NULL -- running balance after this entry
├── ashlynRunning       DECIMAL(12,2) NOT NULL -- running balance after this entry
├── notes               TEXT
├── adjustmentType      ENUM('commission','expense','reimbursement','correction')
├── approvedBy          UUID REFERENCES users(id) -- both must approve changes
├── approvedAt          TIMESTAMP
├── -- IMMUTABLE AUDIT: no updatedAt — entries are append-only, corrections are new entries
├── createdAt           TIMESTAMP DEFAULT NOW()
```

### expenses
Business expense tracking.

```sql
expenses
├── id                  UUID PRIMARY KEY
├── category            ENUM('marketing','office','tech','travel','vehicle','insurance','dues',
│                             'education','supplies','meals','subscriptions','other')
├── subcategory         VARCHAR(100)
├── description         TEXT NOT NULL
├── amount              DECIMAL(10,2) NOT NULL
├── date                DATE NOT NULL
├── vendor              VARCHAR(255)
├── receiptUrl          VARCHAR(500)   -- Document Vault reference
├── division            ENUM('sales','pm','shared')
├── paidBy              ENUM('starlene','ashlyn','gcr','red_hawk')
├── taxDeductible       BOOLEAN DEFAULT true
├── taxCategory         VARCHAR(100)   -- IRS category for CPA export
├── reimbursable        BOOLEAN DEFAULT false
├── reimbursedAt        TIMESTAMP
├── quickbooksSynced    BOOLEAN DEFAULT false
├── createdAt           TIMESTAMP DEFAULT NOW()
├── updatedAt           TIMESTAMP DEFAULT NOW()
```

### recurring_bills
Bill Reminder AI Dashboard.

```sql
recurring_bills
├── id                  UUID PRIMARY KEY
├── name                VARCHAR(255) NOT NULL  -- "HOA - Pine Hills", "Supra Monthly"
├── vendor              VARCHAR(255)
├── amount              DECIMAL(10,2)
├── frequency           ENUM('weekly','monthly','quarterly','annually')
├── dueDay              INTEGER        -- day of month/week
├── autoPayEnabled      BOOLEAN DEFAULT false
├── category            VARCHAR(100)
├── division            ENUM('sales','pm','shared')
├── lastPaidDate        DATE
├── nextDueDate         DATE
├── reminderDaysBefore  INTEGER DEFAULT 3
├── notes               TEXT
├── createdAt           TIMESTAMP DEFAULT NOW()
├── updatedAt           TIMESTAMP DEFAULT NOW()
```

---

## Document, Calendar, Form, Email Tables

### documents
Unified Document Vault.

```sql
documents
├── id                  UUID PRIMARY KEY
├── filename            VARCHAR(255) NOT NULL
├── originalFilename    VARCHAR(255)
├── mimeType            VARCHAR(100)
├── sizeBytes           INTEGER
├── blobUrl             VARCHAR(500) NOT NULL  -- Vercel Blob URL
├── folderId            UUID REFERENCES document_folders(id)
├── contactId           UUID REFERENCES contacts(id)   -- associated client
├── listingId           UUID REFERENCES listings(id)   -- associated listing
├── propertyId          UUID REFERENCES pm_properties(id) -- associated PM property
├── transactionId       UUID REFERENCES transactions(id)
├── category            ENUM('contract','disclosure','offer','inspection','appraisal','insurance',
│                             'lease','tax','sop','script','template','receipt','correspondence','other')
├── aiExtractedText     TEXT           -- full text extracted by Claude
├── aiSummary           TEXT           -- AI-generated summary
├── aiKeyTerms          JSONB          -- closing date, contingencies, dollar amounts, etc.
├── signatureStatus     ENUM('none','pending','partial','completed')
├── docusignEnvelopeId  VARCHAR(100)   -- DocuSign reference when applicable
├── version             INTEGER DEFAULT 1
├── previousVersionId   UUID REFERENCES documents(id)
├── uploadedBy          UUID REFERENCES users(id)
├── isTemplate          BOOLEAN DEFAULT false
├── templateVariables   JSONB          -- variable definitions for template injection
├── createdAt           TIMESTAMP DEFAULT NOW()
├── updatedAt           TIMESTAMP DEFAULT NOW()
├── deletedAt           TIMESTAMP
```

### document_folders

```sql
document_folders
├── id                  UUID PRIMARY KEY
├── name                VARCHAR(255) NOT NULL
├── parentId            UUID REFERENCES document_folders(id) -- nested folders
├── createdBy           UUID REFERENCES users(id)
├── createdAt           TIMESTAMP DEFAULT NOW()
```

### calendar_events

```sql
calendar_events
├── id                  UUID PRIMARY KEY
├── title               VARCHAR(255) NOT NULL
├── description         TEXT
├── type                ENUM('showing','inspection','open_house','meeting','maintenance',
│                             'deadline','reminder','personal','pm_quarterly','renewal')
├── startTime           TIMESTAMP NOT NULL
├── endTime             TIMESTAMP NOT NULL
├── allDay              BOOLEAN DEFAULT false
├── location            TEXT
├── listingId           UUID REFERENCES listings(id)
├── propertyId          UUID REFERENCES pm_properties(id)
├── contactId           UUID REFERENCES contacts(id)   -- primary related contact
├── attendees           JSONB          -- array of contact/user IDs
├── createdBy           UUID REFERENCES users(id)
├── recurrenceRule      VARCHAR(255)   -- iCal RRULE format
├── recurrenceParentId  UUID REFERENCES calendar_events(id)
├── reminderMinutes     INTEGER DEFAULT 60
├── status              ENUM('scheduled','completed','cancelled','rescheduled')
├── aiSuggested         BOOLEAN DEFAULT false
├── aiReason            TEXT           -- why AI suggested this time
├── createdAt           TIMESTAMP DEFAULT NOW()
├── updatedAt           TIMESTAMP DEFAULT NOW()
```

### forms

```sql
forms
├── id                  UUID PRIMARY KEY
├── title               VARCHAR(255) NOT NULL
├── slug                VARCHAR(255) UNIQUE  -- for public URL
├── description         TEXT
├── type                ENUM('lead_capture','rental_app','buyer_onboarding','seller_onboarding',
│                             'investor_onboarding','maintenance_request','cma_request',
│                             'open_house_signin','disclosure','custom')
├── fields              JSONB NOT NULL -- field definitions with types, validation, conditional logic
├── settings            JSONB          -- redirect URL, notification recipients, auto-reply
├── pipelineRouting     JSONB          -- which pipeline stage + assignee on submission
├── qrCodeUrl           VARCHAR(500)   -- generated QR code image
├── isActive            BOOLEAN DEFAULT true
├── submissionCount     INTEGER DEFAULT 0
├── createdBy           UUID REFERENCES users(id)
├── createdAt           TIMESTAMP DEFAULT NOW()
├── updatedAt           TIMESTAMP DEFAULT NOW()
```

### form_submissions

```sql
form_submissions
├── id                  UUID PRIMARY KEY
├── formId              UUID REFERENCES forms(id) NOT NULL
├── data                JSONB NOT NULL -- submitted field values
├── contactId           UUID REFERENCES contacts(id) -- created/linked contact
├── source              VARCHAR(100)   -- "website", "qr_code", "email_link"
├── ipAddress           VARCHAR(45)
├── userAgent           TEXT
├── aiTriageResult      JSONB          -- AI categorization + priority
├── processedAt         TIMESTAMP      -- when routed to pipeline
├── createdAt           TIMESTAMP DEFAULT NOW()
```

### emails

```sql
emails
├── id                  UUID PRIMARY KEY
├── direction           ENUM('inbound','outbound') NOT NULL
├── from                VARCHAR(255) NOT NULL
├── to                  JSONB NOT NULL  -- array of recipients
├── cc                  JSONB
├── bcc                 JSONB
├── subject             VARCHAR(500)
├── bodyHtml            TEXT
├── bodyText            TEXT
├── attachments         JSONB          -- array of document IDs
├── contactId           UUID REFERENCES contacts(id)
├── campaignId          UUID REFERENCES email_campaigns(id)
├── threadId            VARCHAR(255)   -- email thread grouping
├── resendMessageId     VARCHAR(255)
├── status              ENUM('received','draft','queued','sent','delivered','bounced','complained')
├── aiCategory          VARCHAR(100)   -- "lead_inquiry", "showing_request", "offer", "spam"
├── aiDraftReply        TEXT           -- AI-generated reply draft
├── aiPriority          ENUM('high','medium','low')
├── readAt              TIMESTAMP
├── createdAt           TIMESTAMP DEFAULT NOW()
```

### email_campaigns

```sql
email_campaigns
├── id                  UUID PRIMARY KEY
├── name                VARCHAR(255) NOT NULL
├── type                ENUM('drip','blast','newsletter','market_report')
├── status              ENUM('draft','active','paused','completed')
├── subject             VARCHAR(500)
├── bodyTemplate        TEXT           -- with variable placeholders
├── audienceFilter      JSONB          -- CRM filter criteria for recipients
├── scheduledAt         TIMESTAMP
├── sentCount           INTEGER DEFAULT 0
├── openCount           INTEGER DEFAULT 0
├── clickCount          INTEGER DEFAULT 0
├── unsubscribeCount    INTEGER DEFAULT 0
├── createdBy           UUID REFERENCES users(id)
├── createdAt           TIMESTAMP DEFAULT NOW()
├── updatedAt           TIMESTAMP DEFAULT NOW()
```

### drip_sequences

```sql
drip_sequences
├── id                  UUID PRIMARY KEY
├── name                VARCHAR(255) NOT NULL
├── trigger             ENUM('form_submission','stage_change','manual','date_based','inactivity')
├── triggerConfig       JSONB          -- specific trigger params
├── steps               JSONB          -- ordered array of {delayDays, emailTemplateId, smsTemplate, condition}
├── isActive            BOOLEAN DEFAULT true
├── enrolledCount       INTEGER DEFAULT 0
├── createdAt           TIMESTAMP DEFAULT NOW()
├── updatedAt           TIMESTAMP DEFAULT NOW()
```

### calls (VoIP — Twilio)

```sql
calls
├── id                  UUID PRIMARY KEY
├── twilioCallSid       VARCHAR(100) UNIQUE
├── direction           ENUM('inbound','outbound')
├── from                VARCHAR(50)
├── to                  VARCHAR(50)
├── contactId           UUID REFERENCES contacts(id)
├── userId              UUID REFERENCES users(id)  -- agent who made/received
├── duration            INTEGER        -- seconds
├── recordingUrl        VARCHAR(500)
├── recordingConsent    BOOLEAN NOT NULL
├── transcriptFull      TEXT
├── transcriptSpeakers  JSONB          -- speaker-identified transcript
├── aiSummary           TEXT           -- Claude post-call brief
├── aiSentiment         VARCHAR(20)
├── aiKeyPhrases        JSONB          -- "VA loan", "fenced yard", "needs 3 bed"
├── aiNextActions       JSONB          -- "Schedule showing", "Counter at $X"
├── status              ENUM('ringing','in_progress','completed','missed','voicemail')
├── voicemailTranscript TEXT
├── createdAt           TIMESTAMP DEFAULT NOW()
```

### notifications

```sql
notifications
├── id                  UUID PRIMARY KEY
├── userId              UUID REFERENCES users(id) NOT NULL
├── type                ENUM('email','sms','push','in_app')
├── channel             VARCHAR(50)    -- "showing_reminder", "new_match", "offer_received", etc.
├── title               VARCHAR(255)
├── body                TEXT
├── data                JSONB          -- deep link, action buttons, etc.
├── sentAt              TIMESTAMP
├── readAt              TIMESTAMP
├── clickedAt           TIMESTAMP
├── status              ENUM('pending','sent','delivered','read','failed')
├── createdAt           TIMESTAMP DEFAULT NOW()
```

---

## Marketing & Content Tables

### social_posts

```sql
social_posts
├── id                  UUID PRIMARY KEY
├── platform            ENUM('instagram','facebook','linkedin','x','youtube')
├── type                ENUM('listing','market_update','testimonial','lifestyle','va_education','recipe','blog_promo')
├── status              ENUM('draft','scheduled','posted','failed')
├── content             TEXT NOT NULL
├── mediaUrls           JSONB          -- images/video Blob URLs
├── hashtags            JSONB
├── scheduledAt         TIMESTAMP
├── postedAt            TIMESTAMP
├── platformPostId      VARCHAR(255)   -- returned ID from platform API
├── engagement          JSONB          -- likes, comments, shares, impressions (polled)
├── listingId           UUID REFERENCES listings(id)
├── campaignId          UUID REFERENCES marketing_campaigns(id)
├── aiGenerated         BOOLEAN DEFAULT false
├── createdBy           UUID REFERENCES users(id)
├── createdAt           TIMESTAMP DEFAULT NOW()
├── updatedAt           TIMESTAMP DEFAULT NOW()
```

### marketing_campaigns

```sql
marketing_campaigns
├── id                  UUID PRIMARY KEY
├── name                VARCHAR(255) NOT NULL
├── type                ENUM('listing_launch','open_house','seasonal','veteran_outreach',
│                             'market_report','drip','custom')
├── status              ENUM('planning','active','paused','completed')
├── startDate           DATE
├── endDate             DATE
├── channels            JSONB          -- ["email","sms","instagram","facebook"]
├── budget              DECIMAL(10,2)
├── actualSpend         DECIMAL(10,2)
├── leadsGenerated      INTEGER DEFAULT 0
├── closedFromCampaign  INTEGER DEFAULT 0
├── roi                 DECIMAL(10,2)  -- calculated
├── notes               TEXT
├── createdBy           UUID REFERENCES users(id)
├── createdAt           TIMESTAMP DEFAULT NOW()
├── updatedAt           TIMESTAMP DEFAULT NOW()
```

### blog_posts

```sql
blog_posts
├── id                  UUID PRIMARY KEY
├── title               VARCHAR(255) NOT NULL
├── slug                VARCHAR(255) UNIQUE NOT NULL
├── content             TEXT NOT NULL   -- rich text / markdown
├── excerpt             TEXT
├── featuredImageUrl    VARCHAR(500)
├── category            ENUM('market_update','va_education','rural_living','investment',
│                             'community','recipe','pcs_relocation','property_management')
├── tags                JSONB
├── status              ENUM('draft','published','archived')
├── aiGenerated         BOOLEAN DEFAULT false
├── seoTitle            VARCHAR(255)
├── seoDescription      VARCHAR(300)
├── publishedAt         TIMESTAMP
├── authorId            UUID REFERENCES users(id)
├── createdAt           TIMESTAMP DEFAULT NOW()
├── updatedAt           TIMESTAMP DEFAULT NOW()
```

---

## System & Integration Tables

### audit_log
Immutable audit trail — NEVER soft-deleted.

```sql
audit_log
├── id                  UUID PRIMARY KEY
├── userId              UUID REFERENCES users(id)
├── action              VARCHAR(100) NOT NULL  -- "create", "update", "delete", "view", "login", "export"
├── entityType          VARCHAR(100) NOT NULL  -- "contact", "document", "commission_split", etc.
├── entityId            UUID
├── previousData        JSONB          -- snapshot before change
├── newData             JSONB          -- snapshot after change
├── ipAddress           VARCHAR(45)
├── userAgent           TEXT
├── createdAt           TIMESTAMP DEFAULT NOW()
-- NO updatedAt, NO deletedAt — immutable
```

### integration_sync_log
Track external API sync status.

```sql
integration_sync_log
├── id                  UUID PRIMARY KEY
├── integration         ENUM('mls','appfolio','quickbooks','docusign','stripe','square',
│                             'twilio','asana','zoho','crexi','canva','matterport')
├── direction           ENUM('inbound','outbound')
├── status              ENUM('success','partial','failed')
├── recordCount         INTEGER
├── errorMessage        TEXT
├── syncedAt            TIMESTAMP DEFAULT NOW()
```

### tasks
Internal task management (replaces ASANA for internal use).

```sql
tasks
├── id                  UUID PRIMARY KEY
├── title               VARCHAR(255) NOT NULL
├── description         TEXT
├── status              ENUM('todo','in_progress','waiting','done','cancelled')
├── priority            ENUM('urgent','high','medium','low')
├── assignedTo          UUID REFERENCES users(id)
├── contactId           UUID REFERENCES contacts(id)
├── listingId           UUID REFERENCES listings(id)
├── propertyId          UUID REFERENCES pm_properties(id)
├── dueDate             DATE
├── completedAt         TIMESTAMP
├── asanaTaskId         VARCHAR(100)   -- synced to Red Hawk's ASANA
├── aiGenerated         BOOLEAN DEFAULT false
├── aiReason            TEXT           -- why AI suggested this task
├── createdBy           UUID REFERENCES users(id)
├── createdAt           TIMESTAMP DEFAULT NOW()
├── updatedAt           TIMESTAMP DEFAULT NOW()
```

### settings
System-wide configuration key-value store.

```sql
settings
├── id                  UUID PRIMARY KEY
├── key                 VARCHAR(255) UNIQUE NOT NULL
├── value               JSONB NOT NULL
├── description         TEXT
├── updatedBy           UUID REFERENCES users(id)
├── updatedAt           TIMESTAMP DEFAULT NOW()
```

Example settings keys:
- `feature_flags.pm_enabled` → `true`
- `commission.red_hawk_split_percent` → `35`
- `ai.starlene_voice_prompt` → (system prompt text)
- `branding.dre_footer_text` → (formatted DRE string)
- `integrations.twilio.enabled` → `false` (until API ready)
- `integrations.mls.enabled` → `false`

---

## Schema Indexes (Performance-Critical)

```sql
-- Contact lookups
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_pipeline ON contacts(pipelineStage, assignedTo);
CREATE INDEX idx_contacts_type ON contacts(type);
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags);

-- Activity timeline
CREATE INDEX idx_activities_contact ON activities(contactId, createdAt DESC);
CREATE INDEX idx_activities_type ON activities(type, createdAt DESC);

-- Listings search
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_city ON listings(city, status);
CREATE INDEX idx_listings_price ON listings(listPrice) WHERE status = 'active';
CREATE INDEX idx_listings_rural ON listings(lotSizeAcres, waterRights, equestrianFacilities) WHERE status = 'active';
CREATE INDEX idx_listings_base ON listings(nearestBaseMiles) WHERE status = 'active';

-- PM lookups
CREATE INDEX idx_pm_properties_owner ON pm_properties(ownerContactId);
CREATE INDEX idx_pm_maintenance_property ON pm_maintenance_requests(propertyId, status);
CREATE INDEX idx_pm_financials_property ON pm_financials(propertyId, month DESC);

-- Commission tracking
CREATE INDEX idx_transactions_division ON transactions(division, status);
CREATE INDEX idx_commission_splits_date ON commission_splits(createdAt DESC);
CREATE INDEX idx_expenses_date ON expenses(date DESC, category);

-- Calendar
CREATE INDEX idx_calendar_time ON calendar_events(startTime, endTime);
CREATE INDEX idx_calendar_user ON calendar_events(createdBy, startTime);

-- Email
CREATE INDEX idx_emails_contact ON emails(contactId, createdAt DESC);
CREATE INDEX idx_emails_thread ON emails(threadId);

-- Documents
CREATE INDEX idx_documents_contact ON documents(contactId);
CREATE INDEX idx_documents_listing ON documents(listingId);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_fulltext ON documents USING GIN(to_tsvector('english', aiExtractedText));

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(userId, readAt, createdAt DESC);

-- Audit
CREATE INDEX idx_audit_entity ON audit_log(entityType, entityId, createdAt DESC);
CREATE INDEX idx_audit_user ON audit_log(userId, createdAt DESC);
```

---

## Schema Notes

1. **PM Decoupling:** All `pm_*` tables + `pm_maintenance_requests` + `pm_financials` are gated behind `feature_flags.pm_enabled`. When disabled, these tables exist but all routes/APIs return 404.

2. **Commission Split Immutability:** `commission_splits` has NO `updatedAt` and NO `deletedAt`. Corrections are new rows with `adjustmentType = 'correction'`. This is legally critical — Starlene's handwritten ledger replacement must be tamper-proof.

3. **Soft Deletes:** Most tables use `deletedAt` for soft delete. Queries must filter `WHERE deletedAt IS NULL` by default. The `audit_log` and `commission_splits` tables are exceptions — they are permanent.

4. **JSONB Fields:** Used extensively for flexible data (tags, custom fields, questionnaire answers, AI outputs). These should have GIN indexes where queried.

5. **Multi-Tenant Future:** Current schema is single-tenant (Starlene). To go multi-tenant, add `tenantId UUID` to every table + row-level security policies. The schema is designed so this is a mechanical addition, not a redesign.
