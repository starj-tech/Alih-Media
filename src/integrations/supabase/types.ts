export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      berkas: {
        Row: {
          catatan_penolakan: string | null
          created_at: string
          desa: string
          file_foto_bangunan_url: string | null
          file_ktp_url: string | null
          file_sertifikat_url: string | null
          id: string
          jenis_hak: Database["public"]["Enums"]["jenis_hak"]
          kecamatan: string
          link_shareloc: string | null
          nama_pemegang_hak: string
          nama_pemilik_sertifikat: string | null
          no_hak: string
          no_su_tahun: string
          no_telepon: string
          no_wa_pemohon: string | null
          rejected_from_status: string | null
          status: Database["public"]["Enums"]["berkas_status"]
          tanggal_pengajuan: string
          updated_at: string
          user_id: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          catatan_penolakan?: string | null
          created_at?: string
          desa: string
          file_foto_bangunan_url?: string | null
          file_ktp_url?: string | null
          file_sertifikat_url?: string | null
          id?: string
          jenis_hak: Database["public"]["Enums"]["jenis_hak"]
          kecamatan: string
          link_shareloc?: string | null
          nama_pemegang_hak: string
          nama_pemilik_sertifikat?: string | null
          no_hak: string
          no_su_tahun: string
          no_telepon: string
          no_wa_pemohon?: string | null
          rejected_from_status?: string | null
          status?: Database["public"]["Enums"]["berkas_status"]
          tanggal_pengajuan?: string
          updated_at?: string
          user_id: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          catatan_penolakan?: string | null
          created_at?: string
          desa?: string
          file_foto_bangunan_url?: string | null
          file_ktp_url?: string | null
          file_sertifikat_url?: string | null
          id?: string
          jenis_hak?: Database["public"]["Enums"]["jenis_hak"]
          kecamatan?: string
          link_shareloc?: string | null
          nama_pemegang_hak?: string
          nama_pemilik_sertifikat?: string | null
          no_hak?: string
          no_su_tahun?: string
          no_telepon?: string
          no_wa_pemohon?: string | null
          rejected_from_status?: string | null
          status?: Database["public"]["Enums"]["berkas_status"]
          tanggal_pengajuan?: string
          updated_at?: string
          user_id?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: []
      }
      password_reset_otps: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          otp_code: string
          phone: string
          user_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          otp_code: string
          phone: string
          user_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          otp_code?: string
          phone?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nama_instansi: string | null
          name: string
          no_telepon: string
          pengguna: Database["public"]["Enums"]["pengguna_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nama_instansi?: string | null
          name: string
          no_telepon?: string
          pengguna?: Database["public"]["Enums"]["pengguna_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nama_instansi?: string | null
          name?: string
          no_telepon?: string
          pengguna?: Database["public"]["Enums"]["pengguna_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      validation_logs: {
        Row: {
          action: string
          admin_id: string
          berkas_id: string
          created_at: string
          id: string
          ip_address: string | null
        }
        Insert: {
          action: string
          admin_id: string
          berkas_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          berkas_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_today_submission_count: {
        Args: { _user_id: string }
        Returns: number
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "super_admin"
        | "super_user"
        | "admin_arsip"
        | "admin_validasi_su"
        | "admin_validasi_bt"
      berkas_status:
        | "Proses"
        | "Validasi SU & Bidang"
        | "Validasi BT"
        | "Selesai"
        | "Ditolak"
      jenis_hak: "HM" | "HGB" | "HP" | "HGU" | "HMSRS" | "HPL" | "HW"
      pengguna_type:
        | "Perorangan"
        | "Staf PPAT"
        | "Notaris/PPAT"
        | "Bank"
        | "PT/Badan Hukum"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "user",
        "super_admin",
        "super_user",
        "admin_arsip",
        "admin_validasi_su",
        "admin_validasi_bt",
      ],
      berkas_status: [
        "Proses",
        "Validasi SU & Bidang",
        "Validasi BT",
        "Selesai",
        "Ditolak",
      ],
      jenis_hak: ["HM", "HGB", "HP", "HGU", "HMSRS", "HPL", "HW"],
      pengguna_type: [
        "Perorangan",
        "Staf PPAT",
        "Notaris/PPAT",
        "Bank",
        "PT/Badan Hukum",
      ],
    },
  },
} as const
