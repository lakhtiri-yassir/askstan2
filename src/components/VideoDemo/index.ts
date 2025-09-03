/**
 * VIDEO DEMO COMPONENTS - INDEX FILE
 * Clean exports for all video demo components
 * Provides easy importing for other parts of the application
 */

// Main component exports
export { VideoDemo } from './VideoDemo';
export { VideoThumbnail } from './VideoThumbnail';
export { VideoModal } from './VideoModal';

// Hook export
export { useVideoPlayer } from './useVideoPlayer';

// Type exports
export type {
  VideoProps,
  VideoThumbnailProps,
  VideoModalProps,
  VideoPlayerState,
  VideoPlayerActions,
  UseVideoPlayerProps,
  UseVideoPlayerReturn,
  VideoLoadingState,
  VideoAnalytics,
  VideoAccessibility,
  VideoTextTrack
} from './types';