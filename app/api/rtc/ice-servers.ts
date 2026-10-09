type TurnEnvironment = {
  CLOUDFLARE_TURN_KEY_ID?: string;
  CLOUDFLARE_TURN_API_TOKEN?: string;
  TURN_URL?: string;
  TURN_USERNAME?: string;
  TURN_CREDENTIAL?: string;
};
const directServers: RTCIceServer[] = [{urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302']}];

export async function connectionServers(env: TurnEnvironment, request: typeof fetch = fetch) {
  const iceServers = [...directServers];
  let warning = '';
  if (env.CLOUDFLARE_TURN_KEY_ID && env.CLOUDFLARE_TURN_API_TOKEN) {
    try {
      const response = await request(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(env.CLOUDFLARE_TURN_KEY_ID)}/credentials/generate-ice-servers`, {
        method: 'POST', headers: {'Authorization': `Bearer ${env.CLOUDFLARE_TURN_API_TOKEN}`, 'Content-Type': 'application/json'},
        body: JSON.stringify({ttl: 14400}), cache: 'no-store', signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error('Relay provider unavailable');
      const data = await response.json();
      for (const server of Array.isArray(data.iceServers) ? data.iceServers : []) {
        const urls = (Array.isArray(server.urls) ? server.urls : [server.urls]).filter((url: unknown): url is string => typeof url === 'string' && /^turns?:/.test(url) && !/:53(?:\?|$)/.test(url));
        if (urls.length && typeof server.username === 'string' && typeof server.credential === 'string') iceServers.push({urls, username: server.username, credential: server.credential});
      }
      if (iceServers.length === 1) throw new Error('Relay credentials missing');
    } catch {
      warning = 'The relay service is unavailable. Trying a direct connection.';
    }
  } else if (env.CLOUDFLARE_TURN_KEY_ID || env.CLOUDFLARE_TURN_API_TOKEN) {
    warning = 'Relay setup is incomplete. Trying a direct connection.';
  }
  const staticUrls = (env.TURN_URL || '').split(',').map(url => url.trim()).filter(url => /^turns?:/.test(url));
  if (staticUrls.length && env.TURN_USERNAME && env.TURN_CREDENTIAL) iceServers.push({urls: staticUrls, username: env.TURN_USERNAME, credential: env.TURN_CREDENTIAL});
  const relay = iceServers.length > 1;
  return {iceServers, relay, warning: relay ? '' : warning};
}
