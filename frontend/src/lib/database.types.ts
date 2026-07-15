export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'client' | 'tech';
          name: string;
          image: string | null;
          specialty: string | null;
          experience_years: number | null;
          description: string | null;
          badge: 'Certificado' | 'Top Rated' | 'Normal';
          verified: boolean;
          rating: number;
          reviews_count: number;
          wallet_balance: number;
          dni_front: string | null;
          dni_back: string | null;
          cert_photo: string | null;
          verification_status: 'Verified' | 'Pending' | 'Rejected';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      service_requests: {
        Row: {
          id: string;
          client_id: string;
          title: string;
          category: string;
          category_key: string;
          description: string;
          budget: string;
          distance: string | null;
          image: string | null;
          status: 'Active' | 'Closed' | 'Draft';
          state_label: 'Active' | 'En Espera' | 'Confirmado' | 'Cerrada' | 'Borrador';
          assigned_tech: string | null;
          proposals_count: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['service_requests']['Row'], 'id' | 'created_at' | 'proposals_count'>;
        Update: Partial<Database['public']['Tables']['service_requests']['Insert']>;
      };
      proposals: {
        Row: {
          id: string;
          request_id: string;
          tech_id: string;
          expert_description: string;
          price: number;
          duration_est: string;
          status: 'Pending' | 'Accepted' | 'Declined';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['proposals']['Row'], 'id' | 'created_at' | 'status'>;
        Update: Partial<Database['public']['Tables']['proposals']['Insert']>;
      };
      conversations: {
        Row: {
          id: string;
          client_id: string;
          tech_id: string;
          request_id: string | null;
          tag: string | null;
          last_message: string | null;
          last_time: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'created_at' | 'last_time'>;
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          sender_role: 'client' | 'tech';
          text: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
      active_services: {
        Row: {
          id: string;
          request_id: string;
          client_id: string;
          tech_id: string;
          conversation_id: string | null;
          title: string;
          category: string;
          price: number;
          status: 'Programado' | 'En proceso' | 'Finalizado' | 'Cancelado';
          service_date: string | null;
          service_time: string | null;
          arrival_time_minutes: number;
          evidence_photo: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['active_services']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['active_services']['Insert']>;
      };
      reviews: {
        Row: {
          id: string;
          service_id: string;
          tech_id: string;
          rater_id: string;
          rating: number;
          comment: string;
          completed_job_photo: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
      wallet_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          description: string;
          type: 'withdraw' | 'income' | 'escrow' | 'topup' | 'commission_fee';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['wallet_transactions']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
      activity_log: {
        Row: {
          id: string;
          user_id: string;
          actor_name: string;
          action: string;
          type: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['activity_log']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
    };
  };
}