# Immersive Audio System — Future Dev Planning Doc

**Created:** February 24, 2026
**Scope:** Rescue Barn, Cleanpunk Shop (extensible to Studiolo, Postmaster, TARDIS)
**Priority:** Enhancement — post-launch feature
**Dependencies:** None blocking; pairs naturally with future AI chatbot control panel

---

## 1. Concept

A persistent, cross-page audio system that plays curated music, ambient soundscapes, and spoken narration across site pages. Each page (or route group) maps to a specific audio track or playlist. The system respects browser autoplay restrictions through tasteful interaction gates that feel intentional rather than obstructive, and gives users full control over their audio experience.

### Design Philosophy

Audio should feel like walking through a physical space — entering the barn, you hear the ambient hum of sanctuary life; stepping into the Academy, the mood shifts to focused classical; browsing Cleanpunk soaps, each Ambassador Animal's personality comes through in their signature track. The experience is opt-in by nature (browser policy enforces this) but designed so that the opt-in moment feels like part of the brand rather than a technical workaround.

---

## 2. Browser Autoplay Constraint

### The Rule
All modern browsers (Chrome, Safari, Firefox, Edge) block autoplay of audio until the user has performed a qualifying interaction (click, tap, or keypress) on the page's **origin**. This is a security-level policy and cannot be circumvented with code.

### What This Means
- Audio cannot play on page load without prior user interaction
- Once a user interacts with the origin, audio can autoplay on subsequent navigations **within that same origin**
- Permission is **origin-scoped** (protocol + domain + port), meaning:
  - `rescuebarn.steampunkfarms.org` = one origin
  - `cleanpunk.shop` = separate origin
  - `soap.steampunkfarms.org` = separate origin
  - Even two subdomains of `steampunkfarms.org` are separate origins
- **Cross-origin navigation resets the interaction state** — a user clicking through from Rescue Barn to Cleanpunk Shop has NOT satisfied Cleanpunk's autoplay gate

### Implication
Each site in the ecosystem needs its own interaction gate. This is not a limitation to fight — it's an opportunity to create branded entry moments unique to each site.

---

## 3. Interaction Gates (Per-Site Entry Points)

### Rescue Barn — "Welcome to the Sanctuary" Overlay

**Trigger:** First visit (no audio interaction cookie detected)
**Design:** A full-viewport soft overlay with:
- Sanctuary hero imagery (barn at golden hour or similar)
- Text: *"Welcome to Steampunk Farms. Where every story sustains the rescued animals living here, in sanctuary."*
- A warm CTA button: **"Enter the Sanctuary"** or **"Step Inside"**
- Subtle visual cue that audio will begin (small speaker icon near the CTA, not a warning — a feature)

**Behavior:**
- Click anywhere on the overlay (or the CTA specifically) satisfies the browser interaction requirement
- Audio context initializes and begins playing the homepage sanctuary anthem
- A `localStorage` flag (`sfra-audio-interacted: true`) prevents the overlay from showing on return visits
- Returning visitors who previously interacted can have audio resume automatically (browser remembers the origin interaction for that session)

**Important:** The overlay should feel like a brand moment, not a cookie banner. Think theatrical curtain rise, not GDPR popup. Keep it elegant, quick to dismiss, and optional — if someone clicks past it in 0.5 seconds, that's fine. The point is the click, not the reading.

### Cleanpunk Shop — "Soap of the Day" Overlay

**Trigger:** First visit to Cleanpunk Shop (separate origin, needs its own gate)
**Design:** A styled overlay featuring:
- The day's featured soap product with Ambassador Animal imagery
- Brief tagline or fun fact about the soap/animal
- **"Start Shopping"** or **"Keep Browsing"** CTA
- Click-anywhere-to-dismiss behavior

**Behavior:**
- Same interaction gate pattern as Rescue Barn but branded for commerce
- Could rotate daily using a simple day-of-week mapping or pull from a "featured" flag in the product catalog
- Audio context initializes on dismiss — if the current page has a mapped track (e.g., Jazzy's product page → Jazzy's song), it begins playing
- If the landing page doesn't have a specific track mapped, audio context is ready but silent until navigation to an audio-enabled page

**Dual purpose:** This overlay also serves as a soft merchandising moment, highlighting inventory and creating a daily-visit incentive. Not just a technical workaround — it's a feature.

### Future Sites (Studiolo, TARDIS, etc.)

Each site would get its own thematic gate appropriate to its purpose. The pattern is reusable; only the content and branding change.

---

## 4. Audio Architecture

### Global AudioProvider (Root Layout Component)

A React context provider that lives in the root `layout.tsx` of each site. Because Next.js App Router preserves the root layout across client-side navigations, this component **never unmounts** — making it perfect for persistent audio state.

```
Root Layout
├── AudioProvider (persistent, never unmounts)
│   ├── AudioContext (Web Audio API instance)
│   ├── Current track state
│   ├── Volume / mute state
│   ├── Interaction gate status
│   └── Route-to-track resolver
├── Header
├── {children} ← pages swap here
├── Footer
└── ControlPanel (floating UI, bottom-right)
```

### Core State

| State Key | Type | Purpose |
|---|---|---|
| `hasInteracted` | boolean | Whether browser autoplay gate has been satisfied |
| `isPlaying` | boolean | Whether audio is currently playing |
| `isMuted` | boolean | User's mute preference (persisted to localStorage) |
| `volume` | number (0-1) | Volume level (persisted to localStorage) |
| `currentTrack` | TrackConfig | null | Currently loaded/playing track |
| `currentRoute` | string | Current pathname (from Next.js router) |

### Route-to-Track Mapping

A configuration object that maps route patterns to audio tracks. Supports exact matches, prefix matches (for route groups like `/academy/*`), and no-match fallback (silence or ambient).

```typescript
// Example structure — not implementation code
const audioMap: AudioRouteConfig = {
  // Exact match
  '/': { 
    track: '/audio/sanctuary-anthem.mp3', 
    type: 'music',
    volume: 0.6,
    loop: true 
  },

  // Prefix match — all Academy pages
  '/academy': { 
    track: '/audio/classical-study-rotation.mp3', 
    type: 'music',
    volume: 0.3,  // Lower for study focus
    loop: true 
  },

  // Dynamic match — specific product pages
  '/products/jazzys-lavender-soap': { 
    track: '/audio/jazzys-song.mp3', 
    type: 'music',
    volume: 0.5,
    loop: true 
  },

  '/products/kroos-oatmeal-soap': { 
    track: '/audio/kroos-song.mp3', 
    type: 'music',
    volume: 0.5,
    loop: true 
  },

  // Narration example
  '/the-barn': {
    track: '/audio/narration/barn-welcome.mp3',
    type: 'narration',
    volume: 0.8,
    loop: false,    // Narration plays once
    background: '/audio/ambient/barn-atmosphere.mp3',  // Optional background layer
    backgroundVolume: 0.15
  }
};
```

### Track Resolution Priority

1. **Exact route match** (`/the-barn/the-catwalk`)
2. **Prefix match** (`/academy` catches `/academy/lesson/story-map`)
3. **No match** → audio context stays alive but silent; current track fades out gracefully

### Cross-Page Behavior

When a user navigates from one page to another:

| Scenario | Behavior |
|---|---|
| Same track mapped to both pages | Audio continues uninterrupted (no restart) |
| Different track on new page | Crossfade: old track fades out (1-2s), new track fades in |
| New page has no audio mapping | Current track fades out; audio context remains alive and ready |
| Return to audio-enabled page | Track fades in; picks up from beginning (music) or resumes (if implementing resume logic) |
| User has muted | No audio plays, but track state still updates (so unmuting on an audio page works immediately) |

### Audio Layering (Narration + Background)

For pages with narration, the system supports two simultaneous audio channels:

- **Primary channel:** Narration (spoken word, plays once)
- **Background channel:** Ambient/music (loops at low volume)

When narration finishes, background volume can optionally rise slightly to fill the space.

---

## 5. Persistent Control Panel UI

### Concept: Expandable Quick-Toggle Stack

A floating control panel anchored to the **bottom-right corner** of the viewport. Designed as a vertically stacking set of circular icon buttons that compress when idle and expand on hover/focus.

### Current Controls (Audio Phase)

| Icon | Function | States |
|---|---|---|
| 🔊 / 🔇 | Audio mute/unmute toggle | Playing / Muted / No audio on page |
| 🎵 | Track info (tooltip on hover showing current track name) | — |

### Future Controls (Stacking as features ship)

| Icon | Function | Ships With |
|---|---|---|
| 💬 | AI Chatbot toggle | AI chatbot feature |
| ♿ | Accessibility quick settings | Accessibility enhancement pass |
| 🌙 | Dark mode toggle | If/when dark mode is added |
| 📖 | Reading mode / text size | Content-heavy pages |

### Behavior

**Collapsed state (default/idle):**
- Only the topmost control icon is fully visible at normal size
- Remaining icons are compressed (smaller, slightly transparent, stacked tight)
- Minimal footprint — doesn't interfere with page content

**Expanded state (on hover or tap):**
- All controls expand to full size with spacing
- Each icon has a tooltip label
- The stack expands upward from the bottom-right anchor
- Smooth animation (200-300ms ease)

**Mobile:**
- Single tap expands the stack
- Tap outside collapses it
- Controls are sized for touch targets (min 44x44px)

**Persistence:**
- Panel is rendered in the root layout (same level as AudioProvider)
- Never unmounts between page navigations
- User preferences (muted, volume) persist via localStorage

### Homepage Exception

Per the design intent: the homepage does **not** show the audio toggle (since the welcome overlay serves as the entry point and the anthem is part of the intended experience). The control panel appears on all subsequent pages after the user has interacted with the overlay.

**Reconsidered alternative:** Show the toggle on the homepage too, but only after the overlay has been dismissed. This gives users immediate control if the anthem isn't their thing. Recommend this approach — never making someone hunt for a mute button is good UX.

---

## 6. Audio File Strategy

### Formats

| Format | Use Case | Browser Support |
|---|---|---|
| MP3 | Primary format, universal support | All browsers |
| OGG | Fallback (slightly better compression) | Chrome, Firefox, Edge (not Safari) |
| WAV | Development/source only | Not for production (too large) |

### Hosting

Audio files should be stored in Supabase Storage (not in the repo) to keep the deployment bundle lean. The AudioProvider fetches track URLs from a configuration that points to Supabase Storage public URLs.

**Bucket structure:**
```
audio/
├── music/
│   ├── sanctuary-anthem.mp3
│   ├── classical-study-01.mp3
│   ├── classical-study-02.mp3
│   ├── jazzys-song.mp3
│   └── kroos-song.mp3
├── narration/
│   ├── homepage-welcome.mp3
│   ├── barn-tour.mp3
│   └── academy-intro.mp3
└── ambient/
    ├── barn-atmosphere.mp3
    └── nature-background.mp3
```

### File Size Guidelines

- Music tracks: Target 2-4 MB each (128kbps MP3, 2-4 minutes)
- Narration clips: Target 500KB-2MB (64-96kbps MP3, shorter duration)
- Ambient loops: Target 1-2 MB (designed for seamless looping)

### Preloading Strategy

- **Current page track:** Preload immediately on route match
- **Likely next tracks:** Preload on hover over navigation links (optional optimization)
- **Don't preload:** Tracks for pages the user hasn't shown intent to visit

---

## 7. Accessibility & UX Considerations

### Must-Haves

- **Keyboard accessible mute toggle** (Tab-focusable, Enter/Space to toggle)
- **ARIA labels** on all audio controls (`aria-label="Mute background audio"`)
- **Respect prefers-reduced-motion** — disable crossfade animations if set
- **Respect system audio settings** — don't override OS-level mute
- **Visual indicator** when audio is playing (pulsing icon, equalizer bars, etc.)
- **No audio on page = no audio control** — don't show a mute button if there's nothing to mute (or show it grayed out so users know the feature exists)

### Should-Haves

- **Volume slider** (not just mute/unmute) accessible from the control panel on expand
- **"Remember my preference"** — if a user mutes, keep it muted across sessions until they unmute
- **Skip narration** button for spoken-word pages
- **Transcript available** for all narration (accessibility and SEO)

### Avoid

- Audio that restarts on every page navigation to the same route
- Loud default volumes — start conservative (0.3-0.5 for music, 0.7-0.8 for narration)
- Audio on error pages or auth flows
- Autoplaying audio on mobile without very clear indication

---

## 8. Implementation Phases

### Phase 1: Foundation (Rescue Barn Only)

- [ ] Build `AudioProvider` context component
- [ ] Build welcome overlay gate for homepage
- [ ] Implement route-to-track mapping (homepage anthem only)
- [ ] Build floating mute toggle (single button, bottom-right)
- [ ] localStorage persistence for mute preference and interaction state
- [ ] Upload sanctuary anthem to Supabase Storage
- [ ] Test across Chrome, Safari, Firefox, Edge, iOS Safari, Android Chrome

### Phase 2: Expand Coverage (Rescue Barn)

- [ ] Map Academy routes to classical study tracks
- [ ] Map individual barn area pages to ambient/narration
- [ ] Implement crossfade between different tracks
- [ ] Add volume slider to expanded control panel
- [ ] Add narration support with background layering
- [ ] Record and upload narration tracks

### Phase 3: Cleanpunk Shop

- [ ] Port AudioProvider pattern to Cleanpunk Shop codebase
- [ ] Build "Soap of the Day" overlay gate
- [ ] Map product pages to Ambassador Animal songs (Jazzy, Kroo, etc.)
- [ ] Animal-to-song mapping could pull from Postmaster data if we add an `audio_track_url` field to animal profiles

### Phase 4: Control Panel Expansion

- [ ] Refactor mute toggle into expandable control panel component
- [ ] Add collapse/expand animation and hover behavior
- [ ] Design control panel as a shared component package (for use across all sites)
- [ ] Integrate AI chatbot toggle when that feature ships
- [ ] Add additional controls as features warrant

### Phase 5: Advanced Features

- [ ] Playlist rotation for route groups (e.g., cycle through 5 classical pieces for Academy)
- [ ] Time-of-day audio (morning vs. evening ambient for the homepage)
- [ ] Seasonal tracks (holiday anthem variants)
- [ ] Audio preferences in user profile (logged-in users sync across devices)
- [ ] Analytics: track which pages have audio engagement, skip rates on narration

---

## 9. Postmaster Integration Opportunity

If we add an `audio_track_url` field (or similar) to the Postmaster animal profiles, Ambassador Animals could carry their signature songs across all platforms automatically:

- **Cleanpunk Shop:** Product pages play the Ambassador's song
- **Rescue Barn:** Resident profile pages play the animal's theme
- **Email campaigns:** Could link to a "Listen to [Animal]'s song" landing page

This follows the existing "enter once, appear everywhere" pattern. The song assignment lives in Postmaster; each site resolves it through the API.

---

## 10. Technical Notes

### Web Audio API vs. HTML5 Audio Element

**Recommendation: Start with HTML5 `<audio>` element, upgrade to Web Audio API if needed.**

HTML5 Audio is simpler, handles most use cases (play, pause, volume, loop), and has universal support. Web Audio API adds complexity but enables advanced features like:
- Precise crossfading between tracks
- Audio visualization (equalizer bars in the control panel)
- Spatial audio effects
- Real-time audio processing

Start simple. The AudioProvider can abstract the underlying implementation, so upgrading from HTML5 Audio to Web Audio API later doesn't require changing any consumer components.

### Bandwidth Consideration

Audio files add to page weight. Mitigate with:
- Lazy loading (don't fetch audio until interaction gate is passed)
- Appropriate compression (128kbps MP3 is plenty for background music)
- CDN caching via Supabase Storage + Vercel Edge
- Consider offering a "low bandwidth" mode that disables audio preloading

### SEO Impact

Audio has no negative SEO impact if:
- It doesn't delay page load (lazy loaded after interaction)
- Narration pages include text transcripts (which they should for accessibility anyway)
- Audio files are hosted externally (Supabase Storage, not in the build bundle)

---

## 11. Content Needed

| Track | Type | Duration | For | Status |
|---|---|---|---|---|
| Sanctuary Anthem | Music | 2-4 min | Homepage | **Owned — ready** |
| Classical Study (3-5 tracks) | Music | 3-5 min each | Academy pages | Needs sourcing (royalty-free classical or commission) |
| Jazzy's Song | Music | 2-3 min | Jazzy's product/profile pages | **Owned — ready** |
| Kroo's Song(s) | Music | 2-3 min | Kroo's product/profile pages | **Owned — ready** |
| Homepage Welcome Narration | Voice | 15-30 sec | Homepage (post-overlay) | Needs recording |
| Barn Area Narrations | Voice | 30-60 sec each | /the-barn/* pages | Needs scripting + recording |
| Academy Intro Narration | Voice | 15-30 sec | /academy landing | Needs scripting + recording |
| Barn Atmosphere Ambient | Ambient | 2-3 min loop | Barn pages background | Needs sourcing or recording |

---

## 12. Relationship to AI Chatbot (Future)

The floating control panel is designed to be the shared home for both audio controls and the future AI chatbot toggle. When the chatbot ships:

- Audio toggle moves to position 2 in the stack
- Chatbot toggle takes position 1 (most prominent)
- Both controls expand on hover/tap
- The panel becomes the persistent "utility belt" for the site
- Additional controls can be added without redesigning the UI pattern

This creates a consistent, scalable interaction pattern across the entire Steampunk Farms ecosystem.
