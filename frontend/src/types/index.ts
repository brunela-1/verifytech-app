export type UserRole = 'client' | 'tech' | 'admin';

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

export interface TechProfileData {
  user_id: string;
  full_name: string;
  specialty?: string;
  experience_years?: number;
  description?: string;
  photo_url?: string;
  dni_front_url?: string;
  dni_back_url?: string;
  cert_url?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  rating_avg: number;
  reviews_count: number;
  created_at?: string;
}

export interface ServiceRequestData {
  id: string;
  client_id: string;
  title: string;
  category: string;
  description?: string;
  address?: string;
  status: 'open' | 'closed' | 'cancelled';
  created_at?: string;
  images: { id: string; image_url: string }[];
  proposals_count: number;
}

export interface ProposalData {
  id: string;
  request_id: string;
  tech_id: string;
  price: number;
  estimated_time?: string;
  observations?: string;
  status: 'sent' | 'accepted' | 'rejected';
  created_at?: string;
}

export interface AvailabilityBlockData {
  id: string;
  tech_id: string;
  day_label: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'booked';
  created_at?: string;
}

export interface ServiceData {
  id: string;
  proposal_id: string;
  request_id: string;
  tech_id: string;
  client_id: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_block_id?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  created_at?: string;
  review?: ReviewData;
}

export interface ReviewData {
  id: string;
  service_id: string;
  client_id: string;
  tech_id: string;
  rating: number;
  comment?: string;
  created_at?: string;
}

export const CATEGORIES = [
  { key: 'plomeria', label: 'Plomería / Gasfitería', icon: 'plumbing' },
  { key: 'electricidad', label: 'Electricidad', icon: 'electrical_services' },
  { key: 'aire_acondicionado', label: 'Aire Acondicionado', icon: 'ac_unit' },
  { key: 'gas', label: 'Gas', icon: 'local_fire_department' },
  { key: 'electrodomesticos', label: 'Electrodomésticos', icon: 'kitchen' },
  { key: 'pintura', label: 'Pintura', icon: 'format_paint' },
  { key: 'carpinteria', label: 'Carpintería', icon: 'handyman' },
  { key: 'cerrajeria', label: 'Cerrajería', icon: 'lock' },
  { key: 'jardineria', label: 'Jardinería', icon: 'yard' },
  { key: 'limpieza', label: 'Limpieza', icon: 'cleaning_services' },
];
