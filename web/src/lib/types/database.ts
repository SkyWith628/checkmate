/**
 * Supabase Database 타입.
 * 현재는 마이그레이션(supabase/migrations/*) 스키마에 맞춰 수기 작성.
 * CLI 연결(access token) 후에는 아래로 재생성하여 동기화 가능:
 *   supabase gen types typescript --project-id xokjeowkibmksxgebdoh --schema public > src/lib/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "admin";
export type UserGrade = "bronze" | "silver" | "gold" | "vip";
export type DiscountType = "amount" | "percent";
export type OrderStatus =
  | "pending"
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";
export type PointReason =
  | "earn_order"
  | "use_order"
  | "review_bonus"
  | "signup_bonus"
  | "admin_adjust"
  | "refund";
export type InquiryStatus = "open" | "answered" | "closed";
export type NotifType =
  | "order_status"
  | "restock"
  | "coupon"
  | "answer"
  | "point"
  | "notice";
export type ReturnType = "return" | "exchange";
export type ReturnStatus = "requested" | "approved" | "rejected" | "completed";

interface DatabaseBase {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          phone: string | null;
          role: UserRole;
          grade: UserGrade;
          points_balance: number;
          is_banned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          phone?: string | null;
          role?: UserRole;
          grade?: UserGrade;
          points_balance?: number;
          is_banned?: boolean;
        };
        Update: Partial<DatabaseBase["public"]["Tables"]["profiles"]["Insert"]>;
      };
      categories: {
        Row: {
          slug: string;
          name: string;
          description: string | null;
          sort_order: number;
        };
        Insert: {
          slug: string;
          name: string;
          description?: string | null;
          sort_order?: number;
        };
        Update: Partial<DatabaseBase["public"]["Tables"]["categories"]["Insert"]>;
      };
      products: {
        Row: {
          id: string;
          name: string;
          category_slug: string | null;
          material: string | null;
          description: string | null;
          price: number;
          sale_price: number | null;
          stock: number;
          images: string[];
          is_sold_out: boolean;
          is_active: boolean;
          allow_engraving: boolean;
          needs_ring_size: boolean;
          gift_wrap: boolean;
          care_guide: string | null;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category_slug?: string | null;
          material?: string | null;
          description?: string | null;
          price: number;
          sale_price?: number | null;
          stock?: number;
          images?: string[];
          is_sold_out?: boolean;
          is_active?: boolean;
          allow_engraving?: boolean;
          needs_ring_size?: boolean;
          gift_wrap?: boolean;
          care_guide?: string | null;
          view_count?: number;
        };
        Update: Partial<DatabaseBase["public"]["Tables"]["products"]["Insert"]>;
      };
      product_options: {
        Row: {
          id: string;
          product_id: string;
          label: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          product_id: string;
          label: string;
          sort_order?: number;
        };
        Update: Partial<
          DatabaseBase["public"]["Tables"]["product_options"]["Insert"]
        >;
      };
      product_option_values: {
        Row: {
          id: string;
          option_id: string;
          name: string;
          price: number | null;
          stock: number | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          option_id: string;
          name: string;
          price?: number | null;
          stock?: number | null;
          sort_order?: number;
        };
        Update: Partial<
          DatabaseBase["public"]["Tables"]["product_option_values"]["Insert"]
        >;
      };
      coupons: {
        Row: {
          code: string;
          label: string;
          discount_type: DiscountType;
          discount_value: number;
          min_order: number;
          is_active: boolean;
          expires_at: string | null;
        };
        Insert: {
          code: string;
          label: string;
          discount_type: DiscountType;
          discount_value: number;
          min_order?: number;
          is_active?: boolean;
          expires_at?: string | null;
        };
        Update: Partial<DatabaseBase["public"]["Tables"]["coupons"]["Insert"]>;
      };
      user_coupons: {
        Row: {
          user_id: string;
          code: string;
          used_at: string | null;
          collected_at: string;
        };
        Insert: {
          user_id: string;
          code: string;
          used_at?: string | null;
          collected_at?: string;
        };
        Update: Partial<DatabaseBase["public"]["Tables"]["user_coupons"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          order_no: string;
          user_id: string;
          status: OrderStatus;
          subtotal: number;
          discount: number;
          total: number;
          coupon_code: string | null;
          pay_method: string;
          recipient: string;
          phone: string;
          address: string;
          memo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_no?: string;
          user_id: string;
          status?: OrderStatus;
          subtotal: number;
          discount?: number;
          total: number;
          coupon_code?: string | null;
          pay_method: string;
          recipient: string;
          phone: string;
          address: string;
          memo?: string | null;
        };
        Update: Partial<DatabaseBase["public"]["Tables"]["orders"]["Insert"]>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_name: string;
          option_label: string | null;
          unit_price: number;
          qty: number;
          customization: Json | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          product_name: string;
          option_label?: string | null;
          unit_price: number;
          qty: number;
          customization?: Json | null;
        };
        Update: Partial<DatabaseBase["public"]["Tables"]["order_items"]["Insert"]>;
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          rating: number;
          content: string | null;
          images: string[];
          is_verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id: string;
          rating: number;
          content?: string | null;
          images?: string[];
        };
        Update: Partial<DatabaseBase["public"]["Tables"]["reviews"]["Insert"]>;
      };
      review_votes: {
        Row: { review_id: string; user_id: string; created_at: string };
        Insert: { review_id: string; user_id: string; created_at?: string };
        Update: Partial<DatabaseBase["public"]["Tables"]["review_votes"]["Insert"]>;
      };
      faqs: {
        Row: {
          id: string;
          question: string;
          answer: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          question: string;
          answer: string;
          sort_order?: number;
        };
        Update: Partial<DatabaseBase["public"]["Tables"]["faqs"]["Insert"]>;
      };
      restock_alerts: {
        Row: { product_id: string; user_id: string; created_at: string };
        Insert: { product_id: string; user_id: string; created_at?: string };
        Update: Partial<
          DatabaseBase["public"]["Tables"]["restock_alerts"]["Insert"]
        >;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotifType;
          title: string;
          body: string | null;
          link: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotifType;
          title: string;
          body?: string | null;
          link?: string | null;
          is_read?: boolean;
        };
        Update: Partial<
          DatabaseBase["public"]["Tables"]["notifications"]["Insert"]
        >;
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string | null;
          recipient: string;
          phone: string;
          zipcode: string;
          address1: string;
          address2: string | null;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label?: string | null;
          recipient: string;
          phone: string;
          zipcode: string;
          address1: string;
          address2?: string | null;
          is_default?: boolean;
        };
        Update: Partial<DatabaseBase["public"]["Tables"]["addresses"]["Insert"]>;
      };
      wishlists: {
        Row: { user_id: string; product_id: string; created_at: string };
        Insert: { user_id: string; product_id: string; created_at?: string };
        Update: Partial<DatabaseBase["public"]["Tables"]["wishlists"]["Insert"]>;
      };
      point_ledger: {
        Row: {
          id: string;
          user_id: string;
          delta: number;
          reason: PointReason;
          order_id: string | null;
          memo: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          delta: number;
          reason: PointReason;
          order_id?: string | null;
          memo?: string | null;
        };
        Update: Partial<DatabaseBase["public"]["Tables"]["point_ledger"]["Insert"]>;
      };
      product_questions: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          content: string;
          is_secret: boolean;
          answer: string | null;
          answered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id: string;
          content: string;
          is_secret?: boolean;
          answer?: string | null;
          answered_at?: string | null;
        };
        Update: Partial<
          DatabaseBase["public"]["Tables"]["product_questions"]["Insert"]
        >;
      };
      inquiries: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          subject: string;
          body: string;
          status: InquiryStatus;
          order_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          subject: string;
          body: string;
          status?: InquiryStatus;
          order_id?: string | null;
        };
        Update: Partial<DatabaseBase["public"]["Tables"]["inquiries"]["Insert"]>;
      };
      inquiry_messages: {
        Row: {
          id: string;
          inquiry_id: string;
          sender_role: UserRole;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          inquiry_id: string;
          sender_role: UserRole;
          body: string;
        };
        Update: Partial<
          DatabaseBase["public"]["Tables"]["inquiry_messages"]["Insert"]
        >;
      };
      shipments: {
        Row: {
          id: string;
          order_id: string;
          carrier: string | null;
          tracking_no: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          carrier?: string | null;
          tracking_no?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
        };
        Update: Partial<DatabaseBase["public"]["Tables"]["shipments"]["Insert"]>;
      };
      order_returns: {
        Row: {
          id: string;
          order_id: string;
          user_id: string;
          type: ReturnType;
          reason: string;
          status: ReturnStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          user_id: string;
          type: ReturnType;
          reason: string;
          status?: ReturnStatus;
        };
        Update: Partial<
          DatabaseBase["public"]["Tables"]["order_returns"]["Insert"]
        >;
      };
      promotions: {
        Row: {
          id: string;
          title: string;
          image_url: string | null;
          link: string | null;
          starts_at: string | null;
          ends_at: string | null;
          is_active: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          title: string;
          image_url?: string | null;
          link?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: Partial<DatabaseBase["public"]["Tables"]["promotions"]["Insert"]>;
      };
      site_settings: {
        Row: { key: string; value: Json; updated_at: string };
        Insert: { key: string; value: Json };
        Update: Partial<DatabaseBase["public"]["Tables"]["site_settings"]["Insert"]>;
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      place_order: {
        Args: {
          p_items: Json;
          p_coupon_code?: string | null;
          p_recipient?: string;
          p_phone?: string;
          p_address?: string;
          p_memo?: string | null;
          p_pay_method?: string;
        };
        Returns: string; // order id (uuid)
      };
    };
    Enums: {
      user_role: UserRole;
      user_grade: UserGrade;
      discount_type: DiscountType;
      order_status: OrderStatus;
      point_reason: PointReason;
      inquiry_status: InquiryStatus;
      notif_type: NotifType;
      return_type: ReturnType;
      return_status: ReturnStatus;
    };
  };
}

/**
 * supabase-js(postgrest)는 각 테이블에 `Relationships` 필드를 요구한다.
 * 수기 타입에 일일이 넣지 않고 매핑으로 자동 부착한다.
 */
type AddRelationships<T> = {
  [K in keyof T]: T[K] & { Relationships: [] };
};

export type Database = {
  public: {
    Tables: AddRelationships<DatabaseBase["public"]["Tables"]>;
    Views: { [_ in never]: never };
    Functions: DatabaseBase["public"]["Functions"];
    Enums: DatabaseBase["public"]["Enums"];
    CompositeTypes: { [_ in never]: never };
  };
};

/** 편의 헬퍼 타입 */
export type Tables<T extends keyof DatabaseBase["public"]["Tables"]> =
  DatabaseBase["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof DatabaseBase["public"]["Tables"]> =
  DatabaseBase["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof DatabaseBase["public"]["Tables"]> =
  DatabaseBase["public"]["Tables"][T]["Update"];
