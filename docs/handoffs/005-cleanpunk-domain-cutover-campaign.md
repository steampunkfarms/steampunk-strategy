# Handoff 005: Cleanpunk Domain Cutover + Launch Campaign

**Date:** 2026-03-02
**Target repos:** cleanpunk-shop (Messenger button), steampunk-strategy (this doc)
**Status:** In progress

---

## Part 1: DNS Cutover — cleanpunk.shop → home.cleanpunk.shop

### Goal

Make `cleanpunk.shop` (apex domain) permanently redirect to `home.cleanpunk.shop` with a 308 (permanent redirect). Visitors typing the bare domain in a browser land on the storefront. Existing `home.cleanpunk.shop` links keep working.

### Step-by-Step: Vercel Dashboard

1. Go to **Vercel → steampunk-studiolo team → cleanpunk-shop-storefront project → Settings → Domains**
2. Click **"Add Domain"**
3. Enter `cleanpunk.shop`
4. Vercel will detect it's an apex domain and offer two options:
   - **"Redirect to home.cleanpunk.shop"** ← Choose this
   - "Add as primary domain"
5. Vercel creates a **308 Permanent Redirect** from `cleanpunk.shop` → `home.cleanpunk.shop`
6. Vercel will show DNS records you need to configure at your registrar

### DNS Records to Set at Your Registrar

**If your registrar supports ALIAS/ANAME records (Cloudflare, DNSimple, etc.):**

| Type | Name | Value |
|------|------|-------|
| ALIAS | `@` | `cname.vercel-dns.com` |

**If your registrar only supports A records (Namecheap, GoDaddy, etc.):**

| Type | Name | Value |
|------|------|-------|
| A | `@` | `76.76.21.21` |

**The `home` subdomain should already be set:**

| Type | Name | Value |
|------|------|-------|
| CNAME | `home` | `cname.vercel-dns.com` |

### Verification

After adding the domain in Vercel and updating DNS:

1. Vercel will show a yellow "Pending verification" badge — this resolves in minutes to hours depending on DNS propagation
2. Once verified, Vercel auto-provisions an SSL certificate for `cleanpunk.shop`
3. Test: `curl -I https://cleanpunk.shop` should show `308 Permanent Redirect` with `Location: https://home.cleanpunk.shop/`
4. Test in browser: typing `cleanpunk.shop` should land you on the storefront

### What NOT to Change

- Do **not** remove `home.cleanpunk.shop` from the Vercel project
- Do **not** set `cleanpunk.shop` as the primary domain (keep `home` as primary)
- All existing links to `home.cleanpunk.shop` continue working unchanged
- The redirect is handled at Vercel's edge — zero code changes needed

---

## Part 2: Messenger Button (Implemented)

The Facebook Customer Chat Plugin was deprecated in May 2024. The replacement is an **m.me link** — a direct URL that opens a Messenger conversation with the Steampunk Farms Facebook Page.

**m.me URL:** `https://m.me/steampunkfarms`

### What Was Built

1. **Floating Messenger button** — `src/modules/common/components/messenger-button/index.tsx`
   - Appears on all customer-facing pages (bottom-right, above cookie banner)
   - Delays 2 seconds after page load so it doesn't compete with content
   - Shows Messenger icon + "Message Us" text on desktop, icon-only on mobile
   - Opens m.me link in new tab → Messenger conversation with @steampunkfarms

2. **Contact page enhancement** — `src/app/[countryCode]/(main)/contact/page.tsx`
   - New "Message Us Instantly" section above Social Media links
   - Prominent blue Messenger button matching brand styling

### Facebook Page Requirements

Ensure in **Meta Business Suite → Settings → Messaging**:
- "Allow people to message your Page" is toggled **ON**
- Set up an **Instant Reply** greeting (e.g., "Hey! Thanks for reaching out to Cleanpunk Shop. We typically respond within a few hours. How can we help?")
- Set **Response Time** display to "Usually responds within a few hours"

---

## Part 3: Multi-Platform Announcement Campaign

### Strategy Notes

- **No active links in FB/IG post bodies** — Facebook throttles reach when posts contain links
- Present URL as "home dot cleanpunk dot shop" in post copy
- Place actual link in **first comment** on every post
- Update Facebook **About page** with the full `https://home.cleanpunk.shop` URL
- Instagram: update **Link in Bio** to point to `home.cleanpunk.shop`
- All posts should feature strong animal photos — the animals sell the story
- Reels/video: keep under 60 seconds, start with hook in first 3 seconds

---

### Campaign Phase 1: Launch Day (Post on all platforms simultaneously)

#### Facebook Post #1 — The Big Announcement

```
🧼 We've got a shiny new home!

Cleanpunk Shop just moved to a brand-new website and we couldn't be more excited.

Same rebel-made soaps. Same rescued-animal mission. Same small-batch everything.
But now: faster checkout, better product pages, easier browsing, and a whole lot more soul.

Come visit us at home dot cleanpunk dot shop

Every bar of soap funds a day of feed for sanctuary animals. That hasn't changed.
That will never change.

🐐 🐴 🐷 🐔 🐑

Drop a 🧼 in the comments if you've shopped with us before — or a 🐐 if you're about to.

#CleanpunkShop #CrueltyFreeSoap #SteampunkFarms #AnimalRescue #SmallBatchSoap #ShopWithPurpose #501c3 #SanctuaryLife
```

**First comment:** `Shop now → https://home.cleanpunk.shop`

**Photo guidance:** Hero shot of soap bars with a sanctuary animal (goats looking at camera are always winners).

---

#### Facebook Post #2 — The "How to Find Us" Helper

```
📍 Quick note for our Cleanpunk family:

Our new shop lives at a slightly different address:
home dot cleanpunk dot shop

If you had the old site bookmarked, update it to the new one and you're all set.
Same great soaps, same animals being fed, just a new front door.

Need help? Hit us up in Messenger — there's a blue button right on the site, or message us here. We're real people and we answer fast.

(Link in first comment 👇)
```

**First comment:** `Here's the direct link → https://home.cleanpunk.shop`

**Photo guidance:** Behind-the-scenes soap making photo, or "unboxing" style flat lay.

---

#### Instagram Post #1 — Carousel or Single Image

```
🧼 NEW SHOP. SAME MISSION.

Cleanpunk Shop just got a brand-new home on the web.

Faster. Cleaner. Still funding rescued lives with every bar.

Visit us at home dot cleanpunk dot shop
(link in bio!)

Same rebel-made cruelty-free soaps. Same small-batch heart.
$9 soap = 1 day of feed for a sanctuary animal.

If you've been meaning to try us — now's your moment.

🐐🧼🐴🧼🐷🧼

#CleanpunkShop #NewWebsite #CrueltyFree #VeganSoap #AnimalRescue #SteampunkFarms #SanctuaryAnimals #ShopSmall #SmallBatch #HandmadeSoap #501c3 #RescueBarn #ShopWithPurpose #GoatLife
```

**Photo guidance:**
- Slide 1: Hero product shot (soap bars arranged beautifully)
- Slide 2: Sanctuary animal close-up (ambassador animal for a soap flavor)
- Slide 3: Text graphic: "home.cleanpunk.shop — Our New Home"
- Slide 4: Soap being made / poured

---

#### Instagram Post #2 — The "Here's the Deal" Explainer

```
Quick heads-up for our fam 🫶

We moved! Our shop now lives at:
home dot cleanpunk dot shop

Same everything. Just a better address.

Bookmark it. Share it. Tell your friends who love great soap and rescued animals.

LINK IN BIO 👆

#CleanpunkShop #CrueltyFreeSoap #SteampunkFarms #AnimalSanctuary
```

**Photo guidance:** Simple, clean product shot or a cute animal face.

---

### Campaign Phase 2: Reinforcement (Days 2–5)

#### Facebook Post #3 — Product Spotlight + Soft Redirect

```
Meet [Ambassador Animal Name] — the face behind our [Soap Name] bar. 🐐

[2-3 sentences about this animal's rescue story and personality.]

This bar was created in their honor. Every purchase feeds sanctuary animals for a day.

Grab yours at our new shop: home dot cleanpunk dot shop

(Link in first comment 👇)

#CleanpunkShop #AmbassadorSoap #SteampunkFarms #RescueStory
```

**First comment:** `Shop [Soap Name] → https://home.cleanpunk.shop/us/products/[handle]`

---

#### Instagram Reel #1 — "Shop Tour" (30–45 seconds)

**Script/storyboard:**

```
HOOK (0-3 sec): "We just launched a brand new website and I want to show you around."

SCENE 1 (3-10 sec): Screen recording or phone showing the homepage loading.
"This is home dot cleanpunk dot shop — our new home."

SCENE 2 (10-20 sec): Quick scroll through products.
"Every single one of these soaps is handmade, cruelty-free, and funds our animal sanctuary."

SCENE 3 (20-30 sec): Cut to sanctuary footage — animals eating, playing, being cute.
"$9 buys a bar of soap AND feeds a rescued animal for a day. That's the deal."

SCENE 4 (30-40 sec): Back to the site, showing checkout or collections.
"New site, same mission. Come check it out."

TEXT OVERLAY: "home.cleanpunk.shop" (visible throughout final 5 seconds)

CAPTION:
We just launched our new shop! 🧼🐐
home dot cleanpunk dot shop — link in bio!
#CleanpunkShop #NewWebsite #CrueltyFreeSoap #SteampunkFarms #ShopSmall
```

---

#### Instagram Reel #2 — "Why We Do This" (45–60 seconds)

**Script/storyboard:**

```
HOOK (0-3 sec): Close-up of an animal face. "This is why we make soap."

SCENE 1 (3-15 sec): B-roll of sanctuary animals — morning feeding, goats climbing, pigs wallowing.
VOICEOVER: "Every bar of Cleanpunk soap funds one day of feed for a rescued animal at our sanctuary."

SCENE 2 (15-25 sec): Soap making footage — pouring, cutting, stamping.
VOICEOVER: "We handmake every bar. Small batch. Cruelty-free. Bold scents with bolder purpose."

SCENE 3 (25-40 sec): More animal footage, happy moments.
VOICEOVER: "We just moved to a brand new website. Same mission. Same soap. Better experience."

SCENE 4 (40-55 sec): Show the URL on a text card or on-screen.
VOICEOVER: "Come visit us at home dot cleanpunk dot shop. Every purchase matters."

END CARD: "home.cleanpunk.shop — Link in Bio"

CAPTION:
This is why we make soap. 🐐🧼
Brand new site, same rebel mission.
home dot cleanpunk dot shop — link in bio!
#CleanpunkShop #AnimalRescue #WhyWeMakeSoap #SteampunkFarms #CrueltyFree #SanctuaryLife #HandmadeSoap
```

---

#### Facebook Reel (Cross-post IG Reel #1 or #2)

Same content works on Facebook Reels. Facebook favors native video uploads over shared links, so this format is ideal.

---

### Campaign Phase 3: Patreon

#### Patreon Post — Patron-Exclusive Angle

```
Title: 🧼 Our New Digital Homestead Is Live!

Hey Barn Fam,

We've been working on something behind the scenes and it's finally here — Cleanpunk Shop has a brand-new website!

🔗 https://home.cleanpunk.shop

What's new:
• Faster, cleaner shopping experience
• Better product pages with ambassador animal stories
• Easier checkout process
• A Messenger button so you can reach us instantly if you need help

What hasn't changed:
• Every $9 bar = 1 day of feed for a sanctuary animal
• 100% handmade, cruelty-free, small-batch
• All profits go directly to the animals

As patrons, you were the first people who believed in this mission. We wanted you to be the first to know about the new shop too.

If you haven't tried our soap yet, now's the perfect time. And if you have — thank you. You're literally feeding our animals.

Share the new link with anyone who loves great soap and rescued animals:
https://home.cleanpunk.shop

— The Steampunk Farms Crew 🐐🐴🐷🐔🐑
```

---

### Campaign Phase 4: Email (SendGrid)

#### Subject Lines (A/B test):
- A: `We moved! Come see the new Cleanpunk Shop 🧼`
- B: `New site, same rebel soap — come visit 🐐`

#### Email Body:

```
Hey {first_name|there},

We've got some exciting news — Cleanpunk Shop has a brand-new home on the web!

🔗 VISIT THE NEW SHOP → https://home.cleanpunk.shop

What's different:
✓ Faster, cleaner shopping experience
✓ Better product pages with ambassador animal stories
✓ Easier checkout — fewer clicks, same great soap

What hasn't changed:
✓ Every $9 bar = 1 day of feed for a sanctuary animal
✓ Handmade, cruelty-free, small-batch
✓ 100% of profits go to the animals at Steampunk Farms Rescue Barn

IMPORTANT: If you have our old site bookmarked, update it to:
https://home.cleanpunk.shop

Need help? There's a blue Messenger button right on the site — tap it and we'll answer your question personally.

Thank you for being part of this. Every bar you buy is a day an animal gets fed. 🐐🧼

— The Cleanpunk Crew
Steampunk Farms Rescue Barn | 501(c)(3)

[SHOP NOW button → https://home.cleanpunk.shop]

---
You're receiving this because you've purchased from Cleanpunk Shop or signed up for updates.
Unsubscribe: {unsubscribe_link}
```

---

### Facebook & Instagram About Page Updates

#### Facebook About Section:
```
🧼 Rebel-made cruelty-free soap funding animal rescue.

Shop: https://home.cleanpunk.shop
Sanctuary: https://rescuebarn.steampunkfarms.org

Every $9 bar = 1 day of feed for a rescued sanctuary animal.
Handmade. Small-batch. Bold. Ethical. 501(c)(3).
```

#### Instagram Bio:
```
🧼 Rebel-made soap funding animal rescue
🐐 $9 = 1 day of feed for a sanctuary animal
👇 SHOP NOW
```
**Link in Bio:** `https://home.cleanpunk.shop`

---

## Part 4: Post-Campaign Checklist

- [ ] DNS: Add `cleanpunk.shop` to Vercel project as redirect domain
- [ ] DNS: Set A record (76.76.21.21) or ALIAS at registrar
- [ ] Verify: `curl -I https://cleanpunk.shop` → 308 redirect
- [ ] Verify: SSL certificate provisioned for cleanpunk.shop
- [ ] Facebook: Update About section with `home.cleanpunk.shop`
- [ ] Instagram: Update Link in Bio to `home.cleanpunk.shop`
- [ ] Instagram: Update bio text
- [ ] Patreon: Update any links in page settings
- [ ] Meta Business Suite: Set instant reply greeting for Messenger
- [ ] Meta Business Suite: Verify "Allow messages" is ON
- [ ] Post launch day content (FB #1, IG #1) simultaneously
- [ ] Post FB #2 and IG #2 later same day or next morning
- [ ] Send email campaign via SendGrid
- [ ] Post Patreon exclusive
- [ ] Days 2-5: Product spotlight posts with new URL
- [ ] Film and post Reels (shop tour + mission)
- [ ] Monitor Messenger for incoming questions
- [ ] 1 week later: Check analytics on new domain traffic vs. old
