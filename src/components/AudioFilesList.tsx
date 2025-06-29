import React, { useState, useEffect } from 'react';
import { audioFileService, AudioFile } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Play, Download, Eye, Clock, User, MessageSquare, RefreshCw, Trash2, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface AudioFilesListProps {
  userName?: string;
  limit?: number;
  showStats?: boolean;
}

export const AudioFilesList: React.FC<AudioFilesListProps> = ({ 
  userName, 
  limit = 20,
  showStats = true
}) => {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStatsPanel, setShowStatsPanel] = useState(false);

  const fetchAudioFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      let files;
      
      if (userName) {
        files = await audioFileService.getByUser(userName);
        
        // Fetch user stats if enabled
        if (showStats) {
          const userStats = await audioFileService.getUserStats(userName);
          setStats(userStats);
        }
      } else {
        files = await audioFileService.getRecent(limit);
      }
      
      setAudioFiles(files);
    } catch (err) {
      console.error('Error fetching audio files:', err);
      setError('Failed to load audio files');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this audio file record?')) {
      return;
    }

    try {
      await audioFileService.delete(id);
      setAudioFiles(prev => prev.filter(file => file.id !== id));
      
      // Refresh stats if showing them
      if (showStats && userName) {
        const userStats = await audioFileService.getUserStats(userName);
        setStats(userStats);
      }
    } catch (err) {
      console.error('Error deleting audio file:', err);
      setError('Failed to delete audio file');
    }
  };
  useEffect(() => {
    fetchAudioFiles();
  }, [userName, limit]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getStatusColor = (status: AudioFile['status']) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTypeIcon = (type: AudioFile['audio_type']) => {
    switch (type) {
      case 'tavus_video': return '🎬';
      case 'tts': return '🔊';
      case 'ai_text_generation': return '🤖';
      default: return '🎵';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-400">Loading audio files...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
        <div className="flex items-center justify-between">
          <p className="text-red-300">{error}</p>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchAudioFiles}
            className="h-8 w-8"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (audioFiles.length === 0) {
    return (
      <div className="text-center p-8 text-gray-400">
        <MessageSquare className="size-12 mx-auto mb-4 opacity-50" />
        <p>No audio files found</p>
        <p className="text-sm mt-2">Start a conversation to generate audio files!</p>
        <Button
          variant="outline"
          onClick={fetchAudioFiles}
          className="mt-4"
        >
          <RefreshCw className="size-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Audio Files {userName && `for ${userName}`}
        </h3>
        <div className="flex items-center gap-2">
          {showStats && stats && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowStatsPanel(!showStatsPanel)}
              className="h-8 w-8"
              title="Show Statistics"
            >
              <BarChart3 className="size-4" />
            </Button>
          )}
          <span className="text-sm text-gray-400">
            {audioFiles.length} file{audioFiles.length !== 1 ? 's' : ''}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchAudioFiles}
            className="h-8 w-8"
            title="Refresh"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Statistics Panel */}
      {showStatsPanel && stats && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-800/30 border border-gray-700 rounded-lg p-4"
        >
          <h4 className="text-white font-medium mb-3">📊 Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{stats.total}</div>
              <div className="text-gray-400">Total Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.byStatus?.completed || 0}</div>
              <div className="text-gray-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.byStatus?.pending || 0}</div>
              <div className="text-gray-400">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{Math.floor(stats.totalDuration / 60)}m</div>
              <div className="text-gray-400">Total Duration</div>
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="bg-gray-700/50 px-3 py-1 rounded-full text-xs">
                {getTypeIcon(type as AudioFile['audio_type'])} {type.replace(/_/g, ' ')}: {count as number}
              </div>
            ))}
          </div>
        </motion.div>
      )}
      <div className="space-y-3">
        {audioFiles.map((file, index) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 hover:bg-gray-800/70 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{getTypeIcon(file.audio_type)}</span>
                  <span className="text-sm font-medium text-gray-300 capitalize">
                    {file.audio_type.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full bg-gray-700 ${getStatusColor(file.status)}`}>
                    {file.status}
                  </span>
                </div>

                <p className="text-white text-sm mb-2 line-clamp-2">
                  {file.message_text}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  {file.user_name && (
                    <div className="flex items-center gap-1">
                      <User className="size-3" />
                      {file.user_name}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {new Date(file.created_at).toLocaleDateString()} {new Date(file.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {file.duration_seconds && (
                    <div className="flex items-center gap-1">
                      <Play className="size-3" />
                      {formatDuration(file.duration_seconds)}
                    </div>
                  )}

                  {file.file_size_bytes && (
                    <span>{formatFileSize(file.file_size_bytes)}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                {file.audio_url && file.status === 'completed' && file.audio_type !== 'ai_text_generation' && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(file.audio_url, '_blank')}
                      className="h-8 w-8"
                      title="View/Play"
                    >
                      <Eye className="size-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = file.audio_url!;
                        link.download = `audio-${file.id}.mp4`;
                        link.click();
                      }}
                      className="h-8 w-8"
                      title="Download"
                    >
                      <Download className="size-4" />
                    </Button>
                  </>
                )}
                
                {file.audio_type === 'ai_text_generation' && file.status === 'completed' && (
                  <div className="text-xs text-green-400 px-2 py-1 bg-green-900/20 rounded">
                    ✓ Generated
                  </div>
                )}
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(file.id)}
                  className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  title="Delete Record"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            {file.video_id && (
              <div className="mt-2 text-xs text-gray-500 font-mono">
                Video ID: {file.video_id}
              </div>
            )}

            {file.metadata && Object.keys(file.metadata).length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                <details className="cursor-pointer">
                  <summary className="hover:text-gray-400">Metadata</summary>
                  <pre className="mt-1 text-xs bg-gray-900/50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(file.metadata, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};