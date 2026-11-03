export type UserRole = 'student' | 'faculty' | 'staff' | 'moderator' | 'admin';
export type UserType = 'student' | 'faculty' | 'staff';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  user_type: UserType;
  avatar_url?: string;
  student_staff_id?: string;
  department?: string;
  campus?: string;
  created_at: string;
  updated_at?: string;
}

export type ItemType = 'lost' | 'found';

export type ItemStatus =
  | 'draft'
  | 'pending_review'
  | 'lost'
  | 'found'
  | 'claim_pending'
  | 'claim_approved'
  | 'claim_rejected'
  | 'handover_pending'
  | 'recovered'
  | 'closed'
  | 'rejected';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string; // Lucide icon name
  color: string;
}

export interface CampusLocation {
  id: string;
  name: string;
  building: string;
  zone_type: 'academic' | 'library' | 'dining' | 'sports' | 'residential' | 'parking' | 'outdoor' | 'other';
  description: string;
}

export interface Item {
  id: string;
  owner_id: string;
  owner_name: string;
  owner_email?: string;
  owner_type: UserType | 'admin';
  type: ItemType;
  title: string;
  description: string;
  category_id: string;
  location_id: string;
  location_detail?: string; // e.g. "Room 304, 3rd floor"
  date_occurred: string; // ISO date string YYYY-MM-DD
  approximate_time?: string; // e.g. "14:30" or "Afternoon"
  distinguishing_features?: string; // Private or general details
  secret_verification_key?: string; // Key details only the real owner knows (for claim verification)
  reward_info?: string;
  image_url: string;
  additional_images?: string[];
  current_holding_location?: string; // e.g. "Campus Security Office Room 102"
  status: ItemStatus;
  is_approved: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export type ClaimStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'cancelled';

export interface Claim {
  id: string;
  item_id: string;
  item_title?: string;
  item_type?: ItemType;
  item_image?: string;
  claimant_id: string;
  claimant_name: string;
  claimant_email: string;
  claimant_phone?: string;
  claimant_id_number?: string;
  verification_details: string; // Detailed description of hidden features
  unique_identifier?: string; // e.g. Serial number, engraved initials, unique scratch
  lost_place_time: string;
  proof_url?: string;
  additional_notes?: string;
  status: ClaimStatus;
  reviewed_by?: string;
  reviewer_name?: string;
  review_notes?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface ItemMatch {
  id: string;
  lost_item_id: string;
  found_item_id: string;
  similarity_score: number; // 0 to 100
  confidence: 'high' | 'medium' | 'low';
  match_reasons: string[];
  status: 'potential' | 'verified' | 'dismissed';
  created_at: string;
  // Hydrated references
  lost_item?: Item;
  found_item?: Item;
}

export type HandoverStatus = 'scheduled' | 'ready_for_pickup' | 'completed' | 'cancelled';

export interface Handover {
  id: string;
  item_id: string;
  item_title: string;
  claim_id: string;
  claimant_id: string;
  claimant_name: string;
  claimant_email: string;
  finder_id: string;
  finder_name: string;
  handover_location: string;
  security_desk_name?: string;
  verification_pin: string; // 4-digit secret PIN for verification on pickup
  scheduled_at?: string;
  completed_at?: string;
  status: HandoverStatus;
  verified_by_admin?: boolean;
  notes?: string;
  created_at: string;
}

export type NotificationType =
  | 'report_approved'
  | 'match_detected'
  | 'claim_submitted'
  | 'claim_approved'
  | 'claim_rejected'
  | 'handover_scheduled'
  | 'handover_completed'
  | 'item_recovered'
  | 'admin_alert';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  related_item_id?: string;
  related_claim_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface SavedItem {
  id: string;
  user_id: string;
  item_id: string;
  created_at: string;
}

export interface ReportAbuse {
  id: string;
  reporter_id: string;
  reporter_name: string;
  item_id: string;
  item_title: string;
  reason: 'inappropriate_content' | 'spam' | 'fraudulent_listing' | 'wrong_information' | 'duplicate' | 'other';
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  reviewed_by?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: UserRole;
  action: string;
  entity_type: 'item' | 'claim' | 'handover' | 'user' | 'category' | 'location' | 'report';
  entity_id: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface FilterOptions {
  searchQuery?: string;
  type?: 'all' | 'lost' | 'found';
  categoryId?: string;
  locationId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  hasReward?: boolean;
  sortBy?: 'recent' | 'oldest' | 'views' | 'title';
}
