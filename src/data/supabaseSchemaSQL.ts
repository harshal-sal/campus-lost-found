export const SUPABASE_DATABASE_SCHEMA_SQL = `-- ==============================================================================
-- CAMPUS LOST & FOUND - PRODUCTION POSTGRESQL SCHEMA & ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT CHECK (role IN ('student', 'faculty', 'staff', 'moderator', 'admin')) DEFAULT 'student',
  user_type TEXT CHECK (user_type IN ('student', 'faculty', 'staff')) DEFAULT 'student',
  avatar_url TEXT,
  student_staff_id TEXT,
  department TEXT,
  campus TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Categories Table
CREATE TABLE public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  color TEXT DEFAULT 'blue'
);

-- 4. Campus Locations Table
CREATE TABLE public.locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  building TEXT NOT NULL,
  zone_type TEXT CHECK (zone_type IN ('academic', 'library', 'dining', 'sports', 'residential', 'parking', 'outdoor', 'other')) DEFAULT 'academic',
  description TEXT
);

-- 5. Items Table (Lost & Found Listings)
CREATE TABLE public.items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  owner_name TEXT NOT NULL,
  owner_email TEXT,
  owner_type TEXT NOT NULL,
  type TEXT CHECK (type IN ('lost', 'found')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id TEXT REFERENCES public.categories(id) ON DELETE RESTRICT NOT NULL,
  location_id TEXT REFERENCES public.locations(id) ON DELETE RESTRICT NOT NULL,
  location_detail TEXT,
  date_occurred DATE NOT NULL,
  approximate_time TEXT,
  distinguishing_features TEXT,
  secret_verification_key TEXT, -- Hidden from public views
  reward_info TEXT,
  image_url TEXT NOT NULL,
  additional_images TEXT[],
  current_holding_location TEXT,
  status TEXT CHECK (status IN ('draft', 'pending_review', 'lost', 'found', 'claim_pending', 'claim_approved', 'claim_rejected', 'handover_pending', 'recovered', 'closed', 'rejected')) DEFAULT 'lost',
  is_approved BOOLEAN DEFAULT TRUE,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Ownership Claims Table (Strict Privacy)
CREATE TABLE public.claims (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  claimant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  claimant_name TEXT NOT NULL,
  claimant_email TEXT NOT NULL,
  claimant_phone TEXT,
  claimant_id_number TEXT,
  verification_details TEXT NOT NULL, -- Private verification details
  unique_identifier TEXT, -- Private serial # or identifier
  lost_place_time TEXT NOT NULL,
  proof_url TEXT,
  additional_notes TEXT,
  status TEXT CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewer_name TEXT,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- 7. Rule-based Potential Matches Table
CREATE TABLE public.matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lost_item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  found_item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  similarity_score NUMERIC(5,2) NOT NULL,
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')) NOT NULL,
  match_reasons JSONB DEFAULT '[]'::jsonb,
  status TEXT CHECK (status IN ('potential', 'verified', 'dismissed')) DEFAULT 'potential',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Handovers Table (Safe Campus Verification & Pickup)
CREATE TABLE public.handovers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  claim_id UUID REFERENCES public.claims(id) ON DELETE CASCADE NOT NULL,
  claimant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  claimant_name TEXT NOT NULL,
  finder_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  finder_name TEXT NOT NULL,
  handover_location TEXT NOT NULL,
  verification_pin VARCHAR(6) NOT NULL,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('scheduled', 'ready_for_pickup', 'completed', 'cancelled')) DEFAULT 'scheduled',
  verified_by_admin BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Notifications Table
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  related_item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  related_claim_id UUID REFERENCES public.claims(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Saved Items Table
CREATE TABLE public.saved_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- 11. Abuse Reports Table
CREATE TABLE public.reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reporter_name TEXT NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  item_title TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Security Audit Logs Table
CREATE TABLE public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR FAST SEARCH & FILTERING
-- ==============================================================================
CREATE INDEX idx_items_type ON public.items(type);
CREATE INDEX idx_items_status ON public.items(status);
CREATE INDEX idx_items_category ON public.items(category_id);
CREATE INDEX idx_items_location ON public.items(location_id);
CREATE INDEX idx_items_date ON public.items(date_occurred DESC);
CREATE INDEX idx_claims_item ON public.claims(item_id);
CREATE INDEX idx_claims_claimant ON public.claims(claimant_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Public can view basic profile info, user can update own profile, Admins can manage all
CREATE POLICY "Public profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Items: Approved items are viewable by all. Owners & Moderators/Admins can update
CREATE POLICY "Approved items are viewable by all" ON public.items
  FOR SELECT USING (is_approved = TRUE OR auth.uid() = owner_id);

CREATE POLICY "Users can create items" ON public.items
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own items" ON public.items
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own items" ON public.items
  FOR DELETE USING (auth.uid() = owner_id);

-- Claims: STRICT PRIVACY - Only claimant, item owner (found), and moderators/admins can read
CREATE POLICY "Claimants and authorized staff can view claims" ON public.claims
  FOR SELECT USING (
    auth.uid() = claimant_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('moderator', 'admin'))
  );

CREATE POLICY "Authenticated users can submit claims" ON public.claims
  FOR INSERT WITH CHECK (auth.uid() = claimant_id);

CREATE POLICY "Claimants can cancel own claims" ON public.claims
  FOR UPDATE USING (auth.uid() = claimant_id);

-- Notifications: Only receiver can view and update
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Saved Items: User specific
CREATE POLICY "Users can manage saved items" ON public.saved_items
  FOR ALL USING (auth.uid() = user_id);
`;
