// Secure backend service for Supabase operations
// This module handles sensitive operations using the service role key

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { AudioFile } from '@/lib/supabase';

// Backend service for secure audio file operations
export const secureAudioService = {
  // Create audio file with enhanced security
  async createSecure(data: Partial<AudioFile>): Promise<AudioFile> {
    console.log('🔐 Creating audio file with admin privileges:', data);
    
    try {
      const audioFile = await supabaseAdmin
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
          metadata: {
            ...data.metadata,
            created_with_service_role: true,
            security_level: 'admin',
            timestamp: new Date().toISOString()
          }
        }])
        .select()
        .single();

      if (audioFile.error) {
        console.error('🚨 Admin create error:', audioFile.error);
        throw audioFile.error;
      }

      console.log('✅ Admin created audio file:', audioFile.data.id);
      return audioFile.data;
    } catch (error) {
      console.error('🚨 Secure create failed:', error);
      throw error;
    }
  },

  // Update with admin privileges
  async updateSecure(id: string, data: Partial<AudioFile>): Promise<AudioFile> {
    console.log('🔐 Updating audio file with admin privileges:', id);
    
    try {
      const audioFile = await supabaseAdmin
        .from('audio_files')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
          metadata: {
            ...data.metadata,
            last_updated_with_service_role: true,
            last_update_timestamp: new Date().toISOString()
          }
        })
        .eq('id', id)
        .select()
        .single();

      if (audioFile.error) {
        console.error('🚨 Admin update error:', audioFile.error);
        throw audioFile.error;
      }

      console.log('✅ Admin updated audio file:', audioFile.data.id);
      return audioFile.data;
    } catch (error) {
      console.error('🚨 Secure update failed:', error);
      throw error;
    }
  },

  // Secure delete operation
  async deleteSecure(id: string): Promise<void> {
    console.log('🔐 Deleting audio file with admin privileges:', id);
    
    try {
      const { error } = await supabaseAdmin
        .from('audio_files')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('🚨 Admin delete error:', error);
        throw error;
      }

      console.log('✅ Admin deleted audio file:', id);
    } catch (error) {
      console.error('🚨 Secure delete failed:', error);
      throw error;
    }
  },

  // Get sensitive analytics data
  async getSecureAnalytics(): Promise<any> {
    console.log('🔐 Fetching analytics with admin privileges');
    
    try {
      const { data, error } = await supabaseAdmin
        .from('audio_files')
        .select('*');

      if (error) {
        console.error('🚨 Admin analytics error:', error);
        throw error;
      }

      const analytics = {
        totalFiles: data?.length || 0,
        byUser: data?.reduce((acc, file) => {
          const user = file.user_name || 'anonymous';
          acc[user] = (acc[user] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {},
        byType: data?.reduce((acc, file) => {
          acc[file.audio_type] = (acc[file.audio_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {},
        byStatus: data?.reduce((acc, file) => {
          acc[file.status] = (acc[file.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {},
        totalDuration: data?.reduce((sum, file) => sum + (file.duration_seconds || 0), 0) || 0,
        totalSize: data?.reduce((sum, file) => sum + (file.file_size_bytes || 0), 0) || 0
      };

      console.log('✅ Admin analytics retrieved:', analytics);
      return analytics;
    } catch (error) {
      console.error('🚨 Secure analytics failed:', error);
      throw error;
    }
  }
};

// Test admin connection
export const testAdminConnection = async (): Promise<boolean> => {
  try {
    console.log('🔐 Testing admin connection...');
    
    const { data, error } = await supabaseAdmin
      .from('audio_files')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('🚨 Admin connection test failed:', error);
      return false;
    }
    
    console.log('✅ Admin connection successful');
    return true;
  } catch (error) {
    console.error('🚨 Admin connection test error:', error);
    return false;
  }
};