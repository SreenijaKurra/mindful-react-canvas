import { createClient } from '@supabase/supabase-js';

// Supabase configuration - Frontend client (anon key)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-neuroheart-project.supabase.co' && 
  supabaseAnonKey !== 'your-neuroheart-anon-key' &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co')
);

// Frontend client with anon key (safe for browser)
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Backend service client (server-side only)
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = (isSupabaseConfigured && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase not configured. Database features will be disabled.');
  console.warn('Current values:', {
    url: supabaseUrl || 'undefined',
    hasAnonKey: !!supabaseAnonKey,
    urlValid: supabaseUrl?.startsWith('https://') && supabaseUrl?.includes('.supabase.co')
  });
  console.warn('To enable Supabase, please:');
  console.warn('1. Create a Supabase project at https://supabase.com');
  console.warn('2. Copy .env.example to .env');
  console.warn('3. Update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY with your project credentials');
  console.warn('4. Restart the development server');
} else {
  console.log('✅ Supabase clients initialized:', {
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    hasServiceKey: !!supabaseServiceKey
  });
}

// Export configuration status
export const isSupabaseAvailable = isSupabaseConfigured;

// Database types
export interface AudioFile {
  id: string;
  user_name?: string;
  message_text: string;
  audio_type: 'tts' | 'tavus_video' | 'ai_text_generation';
  audio_url?: string;
  video_id?: string;
  status: 'pending' | 'completed' | 'failed';
  duration_seconds?: number;
  file_size_bytes?: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Audio file operations
export const audioFileService = {
  // Create a new audio file record
  async create(data: Partial<AudioFile>): Promise<AudioFile> {
    if (!supabase) {
      console.warn('⚠️ Supabase not available - returning mock audio file record');
      // Return a mock record for development
      return {
        id: `mock-${Date.now()}`,
        user_name: data.user_name,
        message_text: data.message_text || '',
        audio_type: data.audio_type || 'ai_text_generation',
        audio_url: data.audio_url,
        video_id: data.video_id,
        status: data.status || 'pending',
        duration_seconds: data.duration_seconds,
        file_size_bytes: data.file_size_bytes,
        metadata: data.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as AudioFile;
    }

    try {
      console.log('Creating audio file record:', data);
    
      const { data: audioFile, error } = await supabase
        .from('audio_files')
        .insert([{
          user_name: data.user_name,
          message_text: data.message_text,
          audio_type: data.audio_type || 'ai_text_generation',
          audio_url: data.audio_url,
          video_id: data.video_id,
          status: data.status || 'pending',
          duration_seconds: data.duration_seconds,
          file_size_bytes: data.file_size_bytes,
          metadata: data.metadata || {}
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating audio file record:', error);
        // Return mock record instead of throwing error
        console.warn('⚠️ Falling back to mock record due to database error');
        return {
          id: `mock-${Date.now()}`,
          user_name: data.user_name,
          message_text: data.message_text || '',
          audio_type: data.audio_type || 'ai_text_generation',
          audio_url: data.audio_url,
          video_id: data.video_id,
          status: data.status || 'pending',
          duration_seconds: data.duration_seconds,
          file_size_bytes: data.file_size_bytes,
          metadata: data.metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as AudioFile;
      }

      console.log('Successfully created audio file record:', audioFile);
      return audioFile;
    } catch (networkError) {
      console.error('Network error creating audio file record:', networkError);
      console.warn('⚠️ Falling back to mock record due to network error');
      // Return mock record for network errors
      return {
        id: `mock-${Date.now()}`,
        user_name: data.user_name,
        message_text: data.message_text || '',
        audio_type: data.audio_type || 'ai_text_generation',
        audio_url: data.audio_url,
        video_id: data.video_id,
        status: data.status || 'pending',
        duration_seconds: data.duration_seconds,
        file_size_bytes: data.file_size_bytes,
        metadata: data.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as AudioFile;
    }
  },

  // Update an existing audio file record
  async update(id: string, data: Partial<AudioFile>): Promise<AudioFile> {
    if (!supabase) {
      console.warn('⚠️ Supabase not available - returning mock updated record');
      // Return a mock updated record
      return {
        id,
        ...data,
        updated_at: new Date().toISOString()
      } as AudioFile;
    }

    try {
      console.log('Updating audio file record:', id, data);
    
      const { data: audioFile, error } = await supabase
        .from('audio_files')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating audio file record:', error);
        // Return mock updated record instead of throwing
        console.warn('⚠️ Falling back to mock record due to database error');
        return {
          id,
          ...data,
          updated_at: new Date().toISOString()
        } as AudioFile;
      }

      console.log('Successfully updated audio file record:', audioFile);
      return audioFile;
    } catch (networkError) {
      console.error('Network error updating audio file record:', networkError);
      console.warn('⚠️ Falling back to mock record due to network error');
      return {
        id,
        ...data,
        updated_at: new Date().toISOString()
      } as AudioFile;
    }
  },

  // Get audio file by ID
  async getById(id: string): Promise<AudioFile | null> {
    if (!supabase) {
      console.warn('⚠️ Supabase not available - cannot fetch audio file');
      return null;
    }

    try {
      const { data: audioFile, error } = await supabase
        .from('audio_files')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        console.error('Error fetching audio file:', error);
        return null;
      }

      return audioFile;
    } catch (networkError) {
      console.error('Network error fetching audio file:', networkError);
      return null;
    }
  },

  // Get audio files by user
  async getByUser(userName: string): Promise<AudioFile[]> {
    if (!supabase) {
      console.warn('⚠️ Supabase not available - cannot fetch user audio files');
      return [];
    }

    const { data: audioFiles, error } = await supabase
      .from('audio_files')
      .select('*')
      .eq('user_name', userName)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user audio files:', error);
      throw error;
    }

    return audioFiles || [];
  },

  // Get audio files by user with pagination
  async getByUserPaginated(userName: string, page: number = 1, limit: number = 10): Promise<{ data: AudioFile[], total: number }> {
    if (!supabase) {
      console.warn('⚠️ Supabase not available - cannot fetch paginated user audio files');
      return { data: [], total: 0 };
    }

    const offset = (page - 1) * limit;
    
    // Get total count
    const { count, error: countError } = await supabase
      .from('audio_files')
      .select('*', { count: 'exact', head: true })
      .eq('user_name', userName);

    if (countError) {
      console.error('Error counting user audio files:', countError);
      throw countError;
    }

    // Get paginated data
    const { data: audioFiles, error } = await supabase
      .from('audio_files')
      .select('*')
      .eq('user_name', userName)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching paginated user audio files:', error);
      throw error;
    }

    return {
      data: audioFiles || [],
      total: count || 0
    };
  },

  // Get audio files by video ID
  async getByVideoId(videoId: string): Promise<AudioFile | null> {
    if (!supabase) {
      console.warn('⚠️ Supabase not available - cannot fetch audio file by video ID');
      return null;
    }

    const { data: audioFile, error } = await supabase
      .from('audio_files')
      .select('*')
      .eq('video_id', videoId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching audio file by video ID:', error);
      throw error;
    }

    return audioFile;
  },

  // Get recent audio files
  async getRecent(limit: number = 50): Promise<AudioFile[]> {
    if (!supabase) {
      console.warn('⚠️ Supabase not available - cannot fetch recent audio files');
      return [];
    }

    const { data: audioFiles, error } = await supabase
      .from('audio_files')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent audio files:', error);
      throw error;
    }

    return audioFiles || [];
  },

  // Get audio files by status
  async getByStatus(status: AudioFile['status']): Promise<AudioFile[]> {
    if (!supabase) {
      console.warn('⚠️ Supabase not available - cannot fetch audio files by status');
      return [];
    }

    const { data: audioFiles, error } = await supabase
      .from('audio_files')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audio files by status:', error);
      throw error;
    }

    return audioFiles || [];
  },

  // Get statistics for a user
  async getUserStats(userName: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    totalDuration: number;
  }> {
    if (!supabase) {
      console.warn('⚠️ Supabase not available - cannot fetch user stats');
      return {
        total: 0,
        byType: {},
        byStatus: {},
        totalDuration: 0
      };
    }

    const { data: audioFiles, error } = await supabase
      .from('audio_files')
      .select('audio_type, status, duration_seconds')
      .eq('user_name', userName);

    if (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }

    const stats = {
      total: audioFiles?.length || 0,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      totalDuration: 0
    };

    audioFiles?.forEach(file => {
      // Count by type
      stats.byType[file.audio_type] = (stats.byType[file.audio_type] || 0) + 1;
      
      // Count by status
      stats.byStatus[file.status] = (stats.byStatus[file.status] || 0) + 1;
      
      // Sum duration
      if (file.duration_seconds) {
        stats.totalDuration += file.duration_seconds;
      }
    });

    return stats;
  },

  // Delete an audio file record
  async delete(id: string): Promise<void> {
    if (!supabase) {
      console.warn('⚠️ Supabase not available - skipping audio file record deletion');
      return;
    }

    const { error } = await supabase
      .from('audio_files')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting audio file:', error);
      throw error;
    }

    console.log('Successfully deleted audio file record:', id);
  }
};

// Test connection function
export const testSupabaseConnection = async (): Promise<boolean> => {
  if (!supabase) {
    console.warn('⚠️ Supabase not configured - connection test skipped');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('audio_files')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
};