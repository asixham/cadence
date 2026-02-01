export interface Service {
  id: string;
  name: string;
  category: 'streaming' | 'music' | 'web' | 'games';
  url: string;
  icon?: string;
  domain?: string;
}

// Helper to extract domain from service URL
function extractDomain(service: Service): string {
  if (service.domain) return service.domain;
  
  try {
    const url = new URL(service.url);
    return url.hostname
      .replace('www.', '')
      .replace('tv.', '')
      .replace('music.', '')
      .replace('play.', '')
      .replace('watch.', '')
      .replace('open.', '');
  } catch {
    return service.url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}

// Helper to get logo URL - uses logo.dev for high-quality logos
export function getLogoUrl(service: Service): string {
  if (service.icon) return service.icon;
  
  const domain = extractDomain(service);
  const apiKey = process.env.NEXT_PUBLIC_LOGO_DEV_API_KEY;
  
  // Use logo.dev for high-quality company logos with API key
  if (apiKey) {
    return `https://img.logo.dev/${domain}?token=${apiKey}`;
  }
  
  // Fallback to logo.dev without API key if not available
  return `https://logo.dev/${domain}`;
}

// Fallback logo URL - try direct favicon from domain
export function getFallbackLogoUrl(service: Service): string {
  const domain = extractDomain(service);
  // Try getting favicon directly from the domain (often higher quality)
  return `https://${domain}/favicon.ico`;
}

// Second fallback using Google's favicon service (larger size for better quality)
export function getSecondFallbackLogoUrl(service: Service): string {
  const domain = extractDomain(service);
  // Use larger size (512) for better quality when scaled
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=512`;
}

export const allServices: Service[] = [
  // Streaming
  { id: 'amazon-prime', name: 'Amazon Prime Video', category: 'streaming', url: 'https://www.primevideo.com' },
  { id: 'amc-plus', name: 'AMC+', category: 'streaming', url: 'https://www.amcplus.com' },
  { id: 'bloomberg-live', name: 'Bloomberg Live', category: 'streaming', url: 'https://www.bloomberg.com/live' },
  { id: 'boomerang', name: 'Boomerang', category: 'streaming', url: 'https://www.boomerang.com' },
  { id: 'cbs-news', name: 'CBS News', category: 'streaming', url: 'https://www.cbsnews.com/live' },
  { id: 'cnn', name: 'CNN', category: 'streaming', url: 'https://www.cnn.com' },
  { id: 'court-tv', name: 'Court TV', category: 'streaming', url: 'https://www.courttv.com' },
  { id: 'crackle', name: 'Crackle', category: 'streaming', url: 'https://www.crackle.com' },
  { id: 'crave', name: 'Crave', category: 'streaming', url: 'https://www.crave.ca' },
  { id: 'cbs-sports', name: 'CBS Sports', category: 'streaming', url: 'https://www.cbssports.com' },
  { id: 'crunchyroll', name: 'Crunchyroll', category: 'streaming', url: 'https://www.crunchyroll.com' },
  { id: 'discovery-plus', name: 'Discovery+', category: 'streaming', url: 'https://www.discoveryplus.com' },
  { id: 'disney-plus', name: 'Disney+', category: 'streaming', url: 'https://www.disneyplus.com' },
  { id: 'distro-tv', name: 'DistroTV', category: 'streaming', url: 'https://www.distrotv.com' },
  { id: 'emby', name: 'Emby', category: 'streaming', url: 'https://emby.media' },
  { id: 'espn', name: 'ESPN', category: 'streaming', url: 'https://www.espn.com' },
  { id: 'fox-business', name: 'Fox Business', category: 'streaming', url: 'https://www.foxbusiness.com' },
  { id: 'fox-news', name: 'Fox News', category: 'streaming', url: 'https://www.foxnews.com' },
  { id: 'fox-sports', name: 'Fox Sports', category: 'streaming', url: 'https://www.foxsports.com' },
  { id: 'fubo', name: 'FUBO', category: 'streaming', url: 'https://www.fubo.tv' },
  { id: 'hbo-max', name: 'HBO/MAX', category: 'streaming', url: 'https://www.max.com' },
  { id: 'history', name: 'History Channel', category: 'streaming', url: 'https://www.history.com' },
  { id: 'hulu', name: 'Hulu', category: 'streaming', url: 'https://www.hulu.com' },
  { id: 'mgm-plus', name: 'MGM+', category: 'streaming', url: 'https://www.mgmplus.com' },
  { id: 'mlb-tv', name: 'MLB.tv', category: 'streaming', url: 'https://www.mlb.com/tv' },
  { id: 'netflix', name: 'Netflix', category: 'streaming', url: 'https://www.netflix.com' },
  { id: 'onlyfans', name: 'Only Fans', category: 'streaming', url: 'https://onlyfans.com' },
  { id: 'paramount-plus', name: 'Paramount+', category: 'streaming', url: 'https://www.paramountplus.com' },
  { id: 'pbs', name: 'PBS', category: 'streaming', url: 'https://www.pbs.org' },
  { id: 'philo', name: 'Philo', category: 'streaming', url: 'https://www.philo.com' },
  { id: 'plex', name: 'Plex', category: 'streaming', url: 'https://www.plex.tv' },
  { id: 'pluto-tv', name: 'PlutoTV', category: 'streaming', url: 'https://pluto.tv' },
  { id: 'sling', name: 'Sling', category: 'streaming', url: 'https://www.sling.com' },
  { id: 'starz', name: 'Starz', category: 'streaming', url: 'https://www.starz.com' },
  { id: 'tubi', name: 'Tubi.tv', category: 'streaming', url: 'https://tubitv.com' },
  { id: 'twitch', name: 'Twitch', category: 'streaming', url: 'https://www.twitch.tv' },
  { id: 'vix', name: 'Vix', category: 'streaming', url: 'https://www.vix.com' },
  { id: 'xumo', name: 'Xumo Play', category: 'streaming', url: 'https://www.xumo.tv' },
  { id: 'youtube', name: 'Youtube', category: 'streaming', url: 'https://www.youtube.com' },
  { id: 'youtube-tv', name: 'YoutubeTV', category: 'streaming', url: 'https://tv.youtube.com' },
  
  // Music
  { id: 'accuradio', name: 'AccuRadio', category: 'music', url: 'https://www.accuradio.com' },
  { id: 'amazon-music', name: 'Amazon Music', category: 'music', url: 'https://music.amazon.com' },
  { id: 'apple-music', name: 'Apple Music', category: 'music', url: 'https://music.apple.com' },
  { id: 'deezer', name: 'Deezer', category: 'music', url: 'https://www.deezer.com' },
  { id: 'idagio', name: 'Idagio', category: 'music', url: 'https://www.idagio.com' },
  { id: 'iheartradio', name: 'iHeartRadio', category: 'music', url: 'https://www.iheart.com' },
  { id: 'liveone', name: 'LiveOne', category: 'music', url: 'https://www.liveone.com' },
  { id: 'mixcloud', name: 'MixCloud', category: 'music', url: 'https://www.mixcloud.com' },
  { id: 'napster', name: 'Napster', category: 'music', url: 'https://www.napster.com' },
  { id: 'pandora', name: 'Pandora', category: 'music', url: 'https://www.pandora.com' },
  { id: 'qobuz', name: 'Qobuz', category: 'music', url: 'https://www.qobuz.com' },
  { id: 'soundcloud', name: 'SoundCloud', category: 'music', url: 'https://soundcloud.com' },
  { id: 'spotify', name: 'Spotify', category: 'music', url: 'https://open.spotify.com' },
  { id: 'tidal', name: 'Tidal', category: 'music', url: 'https://tidal.com' },
  { id: 'tunein', name: 'TuneIn', category: 'music', url: 'https://tunein.com' },
  { id: 'youtube-music', name: 'Youtube Music', category: 'music', url: 'https://music.youtube.com' },
  
  // Web
  { id: 'abrp', name: 'A Better Route Planner', category: 'web', url: 'https://www.abetterrouteplanner.com' },
  { id: 'baidu', name: 'Baidu', category: 'web', url: 'https://www.baidu.com' },
  { id: 'bing', name: 'Bing.com', category: 'web', url: 'https://www.bing.com' },
  { id: 'chatgpt', name: 'ChatGPT / OpenAI', category: 'web', url: 'https://chat.openai.com' },
  { id: 'discord', name: 'Discord', category: 'web', url: 'https://discord.com' },
  { id: 'ebay', name: 'Ebay', category: 'web', url: 'https://www.ebay.com' },
  { id: 'facebook', name: 'Facebook', category: 'web', url: 'https://www.facebook.com' },
  { id: 'fandom', name: 'Fandom', category: 'web', url: 'https://www.fandom.com' },
  { id: 'google-maps', name: 'Google Maps', category: 'web', url: 'https://www.google.com/maps' },
  { id: 'google', name: 'Google.com', category: 'web', url: 'https://www.google.com' },
  { id: 'instagram', name: 'Instagram', category: 'web', url: 'https://www.instagram.com' },
  { id: 'linkedin', name: 'LinkedIn', category: 'web', url: 'https://www.linkedin.com' },
  { id: 'pinterest', name: 'Pinterest', category: 'web', url: 'https://www.pinterest.com' },
  { id: 'plugshare', name: 'Plugshare', category: 'web', url: 'https://www.plugshare.com' },
  { id: 'quora', name: 'Quora', category: 'web', url: 'https://www.quora.com' },
  { id: 'reddit', name: 'Reddit', category: 'web', url: 'https://www.reddit.com' },
  { id: 'supercharge', name: 'Supercharge.info', category: 'web', url: 'https://supercharge.info' },
  { id: 'tmc', name: 'Tesla Motors Club', category: 'web', url: 'https://teslamotorsclub.com' },
  { id: 'teslafi', name: 'TeslaFi', category: 'web', url: 'https://www.teslafi.com' },
  { id: 'teslarati', name: 'Teslarati', category: 'web', url: 'https://www.teslarati.com' },
  { id: 'tiktok', name: 'Tiktok', category: 'web', url: 'https://www.tiktok.com' },
  { id: 'waze', name: 'Waze', category: 'web', url: 'https://www.waze.com' },
  { id: 'weather', name: 'Weather.com', category: 'web', url: 'https://weather.com' },
  { id: 'whatsapp', name: 'WhatsApp', category: 'web', url: 'https://web.whatsapp.com' },
  { id: 'wikipedia', name: 'Wikipedia', category: 'web', url: 'https://www.wikipedia.org' },
  { id: 'x', name: 'X.com', category: 'web', url: 'https://x.com' },
  { id: 'yahoo', name: 'Yahoo.com', category: 'web', url: 'https://www.yahoo.com' },
  
  // Games
  { id: '2048', name: '2048', category: 'games', url: 'https://play2048.co' },
  { id: 'back-country', name: 'Back Country', category: 'games', url: 'https://www.backcountry.com' },
  { id: 'blackjack', name: 'Blackjack', category: 'games', url: 'https://www.247blackjack.com' },
  { id: 'casual-crusade', name: 'Casual Crusade', category: 'games', url: 'https://www.casualcrusade.com' },
  { id: 'checkers', name: 'Checkers', category: 'games', url: 'https://www.checkers.com' },
  { id: 'chess', name: 'Chess', category: 'games', url: 'https://www.chess.com' },
  { id: 'crazy-coasters', name: 'Crazy Coasters', category: 'games', url: 'https://www.crazycoasters.com' },
  { id: 'euchre', name: 'Euchre', category: 'games', url: 'https://www.euchre.com' },
  { id: 'gin-rummy', name: 'Gin Rummy', category: 'games', url: 'https://www.ginrummy.com' },
  { id: 'go', name: 'Go', category: 'games', url: 'https://www.gokgs.com' },
  { id: 'minesweeper', name: 'Minesweeper', category: 'games', url: 'https://minesweeper.online' },
  { id: 'off-the-line', name: 'Off the line', category: 'games', url: 'https://www.offtheline.com' },
  { id: 'oh-flip', name: 'Oh Flip', category: 'games', url: 'https://www.ohflip.com' },
  { id: 'pinball', name: 'Pinball', category: 'games', url: 'https://www.pinball.com' },
  { id: 'poker', name: 'Poker', category: 'games', url: 'https://www.poker.com' },
  { id: 'push-back', name: 'Push Back', category: 'games', url: 'https://www.pushback.com' },
  { id: 'snake', name: 'Snake', category: 'games', url: 'https://snake.io' },
  { id: 'solitaire', name: 'Solitaire', category: 'games', url: 'https://www.solitaire.com' },
  { id: 'tetris', name: 'Tetris', category: 'games', url: 'https://tetris.com' },
  { id: 'martians', name: 'The Martians are Back', category: 'games', url: 'https://www.martians.com' },
  { id: 'thug-racer', name: 'Thug Racer', category: 'games', url: 'https://www.thugracer.com' },
  { id: 'tic-tac-toe', name: 'Tic Tac Toe', category: 'games', url: 'https://www.tictactoe.com' },
  { id: 'war', name: 'War', category: 'games', url: 'https://www.war.com' },
];

