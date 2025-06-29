import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role key
// This should only be used in server-side operations or secure contexts

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase service role configuration');
}

// Admin client with full database access
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Secure operations that require elevated privileges
export const adminOperations = {
  // Create audio file with admin privileges
  async createAudioFile(data: any) {
    const { data: audioFile, error } = await supabaseAdmin
      .from('audio_files')
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error('Admin: Error creating audio file:', error);
      throw error;
    }

    return audioFile;
  },

  // Update audio file with admin privileges
  async updateAudioFile(id: string, data: any) {
    const { data: audioFile, error } = await supabaseAdmin
      .from('audio_files')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Admin: Error updating audio file:', error);
      throw error;
    }

    return audioFile;
  },

  // Delete audio file with admin privileges
  async deleteAudioFile(id: string) {
    const { error } = await supabaseAdmin
      .from('audio_files')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Admin: Error deleting audio file:', error);
      throw error;
    }

    return true;
  },

  // Get comprehensive analytics
  async getAnalytics() {
    const { data, error } = await supabaseAdmin
      .from('audio_files')
      .select('*');

    if (error) {
      console.error('Admin: Error fetching analytics:', error);
      throw error;
    }

    return {
      totalFiles: data?.length || 0,
      byType: data?.reduce((acc, file) => {
        acc[file.audio_type] = (acc[file.audio_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      byStatus: data?.reduce((acc, file) => {
        acc[file.status] = (acc[file.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      totalDuration: data?.reduce((sum, file) => sum + (file.duration_seconds || 0), 0) || 0
    };
  }
};

console.log('🔐 Supabase Admin client initialized with service role key');