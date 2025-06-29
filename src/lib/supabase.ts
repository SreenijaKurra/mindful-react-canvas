import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set with your actual Supabase project credentials.'
  );
}

if (supabaseUrl.includes('your-project-id') || supabaseAnonKey.includes('your-anon-key')) {
  throw new Error(
    'Please replace the placeholder Supabase credentials in your .env file with your actual project URL and anon key from https://app.supabase.com/project/YOUR_PROJECT/settings/api'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
      throw error;
    }

    console.log('Successfully created audio file record:', audioFile);
    return audioFile;
  },

  // Update an existing audio file record
  async update(id: string, data: Partial<AudioFile>): Promise<AudioFile> {
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
      throw error;
    }

    console.log('Successfully updated audio file record:', audioFile);
    return audioFile;
  },

  // Get audio file by ID
  async getById(id: string): Promise<AudioFile | null> {
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
      throw error;
    }

    return audioFile;
  },

  // Get audio files by user
  async getByUser(userName: string): Promise<AudioFile[]> {
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

  // Get audio files by video ID
  async getByVideoId(videoId: string): Promise<AudioFile | null> {
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
  }
};

// Test connection function
export const testSupabaseConnection = async (): Promise<boolean> => {
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