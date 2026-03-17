/**
 * TypeScript interfaces for Facebook data export JSON structures.
 * Derived from actual export samples (March 2026).
 */

// ── Raw Facebook Export Shapes ──────────────────────────────────────────────

export interface FbParticipant {
  name: string;
}

export interface FbPhoto {
  uri: string;
  creation_timestamp: number;
}

export interface FbShare {
  link: string;
}

export interface FbMessage {
  sender_name: string;
  timestamp_ms: number;
  content?: string;
  photos?: FbPhoto[];
  share?: FbShare;
  is_geoblocked_for_viewer: boolean;
  is_unsent_image_by_messenger_kid_parent: boolean;
}

export interface FbMessageThread {
  participants: FbParticipant[];
  messages: FbMessage[];
  title: string;
  is_still_participant: boolean;
  thread_path: string;
  magic_words: unknown[];
}

export interface FbMediaMetadata {
  photo_metadata?: {
    exif_data: Array<{
      upload_ip?: string;
      taken_timestamp?: number;
    }>;
  };
}

export interface FbMedia {
  uri: string;
  creation_timestamp: number;
  media_metadata?: FbMediaMetadata;
  title?: string;
  description?: string;
}

export interface FbPlace {
  name: string;
  coordinate?: { latitude: number; longitude: number };
  address?: string;
  url?: string;
}

export interface FbPost {
  timestamp: number;
  attachments?: Array<{
    data: Array<{
      media?: FbMedia;
      place?: FbPlace;
    }>;
  }>;
  data: Array<{
    post?: string;
  }>;
  title: string;
}

export interface FbReaction {
  timestamp: number;
  data: Array<{
    reaction: {
      reaction: string; // "LIKE" | "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY" | "NONE"
      actor: string;
    };
  }>;
  title: string;
}

export interface FbComment {
  timestamp: number;
  data: Array<{
    comment: {
      timestamp: number;
      comment: string;
      author: string;
    };
  }>;
  title: string;
}

export interface FbFollower {
  name: string;
}

export interface FbFollowersFile {
  followers_v3?: FbFollower[];
  followers_v2?: FbFollower[];
}

export interface FbFundraiserLabelValue {
  label: string;
  value?: string;
  timestamp_value?: number;
  vec?: unknown[];
  dict?: unknown[];
}

export interface FbFundraiser {
  media: unknown[];
  label_values: FbFundraiserLabelValue[];
  fbid: string;
}

export interface FbCommentsFile {
  comments_v2: FbComment[];
}

// ── Normalized Output Shapes ────────────────────────────────────────────────

export interface NormalizedFollower {
  name: string;
  normalizedName: string; // lowercase trimmed for dedup
}

export interface NormalizedReaction {
  timestamp: number;
  reactionType: string;
  targetName: string; // person whose content was reacted to
  title: string; // original title for context
}

export interface NormalizedComment {
  timestamp: number;
  targetName: string; // person the page replied to
  commentText: string; // the page's reply
  title: string;
}

export interface NormalizedPost {
  timestamp: number;
  text: string;
  title: string;
  mediaUris: string[]; // relative paths to media files
  place?: FbPlace;
}

export interface NormalizedMessage {
  senderName: string;
  timestampMs: number;
  content?: string;
  photoUris?: string[];
}

export interface NormalizedThread {
  threadPath: string;
  participants: string[]; // non-page participant names
  messages: NormalizedMessage[];
  isInbox: boolean; // true = inbox, false = filtered
  messageCount: number;
  dateRange: { first: number; last: number }; // timestamp_ms
}

export interface NormalizedFundraiser {
  fbid: string;
  amountRaised: number; // raw value from export
  creationTimestamp: number;
}

export interface NormalizedManifest {
  generatedAt: string;
  sourceChunks: string[];
  counts: {
    followers: { raw: number; deduped: number };
    reactions: { raw: number; deduped: number };
    comments: { raw: number; deduped: number };
    posts: { raw: number; deduped: number };
    messengerThreads: { raw: number; deduped: number; uniqueParticipants: number };
    fundraisers: { raw: number; deduped: number; withAmountRaised: number };
  };
}
