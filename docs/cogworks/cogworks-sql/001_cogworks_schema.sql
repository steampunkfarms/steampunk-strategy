-- ============================================================================
-- THE COGWORKS — Supabase Migration
-- Sanctuary Feed + Campaign Platform
-- Run in Supabase SQL Editor
-- ============================================================================

-- 1. sanctuary_posts — the atomic content unit
CREATE TABLE IF NOT EXISTS sanctuary_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,

  -- Authorship
  author_id UUID REFERENCES auth.users(id),

  -- Content
  title TEXT,
  body JSONB NOT NULL DEFAULT '{}',
  body_plain TEXT DEFAULT '',
  excerpt TEXT,
  slug TEXT UNIQUE,

  -- Classification
  species_group TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',

  -- Media
  media_urls TEXT[] DEFAULT '{}',
  hero_image_url TEXT,
  video_url TEXT,
  video_poster_url TEXT,

  -- Connections
  resident_slugs TEXT[] DEFAULT '{}',
  campaign_slugs TEXT[] DEFAULT '{}',

  -- Display controls
  featured BOOLEAN NOT NULL DEFAULT false,
  pinned BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

  -- AI fields (Phase 3)
  ai_caption TEXT,
  ai_donor_hook TEXT,
  ai_seo_description TEXT,

  -- Metrics (denormalized)
  reaction_count INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  view_count INT NOT NULL DEFAULT 0
);

-- 2. campaigns — maps species groups to donor-facing campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,

  species_group TEXT NOT NULL,

  -- Branding
  hero_image_url TEXT,
  hero_video_url TEXT,
  accent_color TEXT,
  icon_emoji TEXT,

  -- Stripe
  stripe_product_id TEXT,

  -- Donation tiers
  donation_tiers JSONB DEFAULT '[]',

  -- Display
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,

  -- Metrics (denormalized)
  total_raised DECIMAL(12,2) NOT NULL DEFAULT 0,
  subscriber_count INT NOT NULL DEFAULT 0,
  animals_supported INT NOT NULL DEFAULT 0
);

-- 3. campaign_subscribers — donors who gave to a specific campaign
CREATE TABLE IF NOT EXISTS campaign_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  email TEXT NOT NULL,
  stripe_customer_id TEXT,
  donor_name TEXT,

  first_gift_date TIMESTAMPTZ,
  last_gift_date TIMESTAMPTZ,
  total_given DECIMAL(12,2) NOT NULL DEFAULT 0,
  gift_count INT NOT NULL DEFAULT 0,
  is_recurring BOOLEAN NOT NULL DEFAULT false,

  email_digest_opted_in BOOLEAN NOT NULL DEFAULT true,
  public_recognition BOOLEAN NOT NULL DEFAULT false,
  display_name TEXT,

  UNIQUE(campaign_id, email)
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE sanctuary_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_subscribers ENABLE ROW LEVEL SECURITY;

-- Published posts are public
CREATE POLICY "Published posts are public" ON sanctuary_posts
  FOR SELECT USING (status = 'published');

-- Admins can manage all posts
CREATE POLICY "Admins can manage posts" ON sanctuary_posts
  FOR ALL USING (is_admin());

-- Active campaigns are public
CREATE POLICY "Active campaigns are public" ON campaigns
  FOR SELECT USING (active = true);

-- Admins can manage campaigns
CREATE POLICY "Admins can manage campaigns" ON campaigns
  FOR ALL USING (is_admin());

-- Admins can manage subscribers
CREATE POLICY "Admins can manage subscribers" ON campaign_subscribers
  FOR ALL USING (is_admin());

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_posts_species_published ON sanctuary_posts(species_group, published_at DESC)
  WHERE status = 'published';

CREATE INDEX idx_posts_featured ON sanctuary_posts(species_group, featured)
  WHERE status = 'published' AND featured = true;

CREATE INDEX idx_posts_slug ON sanctuary_posts(slug)
  WHERE slug IS NOT NULL;

CREATE INDEX idx_posts_status ON sanctuary_posts(status, created_at DESC);

CREATE INDEX idx_campaign_subscribers_campaign ON campaign_subscribers(campaign_id);
CREATE INDEX idx_campaign_subscribers_email ON campaign_subscribers(email);

-- ============================================================================
-- AUTO-UPDATE updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sanctuary_posts_updated_at
  BEFORE UPDATE ON sanctuary_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
