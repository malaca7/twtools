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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      baus: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          icone: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          icone?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          icone?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          period_end: string
          period_start: string
          target_value: number
          type: Database["public"]["Enums"]["goal_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          period_end: string
          period_start: string
          target_value: number
          type: Database["public"]["Enums"]["goal_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          period_end?: string
          period_start?: string
          target_value?: number
          type?: Database["public"]["Enums"]["goal_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          ativo: boolean
          bau_id: string | null
          categoria_id: string | null
          created_at: string
          descricao: string | null
          estoque_atual: number
          estoque_minimo: number
          id: string
          imagem_url: string | null
          nome: string
          preco_sugerido: number
          unidade: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bau_id?: string | null
          categoria_id?: string | null
          created_at?: string
          descricao?: string | null
          estoque_atual?: number
          estoque_minimo?: number
          id?: string
          imagem_url?: string | null
          nome: string
          preco_sugerido?: number
          unidade?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bau_id?: string | null
          categoria_id?: string | null
          created_at?: string
          descricao?: string | null
          estoque_atual?: number
          estoque_minimo?: number
          id?: string
          imagem_url?: string | null
          nome?: string
          preco_sugerido?: number
          unidade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          data_entrada: string
          discord_avatar_url: string | null
          discord_email: string | null
          discord_id: string | null
          discord_username: string | null
          id: string
          nickname: string | null
          nome: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          data_entrada?: string
          discord_avatar_url?: string | null
          discord_email?: string | null
          discord_id?: string | null
          discord_username?: string | null
          id?: string
          nickname?: string | null
          nome: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          data_entrada?: string
          discord_avatar_url?: string | null
          discord_email?: string | null
          discord_id?: string | null
          discord_username?: string | null
          id?: string
          nickname?: string | null
          nome?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          level: string
          nivel: string | null
          permissions: Json
          updated_at: string
        }
        Insert: {
          level: string
          nivel?: string | null
          permissions?: Json
          updated_at?: string
        }
        Update: {
          level?: string
          nivel?: string | null
          permissions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      signup_requests: {
        Row: {
          created_at: string
          id: string
          nome: string
          nickname: string | null
          requested_at: string
          review_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["signup_request_status"]
          telefone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          nickname?: string | null
          requested_at?: string
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["signup_request_status"]
          telefone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          nickname?: string | null
          requested_at?: string
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["signup_request_status"]
          telefone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          buyer_name: string
          created_at: string
          id: string
          notes: string | null
          payment_method: string
          product_id: string
          quantity: number
          seller_id: string
          status: Database["public"]["Enums"]["sale_status"]
          total_price: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          buyer_name: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string
          product_id: string
          quantity: number
          seller_id: string
          status?: Database["public"]["Enums"]["sale_status"]
          total_price: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          buyer_name?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string
          product_id?: string
          quantity?: number
          seller_id?: string
          status?: Database["public"]["Enums"]["sale_status"]
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          bau_id: string | null
          created_at: string
          id: string
          previous_balance: number
          product_id: string
          quantity: number
          reason: string | null
          resulting_balance: number
          reversal_of: string | null
          sale_id: string | null
          type: Database["public"]["Enums"]["movement_type"]
          user_id: string
        }
        Insert: {
          bau_id?: string | null
          created_at?: string
          id?: string
          previous_balance: number
          product_id: string
          quantity: number
          reason?: string | null
          resulting_balance: number
          reversal_of?: string | null
          sale_id?: string | null
          type: Database["public"]["Enums"]["movement_type"]
          user_id: string
        }
        Update: {
          bau_id?: string | null
          created_at?: string
          id?: string
          previous_balance?: number
          product_id?: string
          quantity?: number
          reason?: string | null
          resulting_balance?: number
          reversal_of?: string | null
          sale_id?: string | null
          type?: Database["public"]["Enums"]["movement_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_movement_sale"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_reversal_of_fkey"
            columns: ["reversal_of"]
            isOneToOne: false
            referencedRelation: "stock_movements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          last_seen: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          last_seen?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          last_seen?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          nivel: Database["public"]["Enums"]["app_level"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nivel?: Database["public"]["Enums"]["app_level"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nivel?: Database["public"]["Enums"]["app_level"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_operate: { Args: { _user_id: string }; Returns: boolean }
      create_sale: {
        Args: {
          _buyer_name: string
          _notes?: string
          _payment_method?: string
          _product_id: string
          _quantity: number
          _unit_price: number
        }
        Returns: string
      }
      ensure_membership: {
        Args: { _nickname?: string; _nome: string }
        Returns: undefined
      }
      get_signup_request_status: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["signup_request_status"]
      }
      get_level: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_level"]
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_manager: { Args: { _user_id: string }; Returns: boolean }
      list_pending_signup_requests: {
        Args: Record<PropertyKey, never>
        Returns: {
          email: string | null
          id: string
          nome: string
          nickname: string | null
          requested_at: string
          status: Database["public"]["Enums"]["signup_request_status"]
          telefone: string
          user_id: string
        }[]
      }
      list_login_players: {
        Args: Record<PropertyKey, never>
        Returns: {
          login_email: string
          nickname: string | null
          nome: string
          user_id: string
        }[]
      }
      register_movement: {
        Args: {
          _product_id: string
          _quantity: number
          _reason?: string
          _reversal_of?: string
          _sale_id?: string
          _type: Database["public"]["Enums"]["movement_type"]
        }
        Returns: string
      }
      reverse_movement: {
        Args: { _movement_id: string; _reason?: string }
        Returns: string
      }
      reverse_sale: {
        Args: { _reason?: string; _sale_id: string }
        Returns: undefined
      }
      save_role_permissions: {
        Args: { _level: string; _permissions: Json }
        Returns: undefined
      }
      review_signup_request: {
        Args: {
          _approve: boolean
          _nivel?: Database["public"]["Enums"]["app_level"]
          _reason?: string
          _request_id: string
        }
        Returns: undefined
      }
      set_member_level: {
        Args: {
          _nivel: Database["public"]["Enums"]["app_level"]
          _target_user: string
        }
        Returns: undefined
      }
      submit_signup_request: {
        Args: { _nickname?: string; _nome: string; _telefone: string }
        Returns: Database["public"]["Enums"]["signup_request_status"]
      }
      sync_discord_user_rpc: {
        Args: {
          _discord_avatar_url: string
          _discord_email: string
          _discord_id: string
          _discord_name: string
          _discord_username: string
        }
        Returns: undefined
      }
      verify_player_password: {
        Args: { _senha: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_level: "desenvolvedor" | "01" | "02" | "gerente" | "motoqueiro" | "membro" | "novato"
      goal_type: "vendas" | "faturamento" | "quantidade"
      movement_type: "entrada" | "saida"
      sale_status: "concluida" | "estornada"
      signup_request_status: "pendente" | "aprovado" | "rejeitado"
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
      app_level: ["01", "02", "gerente", "motoqueiro", "membro", "novato"],
      goal_type: ["vendas", "faturamento", "quantidade"],
      movement_type: ["entrada", "saida"],
      sale_status: ["concluida", "estornada"],
      signup_request_status: ["pendente", "aprovado", "rejeitado"],
    },
  },
} as const
