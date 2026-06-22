// Auto-generate this file with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID
// For now this is a minimal placeholder so the client compiles

export type Database = {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
    }
    Functions: {
      raise_out_of_spec_exceptions: {
        Args: { p_submission_id: string }
        Returns: void
      }
      get_submission_summary: {
        Args: { p_from?: string; p_to?: string }
        Returns: {
          submission_date: string
          category: string
          material_type: string
          total_submissions: number
          total_exceptions: number
          unresolved: number
        }[]
      }
    }
  }
}
