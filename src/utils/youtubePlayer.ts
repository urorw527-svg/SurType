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

export function switchYouTubeVideo(videoId: string): void {
  const iframe = getPlayerIframe();
  if (iframe) {
    // 1. Try native API switch (instant, smooth, no iframe reload)
    sendYouTubeCommand('loadVideoById', [videoId]);

    // 2. Also ensure iframe src is pointing to the new video with autoplay
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const newSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(origin)}`;
    if (!iframe.src.includes(videoId)) {
      iframe.src = newSrc;
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
 * Listen for YouTube iframe player status changes (e.g. video ended)
 * YouTube player state: 0 is ENDED
 */
export function setupYouTubeStateListener(onVideoEnded: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  // Request listening handshake
  initYouTubeListenerHandshake();

  const handleMessage = (event: MessageEvent) => {
    try {
      if (typeof event.data !== 'string') return;
      const data = JSON.parse(event.data);
      // YouTube IFrame postMessage events:
      // data.event === "onStateChange" or infoDelivery with playerState === 0
      if (data.event === 'onStateChange' && (data.info === 0 || data.info?.playerState === 0)) {
        onVideoEnded();
      } else if (data.info && data.info.playerState === 0) {
        onVideoEnded();
      }
    } catch {
      // Non-JSON or third party postMessage
    }
  };

  window.addEventListener('message', handleMessage);
  return () => {
    window.removeEventListener('message', handleMessage);
  };
}
