/**
 * VIDEO DEMO COMPONENTS - INDEX FILE - FIXED EXPORTS
 * Clean exports for all video demo components
 * Provides easy importing for other parts of the application
 */

// Main component exports with both named and default exports
export { default as VideoDemo } from './VideoDemo';
export { default as VideoThumbnail } from './VideoThumbnail';
export { default as VideoModal } from './VideoModal';

// Named exports for backwards compatibility
export { VideoDemo as VideoDemoComponent } from './VideoDemo';
export { VideoThumbnail as VideoThumbnailComponent } from './VideoThumbnail';
export { VideoModal as VideoModalComponent } from './VideoModal';

// Hook export
export { default as useVideoPlayer } from './useVideoPlayer';
export { useVideoPlayer as useVideoPlayerHook } from './useVideoPlayer';

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