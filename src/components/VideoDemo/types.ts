/**
 * VIDEO DEMO TYPES
 * TypeScript definitions for video demo components
 * Supports video thumbnail, modal player, and custom controls
 */

export interface VideoProps {
  /** Source URL for 3-second thumbnail video */
  thumbnailSrc: string;
  /** WebM fallback for thumbnail video */
  thumbnailWebM?: string;
  /** Source URL for full demonstration video */
  fullVideoSrc: string;
  /** Static fallback image for accessibility */
  fallbackImage: string;
  /** Video title for accessibility and SEO */
  title: string;
  /** Description shown alongside video */
  description: string;
  /** Optional poster image for full video */
  poster?: string;
  /** Autoplay thumbnail (default: true) */
  autoplay?: boolean;
  /** Muted by default (required for autoplay) */
  muted?: boolean;
  /** Loop thumbnail video (default: true) */
  loop?: boolean;
  /** Lazy load videos (default: true) */
  lazyLoad?: boolean;
}

export interface VideoThumbnailProps {
  /** Source URL for 3-second thumbnail video */
  thumbnailSrc: string;
  /** WebM fallback for thumbnail video */
  thumbnailWebM?: string;
  /** Static fallback image */
  fallbackImage: string;
  /** Alt text for accessibility */
  alt: string;
  /** Click handler to open full video */
  onPlay: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Autoplay thumbnail */
  autoplay?: boolean;
  /** Lazy load implementation */
  lazyLoad?: boolean;
}

export interface VideoModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close modal handler */
  onClose: () => void;
  /** Full video source URL */
  videoSrc: string;
  /** Video title */
  title: string;
  /** Optional poster image */
  poster?: string;
}

export interface VideoPlayerState {
  /** Whether video is playing */
  isPlaying: boolean;
  /** Current time in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Volume (0-1) */
  volume: number;
  /** Whether video is muted */
  muted: boolean;
  /** Whether video is fullscreen */
  isFullscreen: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
}

export interface VideoPlayerActions {
  /** Play the video */
  play: () => void;
  /** Pause the video */
  pause: () => void;
  /** Toggle play/pause */
  togglePlay: () => void;
  /** Seek to specific time */
  seek: (time: number) => void;
  /** Set volume (0-1) */
  setVolume: (volume: number) => void;
  /** Toggle mute */
  toggleMute: () => void;
  /** Enter/exit fullscreen */
  toggleFullscreen: () => void;
  /** Reset video to beginning */
  reset: () => void;
}

export interface UseVideoPlayerProps {
  /** Video element ref */
  videoRef: React.RefObject<HTMLVideoElement>;
  /** Auto-update interval in ms */
  updateInterval?: number;
}

export interface UseVideoPlayerReturn {
  /** Current video player state */
  state: VideoPlayerState;
  /** Video player action functions */
  actions: VideoPlayerActions;
  /** Whether browser supports video */
  isSupported: boolean;
}

export interface VideoLoadingState {
  /** Thumbnail loading */
  thumbnailLoading: boolean;
  /** Full video loading */
  fullVideoLoading: boolean;
  /** Thumbnail error */
  thumbnailError: string | null;
  /** Full video error */
  fullVideoError: string | null;
}

export interface VideoAnalytics {
  /** Track video play events */
  onPlay?: (videoType: 'thumbnail' | 'full') => void;
  /** Track video pause events */
  onPause?: (videoType: 'thumbnail' | 'full') => void;
  /** Track video completion */
  onComplete?: (videoType: 'thumbnail' | 'full') => void;
  /** Track video progress milestones */
  onProgress?: (videoType: 'thumbnail' | 'full', percentage: number) => void;
}

export interface VideoAccessibility {
  /** ARIA label for video */
  ariaLabel?: string;
  /** ARIA description for video */
  ariaDescription?: string;
  /** Whether to show captions */
  showCaptions?: boolean;
  /** Caption tracks */
  captions?: VideoTextTrack[];
}

export interface VideoTextTrack {
  /** Track source URL */
  src: string;
  /** Track language */
  srcLang: string;
  /** Track label */
  label: string;
  /** Track kind */
  kind: 'subtitles' | 'captions' | 'descriptions';
  /** Default track */
  default?: boolean;
}