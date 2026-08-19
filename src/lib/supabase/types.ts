export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          actor_user_id: string | null;
          clinic_id: string | null;
          created_at: string;
          id: string;
          metadata: Json;
          target_id: string | null;
          target_table: string | null;
        };
        Insert: {
          action: string;
          actor_user_id?: string | null;
          clinic_id?: string | null;
          created_at?: string;
          id?: string;
          metadata?: Json;
          target_id?: string | null;
          target_table?: string | null;
        };
        Update: {
          action?: string;
          actor_user_id?: string | null;
          clinic_id?: string | null;
          created_at?: string;
          id?: string;
          metadata?: Json;
          target_id?: string | null;
          target_table?: string | null;
        };
        Relationships: [];
      };
      clinic_members: {
        Row: {
          clinic_id: string;
          created_at: string;
          id: string;
          invited_by: string | null;
          invited_email: string | null;
          role: Database["public"]["Enums"]["clinic_role"];
          status: Database["public"]["Enums"]["clinic_member_status"];
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          clinic_id: string;
          created_at?: string;
          id?: string;
          invited_by?: string | null;
          invited_email?: string | null;
          role?: Database["public"]["Enums"]["clinic_role"];
          status?: Database["public"]["Enums"]["clinic_member_status"];
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          clinic_id?: string;
          created_at?: string;
          id?: string;
          invited_by?: string | null;
          invited_email?: string | null;
          role?: Database["public"]["Enums"]["clinic_role"];
          status?: Database["public"]["Enums"]["clinic_member_status"];
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      clinics: {
        Row: {
          address: string | null;
          created_at: string;
          created_by: string | null;
          email: string | null;
          id: string;
          legal_name: string | null;
          name: string;
          phone: string | null;
          slug: string;
          status: Database["public"]["Enums"]["clinic_status"];
          timezone: string;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          id?: string;
          legal_name?: string | null;
          name: string;
          phone?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["clinic_status"];
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          id?: string;
          legal_name?: string | null;
          name?: string;
          phone?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["clinic_status"];
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      patients: {
        Row: {
          birth_date: string | null;
          clinic_id: string;
          communications_consent: boolean;
          contact_preference: Database["public"]["Enums"]["contact_preference"];
          created_at: string;
          created_by: string | null;
          email: string | null;
          first_name: string;
          id: string;
          identity_document: string | null;
          internal_notes: string | null;
          last_name: string;
          phone: string | null;
          registered_at: string;
          status: Database["public"]["Enums"]["core_record_status"];
          tags: string[];
          updated_at: string;
        };
        Insert: {
          birth_date?: string | null;
          clinic_id: string;
          communications_consent?: boolean;
          contact_preference?: Database["public"]["Enums"]["contact_preference"];
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          first_name: string;
          id?: string;
          identity_document?: string | null;
          internal_notes?: string | null;
          last_name: string;
          phone?: string | null;
          registered_at?: string;
          status?: Database["public"]["Enums"]["core_record_status"];
          tags?: string[];
          updated_at?: string;
        };
        Update: {
          birth_date?: string | null;
          clinic_id?: string;
          communications_consent?: boolean;
          contact_preference?: Database["public"]["Enums"]["contact_preference"];
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          first_name?: string;
          id?: string;
          identity_document?: string | null;
          internal_notes?: string | null;
          last_name?: string;
          phone?: string | null;
          registered_at?: string;
          status?: Database["public"]["Enums"]["core_record_status"];
          tags?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      professional_services: {
        Row: {
          clinic_id: string;
          created_at: string;
          is_active: boolean;
          professional_id: string;
          service_id: string;
          updated_at: string;
        };
        Insert: {
          clinic_id: string;
          created_at?: string;
          is_active?: boolean;
          professional_id: string;
          service_id: string;
          updated_at?: string;
        };
        Update: {
          clinic_id?: string;
          created_at?: string;
          is_active?: boolean;
          professional_id?: string;
          service_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      professionals: {
        Row: {
          calendar_color: string;
          clinic_id: string;
          created_at: string;
          created_by: string | null;
          email: string | null;
          full_name: string;
          id: string;
          phone: string | null;
          specialty: string | null;
          status: Database["public"]["Enums"]["core_record_status"];
          updated_at: string;
        };
        Insert: {
          calendar_color?: string;
          clinic_id: string;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          full_name: string;
          id?: string;
          phone?: string | null;
          specialty?: string | null;
          status?: Database["public"]["Enums"]["core_record_status"];
          updated_at?: string;
        };
        Update: {
          calendar_color?: string;
          clinic_id?: string;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          full_name?: string;
          id?: string;
          phone?: string | null;
          specialty?: string | null;
          status?: Database["public"]["Enums"]["core_record_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          platform_role: Database["public"]["Enums"]["platform_role"] | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          platform_role?: Database["public"]["Enums"]["platform_role"] | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          platform_role?: Database["public"]["Enums"]["platform_role"] | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      resources: {
        Row: {
          clinic_id: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          status: Database["public"]["Enums"]["core_record_status"];
          type: Database["public"]["Enums"]["resource_type"];
          updated_at: string;
        };
        Insert: {
          clinic_id: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          status?: Database["public"]["Enums"]["core_record_status"];
          type?: Database["public"]["Enums"]["resource_type"];
          updated_at?: string;
        };
        Update: {
          clinic_id?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          status?: Database["public"]["Enums"]["core_record_status"];
          type?: Database["public"]["Enums"]["resource_type"];
          updated_at?: string;
        };
        Relationships: [];
      };
      schedule_exceptions: {
        Row: {
          clinic_id: string;
          created_at: string;
          created_by: string | null;
          ends_at: string;
          id: string;
          professional_id: string | null;
          reason: string | null;
          starts_at: string;
          type: Database["public"]["Enums"]["schedule_exception_type"];
          updated_at: string;
        };
        Insert: {
          clinic_id: string;
          created_at?: string;
          created_by?: string | null;
          ends_at: string;
          id?: string;
          professional_id?: string | null;
          reason?: string | null;
          starts_at: string;
          type?: Database["public"]["Enums"]["schedule_exception_type"];
          updated_at?: string;
        };
        Update: {
          clinic_id?: string;
          created_at?: string;
          created_by?: string | null;
          ends_at?: string;
          id?: string;
          professional_id?: string | null;
          reason?: string | null;
          starts_at?: string;
          type?: Database["public"]["Enums"]["schedule_exception_type"];
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          category: string | null;
          clinic_id: string;
          color: string | null;
          created_at: string;
          created_by: string | null;
          currency: string;
          description: string | null;
          duration_minutes: number;
          icon: string | null;
          id: string;
          name: string;
          preparation_minutes: number;
          price_cents: number;
          recovery_minutes: number;
          status: Database["public"]["Enums"]["core_record_status"];
          updated_at: string;
        };
        Insert: {
          category?: string | null;
          clinic_id: string;
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          description?: string | null;
          duration_minutes: number;
          icon?: string | null;
          id?: string;
          name: string;
          preparation_minutes?: number;
          price_cents?: number;
          recovery_minutes?: number;
          status?: Database["public"]["Enums"]["core_record_status"];
          updated_at?: string;
        };
        Update: {
          category?: string | null;
          clinic_id?: string;
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          description?: string | null;
          duration_minutes?: number;
          icon?: string | null;
          id?: string;
          name?: string;
          preparation_minutes?: number;
          price_cents?: number;
          recovery_minutes?: number;
          status?: Database["public"]["Enums"]["core_record_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      working_hours: {
        Row: {
          clinic_id: string;
          created_at: string;
          created_by: string | null;
          ends_at: string;
          id: string;
          is_active: boolean;
          professional_id: string;
          starts_at: string;
          updated_at: string;
          weekday: number;
        };
        Insert: {
          clinic_id: string;
          created_at?: string;
          created_by?: string | null;
          ends_at: string;
          id?: string;
          is_active?: boolean;
          professional_id: string;
          starts_at: string;
          updated_at?: string;
          weekday: number;
        };
        Update: {
          clinic_id?: string;
          created_at?: string;
          created_by?: string | null;
          ends_at?: string;
          id?: string;
          is_active?: boolean;
          professional_id?: string;
          starts_at?: string;
          updated_at?: string;
          weekday?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_has_clinic_role: {
        Args: {
          allowed_roles?: Database["public"]["Enums"]["clinic_role"][] | null;
          target_clinic_id: string;
        };
        Returns: boolean;
      };
      current_user_is_superadmin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      current_user_shares_clinic: {
        Args: {
          target_user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      clinic_member_status: "active" | "invited" | "suspended";
      clinic_role: "clinic_admin" | "reception" | "professional" | "readonly";
      clinic_status: "active" | "inactive" | "trialing" | "suspended";
      contact_preference: "email" | "phone" | "sms" | "whatsapp" | "none";
      core_record_status: "active" | "inactive";
      platform_role: "superadmin";
      resource_type: "room" | "booth" | "equipment" | "chair" | "machine" | "other";
      schedule_exception_type: "available" | "unavailable" | "vacation" | "manual_block";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<TableName extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][TableName]["Row"];

export type TablesInsert<TableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TableName]["Insert"];

export type TablesUpdate<TableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TableName]["Update"];

export type Enums<EnumName extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][EnumName];
