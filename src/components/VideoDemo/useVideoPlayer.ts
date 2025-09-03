/**
 * USE VIDEO PLAYER HOOK
 * Custom React hook for video player state management
 * Handles play/pause, progress, volume, and fullscreen functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { UseVideoPlayerProps, UseVideoPlayerReturn, VideoPlayerState, VideoPlayerActions } from './types';

export const useVideoPlayer = ({ 
  videoRef, 
  updateInterval = 100 
}: UseVideoPlayerProps): UseVideoPlayerReturn => {
  // Initial state
  const [state, setState] = useState<VideoPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    isFullscreen: false,
    isLoading: true,
    error: null
  });

  const updateIntervalRef = useRef<NodeJS.Timeout>();
  const isSupported = typeof window !== 'undefined' && 'HTMLVideoElement' in window;

  // Update video state periodically when playing
  const updateState = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setState(prevState => ({
      ...prevState,
      currentTime: video.currentTime,
      duration: video.duration || 0,
      volume: video.volume,
      muted: video.muted,
      isPlaying: !video.paused,
      isLoading: video.readyState < 2,
      isFullscreen: document.fullscreenElement === video
    }));
  }, [videoRef]);

  // Start/stop update interval based on playing state
  useEffect(() => {
    if (state.isPlaying) {
      updateIntervalRef.current = setInterval(updateState, updateInterval);
    } else {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [state.isPlaying, updateState, updateInterval]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setState(prev => ({ ...prev, isLoading: false }));
    };

    const handleLoadedMetadata = () => {
      setState(prev => ({ 
        ...prev, 
        duration: video.duration || 0,
        isLoading: false 
      }));
    };

    const handlePlay = () => {
      setState(prev => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
    };

    const handleTimeUpdate = () => {
      setState(prev => ({ 
        ...prev, 
        currentTime: video.currentTime 
      }));
    };

    const handleVolumeChange = () => {
      setState(prev => ({ 
        ...prev, 
        volume: video.volume, 
        muted: video.muted 
      }));
    };

    const handleError = () => {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load video',
        isLoading: false 
      }));
    };

    const handleFullscreenChange = () => {
      setState(prev => ({ 
        ...prev, 
        isFullscreen: document.fullscreenElement === video 
      }));
    };

    // Attach event listeners
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('error', handleError);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Cleanup
    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('error', handleError);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [videoRef]);

  // Action functions
  const actions: VideoPlayerActions = {
    play: useCallback(() => {
      const video = videoRef.current;
      if (video) {
        video.play().catch(error => {
          console.error('Play failed:', error);
          setState(prev => ({ 
            ...prev, 
            error: 'Playback failed',
            isPlaying: false 
          }));
        });
      }
    }, [videoRef]),

    pause: useCallback(() => {
      const video = videoRef.current;
      if (video) {
        video.pause();
      }
    }, [videoRef]),

    togglePlay: useCallback(() => {
      const video = videoRef.current;
      if (video) {
        if (video.paused) {
          video.play().catch(error => {
            console.error('Play failed:', error);
            setState(prev => ({ 
              ...prev, 
              error: 'Playback failed',
              isPlaying: false 
            }));
          });
        } else {
          video.pause();
        }
      }
    }, [videoRef]),

    seek: useCallback((time: number) => {
      const video = videoRef.current;
      if (video) {
        video.currentTime = Math.max(0, Math.min(time, video.duration || 0));
      }
    }, [videoRef]),

    setVolume: useCallback((volume: number) => {
      const video = videoRef.current;
      if (video) {
        video.volume = Math.max(0, Math.min(1, volume));
      }
    }, [videoRef]),

    toggleMute: useCallback(() => {
      const video = videoRef.current;
      if (video) {
        video.muted = !video.muted;
      }
    }, [videoRef]),

    toggleFullscreen: useCallback(async () => {
      const video = videoRef.current;
      if (!video) return;

      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else {
          await video.requestFullscreen();
        }
      } catch (error) {
        console.error('Fullscreen failed:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Fullscreen not supported' 
        }));
      }
    }, [videoRef]),

    reset: useCallback(() => {
      const video = videoRef.current;
      if (video) {
        video.currentTime = 0;
        video.pause();
      }
    }, [videoRef])
  };

  return {
    state,
    actions,
    isSupported
  };
};