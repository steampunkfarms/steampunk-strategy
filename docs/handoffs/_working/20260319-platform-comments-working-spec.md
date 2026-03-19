# Working Spec: Platform Comments (First Comment + Delayed Comments)

**Handoff ID:** 20260319-platform-comments
**Tier:** 2 (Standard)
**Target Repo:** steampunk-postmaster
**Date:** 2026-03-19

## Problem

Content storms post to Facebook, Instagram, and X, but there's no way to add a comment to those posts — either immediately after posting (e.g., a cogworks link as first comment) or days later (e.g., an engagement prompt 3 days after the post goes live). Comments are a proven engagement strategy and let us include links without polluting the main post text.

## API Capabilities Confirmed

| Platform | Self-comment? | Endpoint | Links clickable? | Time limit? |
|----------|-------------|----------|-----------------|-------------|
| Facebook | Yes | `POST /{post-id}/comments` | Yes | None |
| Instagram | Yes | `POST /{ig-media-id}/comments` | No (plain text) | None (except live video) |
| X | Yes (self-reply) | `POST /2/tweets` with `reply.in_reply_to_tweet_id` | Yes (native links) | None |

**Permissions already in place:** `pages_manage_engagement` (Facebook), X OAuth with `tweet.write`.
**Instagram:** Needs `instagram_manage_comments` permission — verify this is approved on the Meta app.

## Operator Decisions (2026-03-19)

1. **Schedule + Post Now:** Phase 1 starts with Post Now only. First comments must be visible and reschedulable in the review queue. Add filter for first comments and scheduled comments on queue screen.
2. **X placement:** First comment on anchor tweet only, not on zodiac thread replies.
3. **Instagram:** Include full capability. Support multiple sequential comments per rendition ("+ Another Comment") for extended storytelling format (story intro in post, continuation in comment chain).
4. **Delayed comment scope:** Per-rendition, anchor only for each platform. Zodiac/snippet renditions do not get delayed comments.
5. **Implementation order:** Phase 1 first, then Phase 2. Operator will interject between phases.

## Phase 1: First Comment (Immediate)

### Concept
When a storm posts to Facebook/Instagram/X, immediately fire a second API call to add a comment/reply with configurable text. This is the "first comment" strategy — keeps the main post clean while adding links, CTAs, or engagement hooks.

**Multiple comments supported:** The UI allows adding multiple sequential comments per rendition via "+ Another Comment" button. Comments are posted in order. This enables extended storytelling in IG comments (story intro in post, continuation via comment chain).

### Data Model

New Prisma model for first comments (supports multiple per rendition, ordered):

```prisma
model PlatformComment {
  id          String    @id @default(cuid())
  renditionId String
  rendition   Rendition @relation(fields: [renditionId], references: [id], onDelete: Cascade)

  // Content
  text        String    @db.Text
  sequence    Int       @default(0)  // 0 = first comment, 1 = second, etc.

  // Timing
  type        CommentType @default(FIRST_COMMENT)  // FIRST_COMMENT or DELAYED
  delayDays   Int?       // Only for DELAYED type: post N days after rendition posts

  // Scheduling (for review queue visibility)
  scheduledFor DateTime? // When this comment should post
  status      PlatformCommentStatus @default(PENDING)

  // Execution
  externalId  String?   // Platform comment/reply ID
  parentExternalId String? // For threaded IG comments: the previous comment's ID
  postedAt    DateTime?
  error       String?   @db.Text

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([status, scheduledFor])
  @@index([renditionId])
}

enum CommentType {
  FIRST_COMMENT  // Posts immediately after the parent rendition
  DELAYED        // Posts N days after the parent rendition
}

enum PlatformCommentStatus {
  PENDING      // Waiting for parent rendition to post
  SCHEDULED    // scheduledFor is set, visible in review queue
  POSTING      // Currently being posted
  POSTED       // Successfully posted
  FAILED       // Posting failed
}
```

Add relation to Rendition:
```prisma
model Rendition {
  // ... existing fields ...
  platformComments PlatformComment[]
}
```

**Note:** This single model serves both Phase 1 (FIRST_COMMENT) and Phase 2 (DELAYED). Phase 1 only creates FIRST_COMMENT records. Phase 2 adds DELAYED type with `delayDays`.

### UI Changes

**Storm detail page — PlatformOptionsPanel or new section:**

Per-platform "First Comment" configuration:
- Toggle: "Add first comment after posting"
- Text field: comment text (pre-populated with platform-appropriate default)
- Defaults per platform:
  - Facebook: "Read the full horoscopes at https://steampunkfarms.org/cogworks"
  - Instagram: "Full horoscopes at steampunkfarms.org/cogworks" (no clickable link, but visible)
  - X: "Full horoscopes: https://steampunkfarms.org/cogworks"

Stored in `PostmasterInput.meta.platformOptions.{PLATFORM}.firstComment`.

### API Changes

**Facebook (`/api/post/facebook/storm/route.ts`):**
After each successful `postToFacebook()` call that returns a `postId`:
```typescript
if (firstCommentConfig?.enabled && firstCommentConfig.platforms.includes('FACEBOOK')) {
  const commentResult = await postFacebookComment(postId, firstCommentConfig.text);
  // Store commentResult.commentId on the rendition
}
```

New helper:
```typescript
async function postFacebookComment(postId: string, message: string) {
  const res = await fetch(`https://graph.facebook.com/v24.0/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, access_token: META_PAGE_ACCESS_TOKEN }),
  });
  const data = await res.json();
  return { success: res.ok, commentId: data.id };
}
```

**Instagram (`/api/post/instagram/storm/route.ts`):**
Same pattern using `POST /{ig-media-id}/comments` with `{ message }`.

**X (`/api/post/x/storm/route.ts`):**
After posting the anchor tweet, fire a self-reply using the existing `reply.in_reply_to_tweet_id` pattern. For zodiac thread posts, the first comment goes on the anchor only (not every thread reply).

### Schedule flow
When using Schedule (Facebook/Instagram scheduled posts), the first comment cannot be attached at schedule time — it must be posted when the main post goes live. Two options:
- **Option A (simple):** First comment only fires on "Post Now", not on Schedule. Document this limitation.
- **Option B (cron-based):** Store the first comment config, and when the cron detects a scheduled post has gone live (status flips to POSTED), fire the comment. This aligns with Phase 2 infrastructure.

**Recommendation:** Start with Option A, evolve to Option B when Phase 2 cron is built.

## Phase 2: Delayed Comments (Scheduled)

### Concept
Plant a comment on an existing post N days after it was posted. Use cases:
- Day 3: "Which sign resonated with you this week?" (engagement prompt)
- Day 5: "New horoscopes dropping Monday: https://steampunkfarms.org/cogworks" (cross-promotion)

### Data Model

New Prisma model:

```prisma
model ScheduledComment {
  id          String    @id @default(cuid())
  renditionId String
  rendition   Rendition @relation(fields: [renditionId], references: [id], onDelete: Cascade)

  // Content
  text        String    @db.Text
  platform    Platform

  // Scheduling
  delayDays   Int       // Post this comment N days after the rendition was posted
  scheduledFor DateTime? // Computed: rendition.postedAt + delayDays (set when rendition posts)

  // Execution
  status      ScheduledCommentStatus @default(PENDING)
  externalId  String?   // Platform comment/reply ID
  postedAt    DateTime?
  error       String?   @db.Text

  createdAt   DateTime  @default(now())

  @@index([status, scheduledFor])
  @@index([renditionId])
}

enum ScheduledCommentStatus {
  PENDING      // Waiting for the parent rendition to post (scheduledFor not yet set)
  SCHEDULED    // scheduledFor is set, waiting for cron to pick up
  POSTING      // Cron is currently posting
  POSTED       // Successfully posted
  FAILED       // Posting failed
}
```

Add relation to Rendition:
```prisma
model Rendition {
  // ... existing fields ...
  scheduledComments ScheduledComment[]
}
```

### UI Changes

**Storm detail page — per-platform section (below PlatformOptionsPanel):**

"Scheduled Comments" card:
- "Add delayed comment" button
- For each delayed comment:
  - Days after posting: number input (default 3)
  - Comment text: text field
  - Platform: inherited from the selected platform tab
  - Remove button
- Multiple delayed comments can be stacked (e.g., Day 3 engagement, Day 5 cross-promo)

Stored as `ScheduledComment` records linked to the anchor rendition for each platform.

### Cron Job

**New route: `/api/cron/post-scheduled-comments`**

Runs every 15 minutes (Orchestrator-managed). Logic:
1. Query `ScheduledComment` where `status = 'SCHEDULED'` and `scheduledFor <= now()`
2. For each comment:
   - Look up parent rendition's `externalId` (the platform post ID)
   - Call the appropriate platform API to post the comment
   - Update status to POSTED or FAILED
3. Also query `ScheduledComment` where `status = 'PENDING'` and parent rendition `status = 'POSTED'`:
   - Compute `scheduledFor = rendition.postedAt + delayDays`
   - Update status to SCHEDULED

**Platform dispatch:**
```typescript
switch (comment.platform) {
  case 'FACEBOOK':
    await postFacebookComment(rendition.externalId, comment.text);
    break;
  case 'INSTAGRAM':
    await postInstagramComment(rendition.externalId, comment.text);
    break;
  case 'X':
    await postXReply(rendition.externalId, comment.text);
    break;
}
```

### Configuration Templates

Pre-built comment templates available in the UI:
- **Engagement prompt:** "Which sign resonated with you this week? Tell us below"
- **Cogworks link (FB/X):** "Read the full horoscopes: https://steampunkfarms.org/cogworks"
- **Cogworks link (IG):** "Full horoscopes at steampunkfarms.org/cogworks (link in bio)"
- **Cross-promo:** "New horoscopes every Monday. Follow along at steampunkfarms.org"

## Implementation Order

1. **Prisma migration:** Add `firstCommentId`, `firstCommentPostedAt` to Rendition + new `ScheduledComment` model
2. **Comment helper functions:** `postFacebookComment()`, `postInstagramComment()`, `postXReply()`
3. **Phase 1 UI:** First comment config in PlatformOptionsPanel
4. **Phase 1 wiring:** Integrate first comment into FB/IG/X storm posting routes
5. **Phase 2 UI:** Scheduled comments card on detail page
6. **Phase 2 cron:** `/api/cron/post-scheduled-comments` + Orchestrator registration
7. **Phase 1 + Schedule:** Evolve first comment to work with scheduled posts via the Phase 2 cron

## Files Affected

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add fields to Rendition + new ScheduledComment model |
| `lib/platform-comments.ts` | **New** — comment helper functions for FB/IG/X |
| `app/api/post/facebook/storm/route.ts` | Add first comment after posting |
| `app/api/post/instagram/storm/route.ts` | Add first comment after posting |
| `app/api/post/x/storm/route.ts` | Add first comment (self-reply) after posting |
| `app/api/cron/post-scheduled-comments/route.ts` | **New** — cron for delayed comments |
| `app/(protected)/inputs/[id]/PlatformOptionsPanel.tsx` | First comment toggle + text field |
| `app/(protected)/inputs/[id]/ScheduledCommentsPanel.tsx` | **New** — delayed comments UI |
| `app/(protected)/inputs/[id]/page.tsx` | Mount ScheduledCommentsPanel |
| `app/api/inputs/[id]/platform-options/route.ts` | Save first comment config to meta |
| `app/api/scheduled-comments/route.ts` | **New** — CRUD for scheduled comments |

## Acceptance Criteria

### Phase 1
- [ ] First comment toggle and text field visible per-platform on detail page
- [ ] Facebook "Post Storm Now" fires first comment immediately after each post
- [ ] Instagram "Post Storm Now" fires first comment after each post
- [ ] X "Post Storm Now" fires first comment (self-reply) on anchor tweet
- [ ] First comment platform ID stored on rendition for tracking
- [ ] First comment does NOT fire on Schedule (documented limitation until Phase 2 cron)

### Phase 2
- [ ] ScheduledComment model created with migration
- [ ] Delayed comments UI allows adding multiple comments per platform with day offset
- [ ] Cron route picks up scheduled comments and posts them
- [ ] Cron handles PENDING → SCHEDULED transition when parent rendition posts
- [ ] Failed comments logged with error, retryable
- [ ] First comment works with scheduled posts via the cron infrastructure

## Deferred Items
- Comment analytics (tracking engagement on planted comments)
- Comment templates library (CRUD for reusable templates)
- Auto-generated comment text via AI based on post content
- Instagram comment verification: confirm `instagram_manage_comments` permission is approved on Meta app
