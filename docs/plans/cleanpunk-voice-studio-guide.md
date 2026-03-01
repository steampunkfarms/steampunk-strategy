# CLEANPUNK SHOP — Voice Studio Recording Guide

> Take this into the studio. Each product gets one audio file.

---

## Recording Specs

| Setting | Value |
|---------|-------|
| **Format** | MP3 (128kbps or higher) |
| **Sample rate** | 44.1kHz |
| **Channels** | Mono |
| **Target length** | 30–60 seconds per product |
| **File naming** | `{product-handle}.mp3` (e.g., `filbur-soap-bar.mp3`) |
| **Tone** | Warm, conversational, like telling a friend about a cool product. Not a sales pitch. Not a commercial. Just real. |

---

## What to Record

Every product gets **one audio file** with three parts. Read them naturally as one flowing piece — no need to announce sections. Pause briefly between parts.

### Part 1: The Product (5–10 seconds)
What it is, what it smells like, how it feels.

### Part 2: The Story (15–30 seconds)
Read the product description. These are already written as stories — just read them aloud naturally. This is the heart of the recording.

### Part 3: The Impact (5–10 seconds)
What buying this product does. Keep it short and specific.

---

## Script Templates by Collection

### Ambassador Soap Bars (103 products)
These are the stars. Each bar is named after a rescued animal with a real story.

**Template:**
```
[Part 1 — The Product]
This is [Product Name] — a [scent vibe] bar with [exfoliation level] exfoliation.
It lathers up [creamy/rich] and rinses clean. Made with [1-2 key ingredients].

[Part 2 — The Story]
[Read the product description as written. These are already mini rescue stories.]

[Part 3 — The Impact]
Five dollars from this bar goes straight to [animal name]'s care
at Steampunk Farms Rescue Barn.
```

**Example (Filbur):**
```
This is Filbur — a warm, bakery-sweet bar with mild exfoliation
from ground oatmeal. It lathers up rich and creamy and rinses clean.
Made with shea butter and coconut oil.

[Read Filbur's product description — the rescue story about this potbelly pig]

Five dollars from this bar goes straight to Filbur's care
at Steampunk Farms Rescue Barn.
```

### Ambassador Sea Salt Scrubs (19 products)
Same as soaps but highlight the scrub texture.

**Template:**
```
This is [Product Name] sea salt scrub — a [scent vibe] scrub bar
with a rich, mineral-salt texture that leaves your skin feeling soft.
Made with [key ingredients] and real sea salt.

[Read the product description]

Five dollars from this scrub goes to [animal name]'s care at the barn.
```

### Simply Soaps (9 products)
These are the evergreen, unscented or simply-scented basics. No animal story — focus on the craft.

**Template:**
```
This is [Product Name] from our Simply Soaps line —
[brief scent/feel description]. Simple ingredients, nothing fancy,
just really good soap. Handmade in small batches right here at the barn.

[Read the product description]

Every bar helps fund animal rescue at Steampunk Farms.
```

### Solid Lotions (20 products)
Different application — emphasize how it works.

**Template:**
```
This is [Product Name] solid lotion — a [scent vibe] bar
you warm between your hands and apply directly to your skin.
No pump, no bottle, no waste. Made with [key ingredients].

[Read the product description]

Part of every purchase goes directly to animal care at the barn.
```

### Gift Sets & Combos (20 products)
Emphasize what's included and who it's for.

**Template:**
```
This is our [Product Name] gift set — [what's included].
Perfect for [occasion/person]. Every product in this set is handmade
and cruelty-free.

[Read the product description]

The whole set supports animal rescue at Steampunk Farms.
```

### Hand-Crocheted Pals (23 products)
These are made-to-order by Krystal. Emphasize the handmade nature.

**Template:**
```
This is [Product Name] — a hand-crocheted [animal type]
made by Krystal right here at the barn. Each one is made to order
just for you, so allow a few extra days for crafting.

[Read the product description]

Every pal supports the real animals at Steampunk Farms Rescue Barn.
```

### Hand-Stamped Aluminum (8 products)
Also made-to-order by Krystal.

**Template:**
```
This is [Product Name] — hand-stamped aluminum [item type]
made to order by Krystal. Each piece is stamped one letter at a time,
so no two are exactly alike.

[Read the product description]

Your purchase supports animal rescue at the barn.
```

### Bookmarks & Journals (14 products)
Quick and simple.

**Template:**
```
This is [Product Name] — [brief description].
Designed with our rescued animal ambassadors in mind.

[Read the product description]

Supports animal rescue at Steampunk Farms.
```

### Seeds & Garden Kits (33 products)
Focus on what grows.

**Template:**
```
This is [Product Name] — [what it grows/what's included].

[Read the product description]

Every kit supports the animals at Steampunk Farms Rescue Barn.
```

### Photo Buttons & Souvenirs (21 products), Wax Melts (6 products), Pet Care (2), Hair & Beard (2)
Shorter recordings — 15-20 seconds is fine.

**Template:**
```
This is [Product Name] — [one sentence about what it is].

[Read the product description]

Supports animal rescue at the barn.
```

---

## Recording Tips

1. **Read the descriptions as-is.** They're already written in your voice. Don't rewrite or summarize — the descriptions ARE the scripts.

2. **Don't rush the animal stories.** When you hit the part about how the animal was rescued, slow down a beat. That's the moment that connects.

3. **Say the animal's name with warmth.** These are real animals you know. Let that come through.

4. **It's okay to ad-lib slightly** around the template parts (1 and 3). The description (part 2) should be read faithfully since it matches what's on screen.

5. **Batch by collection.** Do all the Ambassador Soaps in one session, all the Scrubs in another, etc. Your tone will stay consistent within each type.

6. **Mark any descriptions that need editing.** If you hit a description that sounds awkward read aloud, note the product handle and we'll fix the text to flow better for both reading and listening.

---

## Priority Order

Record these first — they're the products people interact with most:

1. **Fan Favorite soaps** (18 products) — your best sellers, highest traffic
2. **Simply Soaps** (9 products) — evergreen, always in stock
3. **Remaining Ambassador Soaps** (~85 products)
4. **Sea Salt Scrubs** (19 products)
5. **Solid Lotions** (20 products)
6. **Gift Sets** (20 products)
7. **Everything else** (the remaining ~120 products)

---

## File Delivery

When recordings are done:
- Name each file `{product-handle}.mp3` (the handle is the URL slug — e.g., filbur's page is `/products/filbur-soap-bar`, so the file is `filbur-soap-bar.mp3`)
- Drop them in a shared folder or upload batch
- I'll upload them to Vercel Blob and wire them into the product metadata as `metadata.audio_url`
- The PDP will get an accessible audio player with play/pause, and screen readers will announce it as "Listen to product description"

---

## What This Enables

For **blind users:** They hear the scent, the texture, the animal's story — things they can't see on the page. This is the main accessibility win.

For **sighted users:** An optional "Listen" button on every PDP. Some people prefer audio. Some are browsing on mobile while doing other things. Some have dyslexia. This serves all of them.

For **the brand:** Nobody else in handmade soap does this. It's a differentiator that also happens to be the right thing to do.

---

*290 products × ~45 seconds average = roughly 3.5 hours of recording time. Batch by collection across multiple sessions.*
