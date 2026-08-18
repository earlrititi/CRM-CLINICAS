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
      platform_role: "superadmin";
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
