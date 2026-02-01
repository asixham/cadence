# Cadence - YouTube Canvas Video Player

A Next.js application that plays YouTube videos on a canvas element without using a video element. Uses WebCodecs API to decode video frames and render them frame-by-frame on a canvas.

## Features

- **Canvas-based playback**: Videos are rendered frame-by-frame on a canvas (no video element)
- **WebCodecs API**: Uses modern WebCodecs VideoDecoder for frame extraction
- **Frame-by-frame control**: Step through frames with precise timing
- **24 FPS locked**: Optimized frame rate for consistent playback
- **Tesla-optimized UI**: Designed for low-glare displays

## Browser Support

WebCodecs API is required. Supported browsers:
- Chrome 94+
- Edge 94+
- Opera 80+

## Architecture

### Frontend (`app/page.tsx`)
- Uses WebCodecs `VideoDecoder` to decode video frames
- Caches decoded frames as `ImageData` objects
- Renders frames to canvas with proper aspect ratio handling
- Frame-by-frame playback with precise timing

### Backend API (`app/api/youtube/route.ts`)
- Extracts YouTube video stream URLs
- Returns video metadata (width, height, duration, fps)
- **Requires integration** with yt-dlp or similar service

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

## YouTube Integration

To enable YouTube video playback, you need to integrate a service that can extract video stream URLs. Options:

### Option 1: yt-dlp-wrap (Recommended)
```bash
npm install yt-dlp-wrap
```

Then update `app/api/youtube/route.ts`:
```typescript
import { YTDlpWrap } from 'yt-dlp-wrap';

const ytDlpWrap = new YTDlpWrap();
const videoInfo = await ytDlpWrap.getVideoInfo(videoId);
const streamUrl = videoInfo.formats[0].url;

return NextResponse.json({
  streamUrl,
  width: videoInfo.width,
  height: videoInfo.height,
  duration: videoInfo.duration,
  fps: videoInfo.fps || 24,
});
```

### Option 2: yt-dlp as subprocess
Use yt-dlp directly as a subprocess to extract video URLs.

### Option 3: Third-party API
Use a service that provides YouTube video stream URLs.

## How It Works

1. User enters YouTube URL or video ID
2. Frontend calls `/api/youtube?videoId=...`
3. Backend extracts video stream URL (requires yt-dlp integration)
4. Frontend fetches video stream
5. WebCodecs VideoDecoder decodes video chunks
6. Decoded frames are converted to ImageData
7. Frames are cached and rendered to canvas
8. Playback loop displays frames at 24 FPS

## Current Limitations

- **Backend integration required**: The API route needs yt-dlp or similar service
- **Video container parsing**: Full implementation requires proper MP4/WebM container parsing for accurate frame extraction
- **Codec detection**: Currently uses H.264 baseline profile - should detect from video stream

## Future Improvements

- [ ] Complete video container parsing (MP4/WebM)
- [ ] Automatic codec detection
- [ ] Frame seeking optimization
- [ ] Better error handling
- [ ] Progress indicators for decoding

## License

MIT
