#!/usr/bin/env npx tsx
/**
 * Phase 0: Facebook Archive Normalization
 *
 * Reads all 8 Facebook export chunks, fixes broken UTF-8 encoding,
 * deduplicates across chunks, and outputs clean normalized JSON files.
 *
 * Usage:
 *   npx tsx scripts/facebook-import/phase0-normalize.ts [--preview]
 *
 * Output: scripts/facebook-import/normalized-output/
 *   followers.json, reactions.json, comments.json, posts.json,
 *   messenger-threads.json, fundraisers.json, manifest.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { fixFacebookEncoding } from './lib/utf8-fix';
import { extractNameFromTitle, normalizeName } from './lib/name-parser';
import type {
  FbFollowersFile,
  FbReaction,
  FbComment,
  FbCommentsFile,
  FbPost,
  FbMessageThread,
  FbFundraiser,
  NormalizedFollower,
  NormalizedReaction,
  NormalizedComment,
  NormalizedPost,
  NormalizedThread,
  NormalizedMessage,
  NormalizedFundraiser,
  NormalizedManifest,
} from './lib/fb-types';

const PREVIEW = process.argv.includes('--preview');
const FB_ROOT = path.resolve(__dirname, '../../../Facebook Knowledge');
const OUTPUT_DIR = path.resolve(__dirname, 'normalized-output');

// ── Helpers ─────────────────────────────────────────────────────────────────

function readJson<T>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return fixFacebookEncoding(JSON.parse(raw)) as T;
  } catch {
    return null;
  }
}

function findChunks(): string[] {
  if (!fs.existsSync(FB_ROOT)) {
    console.error(`Facebook Knowledge directory not found: ${FB_ROOT}`);
    process.exit(1);
  }
  return fs.readdirSync(FB_ROOT)
    .filter(d => d.startsWith('facebook-steampunkfarms-'))
    .map(d => path.join(FB_ROOT, d))
    .filter(d => fs.statSync(d).isDirectory())
    .sort();
}

function globFiles(dir: string, pattern: RegExp): string[] {
  const results: string[] = [];
  function walk(d: string) {
    if (!fs.existsSync(d)) return;
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (pattern.test(entry.name)) results.push(full);
    }
  }
  walk(dir);
  return results;
}

// ── Extractors ──────────────────────────────────────────────────────────────

function extractFollowers(chunks: string[]): { raw: number; followers: NormalizedFollower[] } {
  const seen = new Set<string>();
  const followers: NormalizedFollower[] = [];
  let raw = 0;

  for (const chunk of chunks) {
    const file = path.join(chunk, 'connections', 'followers', 'people_who_followed_you.json');
    const data = readJson<FbFollowersFile>(file);
    if (!data) continue;

    const items = data.followers_v3 || data.followers_v2 || [];
    raw += items.length;

    for (const item of items) {
      const normalized = normalizeName(item.name);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      followers.push({ name: item.name, normalizedName: normalized });
    }
  }

  return { raw, followers };
}

function extractReactions(chunks: string[]): { raw: number; reactions: NormalizedReaction[] } {
  const seen = new Set<string>();
  const reactions: NormalizedReaction[] = [];
  let raw = 0;

  for (const chunk of chunks) {
    const activityDir = path.join(chunk, "this_profile's_activity_across_facebook", 'comments_and_reactions');
    const files = globFiles(activityDir, /^likes_and_reactions.*\.json$/);

    for (const file of files) {
      const data = readJson<FbReaction[]>(file);
      if (!data || !Array.isArray(data)) continue;
      raw += data.length;

      for (const item of data) {
        // Dedup key: timestamp + title (captures who + what)
        const dedupKey = `${item.timestamp}|${item.title}`;
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);

        const targetName = extractNameFromTitle(item.title);
        if (!targetName) continue; // Skip self-references and unrecognized patterns

        const reactionType = item.data?.[0]?.reaction?.reaction || 'NONE';

        reactions.push({
          timestamp: item.timestamp,
          reactionType,
          targetName,
          title: item.title,
        });
      }
    }
  }

  return { raw, reactions };
}

function extractComments(chunks: string[]): { raw: number; comments: NormalizedComment[] } {
  const seen = new Set<string>();
  const comments: NormalizedComment[] = [];
  let raw = 0;

  for (const chunk of chunks) {
    const file = path.join(
      chunk,
      "this_profile's_activity_across_facebook",
      'comments_and_reactions',
      'comments.json'
    );
    const data = readJson<FbCommentsFile>(file);
    if (!data) continue;

    const items = data.comments_v2 || [];
    raw += items.length;

    for (const item of items) {
      const commentText = item.data?.[0]?.comment?.comment || '';
      // Dedup key: timestamp + first 100 chars of comment text
      const dedupKey = `${item.timestamp}|${commentText.slice(0, 100)}`;
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);

      const targetName = extractNameFromTitle(item.title);
      if (!targetName) continue; // Skip self-references

      comments.push({
        timestamp: item.timestamp,
        targetName,
        commentText,
        title: item.title,
      });
    }
  }

  return { raw, comments };
}

function extractPosts(chunks: string[]): { raw: number; posts: NormalizedPost[] } {
  const seen = new Set<string>();
  const posts: NormalizedPost[] = [];
  let raw = 0;

  for (const chunk of chunks) {
    const postsDir = path.join(chunk, "this_profile's_activity_across_facebook", 'posts');
    const files = globFiles(postsDir, /^profile_posts.*\.json$/);

    for (const file of files) {
      const data = readJson<FbPost[]>(file);
      if (!data || !Array.isArray(data)) continue;
      raw += data.length;

      for (const item of data) {
        // Dedup by timestamp (only one chunk has posts)
        const dedupKey = `${item.timestamp}`;
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);

        const text = item.data?.find(d => d.post)?.post || '';
        const mediaUris: string[] = [];
        let place: NormalizedPost['place'] = undefined;

        if (item.attachments) {
          for (const att of item.attachments) {
            for (const d of att.data || []) {
              if (d.media?.uri) mediaUris.push(d.media.uri);
              if (d.place) place = d.place;
            }
          }
        }

        posts.push({
          timestamp: item.timestamp,
          text,
          title: item.title,
          mediaUris,
          place,
        });
      }
    }

    // Also grab videos.json if present
    const videosFile = path.join(postsDir, 'videos.json');
    const videosData = readJson<{ videos_v2?: FbPost[] }>(videosFile);
    if (videosData?.videos_v2) {
      for (const item of videosData.videos_v2) {
        const dedupKey = `${item.timestamp}`;
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);
        raw++;

        const text = item.data?.find(d => d.post)?.post || '';
        const mediaUris: string[] = [];

        if (item.attachments) {
          for (const att of item.attachments) {
            for (const d of att.data || []) {
              if (d.media?.uri) mediaUris.push(d.media.uri);
            }
          }
        }

        posts.push({ timestamp: item.timestamp, text, title: item.title || '', mediaUris });
      }
    }
  }

  return { raw, posts };
}

function extractMessengerThreads(chunks: string[]): {
  raw: number;
  threads: NormalizedThread[];
  uniqueParticipants: number;
} {
  const PAGE_NAME = 'Steampunk Farms Rescue Barn';
  // Merge threads across chunks by thread_path
  const threadMap = new Map<string, NormalizedThread>();
  let raw = 0;

  for (const chunk of chunks) {
    const messagesDir = path.join(chunk, "this_profile's_activity_across_facebook", 'messages');

    for (const subdir of ['inbox', 'filtered_threads']) {
      const dir = path.join(messagesDir, subdir);
      if (!fs.existsSync(dir)) continue;

      for (const threadDir of fs.readdirSync(dir)) {
        const threadPath = `${subdir}/${threadDir}`;
        const messageFiles = globFiles(path.join(dir, threadDir), /^message_\d+\.json$/);

        for (const file of messageFiles) {
          const data = readJson<FbMessageThread>(file);
          if (!data) continue;
          raw++;

          const participants = data.participants
            .map(p => p.name)
            .filter(n => n !== PAGE_NAME);

          const messages: NormalizedMessage[] = data.messages.map(m => ({
            senderName: m.sender_name,
            timestampMs: m.timestamp_ms,
            content: m.content,
            photoUris: m.photos?.map(p => p.uri),
          }));

          if (threadMap.has(threadPath)) {
            // Merge messages from this chunk into existing thread
            const existing = threadMap.get(threadPath)!;
            const existingTimestamps = new Set(existing.messages.map(m => m.timestampMs));
            for (const msg of messages) {
              if (!existingTimestamps.has(msg.timestampMs)) {
                existing.messages.push(msg);
              }
            }
          } else {
            threadMap.set(threadPath, {
              threadPath,
              participants,
              messages,
              isInbox: subdir === 'inbox',
              messageCount: 0, // computed after merge
              dateRange: { first: 0, last: 0 }, // computed after merge
            });
          }
        }
      }
    }
  }

  // Compute derived fields and sort messages
  const allParticipants = new Set<string>();
  for (const thread of threadMap.values()) {
    // Sort messages by timestamp (oldest first)
    thread.messages.sort((a, b) => a.timestampMs - b.timestampMs);
    thread.messageCount = thread.messages.length;
    if (thread.messages.length > 0) {
      thread.dateRange = {
        first: thread.messages[0].timestampMs,
        last: thread.messages[thread.messages.length - 1].timestampMs,
      };
    }
    for (const p of thread.participants) {
      allParticipants.add(p);
    }
  }

  const threads = Array.from(threadMap.values()).sort((a, b) =>
    a.threadPath.localeCompare(b.threadPath)
  );

  return { raw, threads, uniqueParticipants: allParticipants.size };
}

function extractFundraisers(chunks: string[]): { raw: number; fundraisers: NormalizedFundraiser[] } {
  const seen = new Set<string>();
  const fundraisers: NormalizedFundraiser[] = [];
  let raw = 0;

  for (const chunk of chunks) {
    const file = path.join(
      chunk,
      "this_profile's_activity_across_facebook",
      'fundraisers',
      'your_fundraiser_settings.json'
    );
    const data = readJson<FbFundraiser[]>(file);
    if (!data || !Array.isArray(data)) continue;
    raw += data.length;

    for (const item of data) {
      if (seen.has(item.fbid)) continue;
      seen.add(item.fbid);

      let amountRaised = 0;
      let creationTimestamp = 0;

      for (const lv of item.label_values) {
        if (lv.label === 'Amount raised' && lv.value) {
          amountRaised = parseInt(lv.value, 10) || 0;
        }
        if (lv.label === 'Creation time' && lv.timestamp_value) {
          creationTimestamp = lv.timestamp_value;
        }
      }

      fundraisers.push({ fbid: item.fbid, amountRaised, creationTimestamp });
    }
  }

  return { raw, fundraisers };
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Phase 0: Facebook Archive Normalization');
  console.log('═══════════════════════════════════════\n');

  const chunks = findChunks();
  console.log(`Found ${chunks.length} export chunks:\n`);
  for (const chunk of chunks) {
    console.log(`  ${path.basename(chunk)}`);
  }
  console.log();

  // Extract all data types
  console.log('Extracting followers...');
  const { raw: rawFollowers, followers } = extractFollowers(chunks);
  console.log(`  Raw: ${rawFollowers} → Deduped: ${followers.length}`);

  console.log('Extracting reactions...');
  const { raw: rawReactions, reactions } = extractReactions(chunks);
  console.log(`  Raw: ${rawReactions} → Deduped: ${reactions.length} (with extractable names)`);

  console.log('Extracting comments...');
  const { raw: rawComments, comments } = extractComments(chunks);
  console.log(`  Raw: ${rawComments} → Deduped: ${comments.length} (with extractable names)`);

  console.log('Extracting posts...');
  const { raw: rawPosts, posts } = extractPosts(chunks);
  console.log(`  Raw: ${rawPosts} → Deduped: ${posts.length}`);

  console.log('Extracting messenger threads...');
  const { raw: rawThreads, threads, uniqueParticipants } = extractMessengerThreads(chunks);
  console.log(`  Raw files: ${rawThreads} → Merged threads: ${threads.length} (${uniqueParticipants} unique participants)`);

  console.log('Extracting fundraisers...');
  const { raw: rawFundraisers, fundraisers } = extractFundraisers(chunks);
  const withAmount = fundraisers.filter(f => f.amountRaised > 0).length;
  console.log(`  Raw: ${rawFundraisers} → Deduped: ${fundraisers.length} (${withAmount} with raised amounts)`);

  // Summary
  console.log('\n── Summary ──────────────────────────────');
  console.log(`  Followers:   ${followers.length}`);
  console.log(`  Reactions:   ${reactions.length}`);
  console.log(`  Comments:    ${comments.length}`);
  console.log(`  Posts:       ${posts.length}`);
  console.log(`  Threads:     ${threads.length} (${uniqueParticipants} participants)`);
  console.log(`  Fundraisers: ${fundraisers.length} (${withAmount} with $)`);

  // Unique names across reactions + comments
  const reactionNames = new Set(reactions.map(r => normalizeName(r.targetName)));
  const commentNames = new Set(comments.map(c => normalizeName(c.targetName)));
  const allEngagementNames = new Set([...reactionNames, ...commentNames]);
  console.log(`\n  Unique names in reactions: ${reactionNames.size}`);
  console.log(`  Unique names in comments:  ${commentNames.size}`);
  console.log(`  Combined unique names:     ${allEngagementNames.size}`);

  if (PREVIEW) {
    console.log('\n✓ Preview mode — no files written.');
    console.log('  Run without --preview to write normalized output.\n');
    return;
  }

  // Write output
  console.log('\nWriting normalized output...');
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const write = (name: string, data: unknown) => {
    const file = path.join(OUTPUT_DIR, name);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    console.log(`  ${name} (${(fs.statSync(file).size / 1024).toFixed(1)} KB)`);
  };

  write('followers.json', followers);
  write('reactions.json', reactions);
  write('comments.json', comments);
  write('posts.json', posts);
  write('messenger-threads.json', threads);
  write('fundraisers.json', fundraisers);

  const manifest: NormalizedManifest = {
    generatedAt: new Date().toISOString(),
    sourceChunks: chunks.map(c => path.basename(c)),
    counts: {
      followers: { raw: rawFollowers, deduped: followers.length },
      reactions: { raw: rawReactions, deduped: reactions.length },
      comments: { raw: rawComments, deduped: comments.length },
      posts: { raw: rawPosts, deduped: posts.length },
      messengerThreads: { raw: rawThreads, deduped: threads.length, uniqueParticipants },
      fundraisers: { raw: rawFundraisers, deduped: fundraisers.length, withAmountRaised: withAmount },
    },
  };

  write('manifest.json', manifest);

  console.log('\n✓ Phase 0 complete. Normalized output ready.\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
