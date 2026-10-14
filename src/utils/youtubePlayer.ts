/**
 * Safe YouTube IFrame API communication helper
 */

export function getPlayerIframe(): HTMLIFrameElement | null {
  if (typeof document === 'undefined') return null;
  return (document.getElementById('persistent-youtube-player') as HTMLIFrameElement) ||
         (document.querySelector('iframe[src*="youtube.com/embed"]') as HTMLIFrameElement);
}

export function sendYouTubeCommand(func: string, args: any[] = []): boolean {
  const iframe = getPlayerIframe();
  if (!iframe || !iframe.contentWindow) return false;

  try {
    iframe.contentWindow.postMessage(
      JSON.stringify({
        event: 'command',
        func,
        args
      }),
      '*'
    );
    return true;
  } catch (err) {
    console.warn('Could not postMessage to YouTube player:', err);
    return false;
  }
}

export function playYouTubeVideo(): void {
  sendYouTubeCommand('playVideo');
}

export function pauseYouTubeVideo(): void {
  sendYouTubeCommand('pauseVideo');
}

export function parseDurationToSeconds(durationStr?: string): number {
  if (!durationStr || durationStr.toLowerCase().includes('live')) return 210;
  const parts = durationStr.split(':').map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 210;
}

export function formatSecondsToTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function switchYouTubeVideo(videoId: string, volume?: number): void {
  const iframe = getPlayerIframe();
  if (iframe) {
    // 1. Try native API switch (instant, smooth, no iframe reload)
    sendYouTubeCommand('loadVideoById', [{ videoId, startSeconds: 0 }]);
    sendYouTubeCommand('playVideo');

    // 2. Also ensure iframe src is pointing to the new video with autoplay if needed
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const newSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(origin)}`;
    if (!iframe.src.includes(videoId)) {
      iframe.src = newSrc;
    }

    // 3. Re-enforce user's volume across song switches at staggered intervals
    if (typeof volume === 'number') {
      const applyVol = () => setYouTubeVolume(volume);
      applyVol();
      setTimeout(applyVol, 150);
      setTimeout(applyVol, 500);
      setTimeout(applyVol, 1200);
    }
  }
}

export function setYouTubeVolume(volumePercent: number): void {
  const safeVol = Math.min(100, Math.max(0, Math.round(volumePercent)));
  sendYouTubeCommand('setVolume', [safeVol]);
  if (safeVol > 0) {
    sendYouTubeCommand('unMute');
  } else {
    sendYouTubeCommand('mute');
  }
}

export function seekYouTubeVideo(seconds: number): void {
  sendYouTubeCommand('seekTo', [seconds, true]);
}

export function muteYouTube(): void {
  sendYouTubeCommand('mute');
}

export function unMuteYouTube(): void {
  sendYouTubeCommand('unMute');
}

export function initYouTubeListenerHandshake(): void {
  const iframe = getPlayerIframe();
  if (iframe && iframe.contentWindow) {
    try {
      iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
    } catch {
      // ignore
    }
  }
}

/**
 * Listen for YouTube iframe player status changes and real-time playback updates
 * YouTube player state: 0 is ENDED, 1 is PLAYING, 2 is PAUSED
 */
export function setupYouTubeStateListener(
  onVideoEnded: () => void,
  onTimeUpdate?: (currentTime: number, duration: number) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  // Request listening handshake initially and periodically until connected
  initYouTubeListenerHandshake();
  const handshakeInterval = setInterval(() => {
    initYouTubeListenerHandshake();
  }, 3000);

  let lastTriggerTime = 0;
  const triggerEndedSafely = () => {
    const now = Date.now();
    // Throttle to prevent duplicate rapid triggers
    if (now - lastTriggerTime > 1500) {
      lastTriggerTime = now;
      onVideoEnded();
    }
  };

  let lastTimeUpdate = 0;
  const handleMessage = (event: MessageEvent) => {
    try {
      if (!event.data) return;
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (!data) return;

      // Real-time time & duration reporting from YouTube IFrame API (throttled to at most every 500ms)
      if (data.info && onTimeUpdate) {
        const ct = typeof data.info.currentTime === 'number' ? data.info.currentTime : undefined;
        const dur = typeof data.info.duration === 'number' && data.info.duration > 0 ? data.info.duration : undefined;
        if (typeof ct === 'number') {
          const now = Date.now();
          if (now - lastTimeUpdate >= 500) {
            lastTimeUpdate = now;
            onTimeUpdate(ct, dur || 0);
          }
        }
      }

      // 1. YouTube IFrame API onStateChange event:
      // info === 0 or info.playerState === 0 represents YT.PlayerState.ENDED
      if (data.event === 'onStateChange') {
        if (data.info === 0 || data.info?.playerState === 0) {
          triggerEndedSafely();
        }
      } 
      // 2. Info delivery format used by YouTube embeds
      else if (data.info && data.info.playerState === 0) {
        triggerEndedSafely();
      }
    } catch {
      // Non-JSON or third party postMessage
    }
  };

  window.addEventListener('message', handleMessage);
  return () => {
    clearInterval(handshakeInterval);
    window.removeEventListener('message', handleMessage);
  };
}
