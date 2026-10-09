export const streamProfiles = {
  saver: {label: 'Data saver', bitrate: 600_000, fps: 24, width: 480},
  balanced: {label: 'Balanced', bitrate: 1_200_000, fps: 30, width: 640},
  sharp: {label: 'Sharper picture', bitrate: 2_400_000, fps: 30, width: 960},
} as const;
export type StreamQuality = keyof typeof streamProfiles;
export const isStreamQuality = (value: unknown): value is StreamQuality => typeof value === 'string' && Object.hasOwn(streamProfiles, value);

export async function limitStream(peer: RTCPeerConnection, quality: StreamQuality) {
  const profile = streamProfiles[quality];
  for (const sender of peer.getSenders()) {
    if (!sender.track || !['video', 'audio'].includes(sender.track.kind)) continue;
    const parameters = sender.getParameters();
    // Encodings exist after the offer/answer negotiation has completed.
    if (!parameters.encodings?.length) continue;
    for (const encoding of parameters.encodings) {
      encoding.maxBitrate = sender.track.kind === 'audio' ? 64_000 : profile.bitrate;
      if (sender.track.kind === 'video') {
        encoding.maxFramerate = profile.fps;
        encoding.scaleResolutionDownBy = Math.max(1, (sender.track.getSettings().width || profile.width) / profile.width);
      }
    }
    if (sender.track.kind === 'video') parameters.degradationPreference = 'maintain-framerate';
    await sender.setParameters(parameters);
  }
}

export type NetworkSample = {
  route: 'direct' | 'relay' | 'unknown';
  rtt: number | null;
  fps: number | null;
  bitrate: number | null;
  loss: number | null;
  jitter: number | null;
  limitation: string | null;
};
export type MediaCounter = {timestamp: number; bytes: number; lost: number; received: number};

export function summarizeConnection(report: RTCStatsReport, guest: boolean, previous?: MediaCounter) {
  const result: NetworkSample = {route: 'unknown', rtt: null, fps: null, bitrate: null, loss: null, jitter: null, limitation: null};
  const entries: Record<string, any>[] = [];
  report.forEach(entry => entries.push(entry));
  const transport = entries.find(entry => entry.type === 'transport' && entry.selectedCandidatePairId);
  const pair = entries.find(entry => entry.id === transport?.selectedCandidatePairId) || entries.find(entry => entry.type === 'candidate-pair' && entry.nominated && entry.state === 'succeeded');
  if (pair) {
    const local = report.get(pair.localCandidateId), remote = report.get(pair.remoteCandidateId);
    result.route = local?.candidateType === 'relay' || remote?.candidateType === 'relay' ? 'relay' : 'direct';
    if (typeof pair.currentRoundTripTime === 'number') result.rtt = Math.round(pair.currentRoundTripTime * 1000);
  }
  const media = entries.find(entry => entry.type === (guest ? 'inbound-rtp' : 'outbound-rtp') && (entry.kind || entry.mediaType) === 'video');
  let counter: MediaCounter | undefined;
  if (media) {
    result.fps = typeof media.framesPerSecond === 'number' ? Math.round(media.framesPerSecond) : null;
    result.jitter = typeof media.jitter === 'number' ? Math.round(media.jitter * 1000) : null;
    result.limitation = media.qualityLimitationReason || null;
    counter = {timestamp: media.timestamp, bytes: media.bytesReceived ?? media.bytesSent ?? 0, lost: media.packetsLost || 0, received: media.packetsReceived || 0};
    if (previous && counter.timestamp > previous.timestamp && counter.bytes >= previous.bytes) {
      result.bitrate = Math.round((counter.bytes - previous.bytes) * 8 / (counter.timestamp - previous.timestamp));
      const lost = Math.max(0, counter.lost - previous.lost), received = Math.max(0, counter.received - previous.received);
      if (guest && lost + received > 0) result.loss = Math.round(lost / (lost + received) * 1000) / 10;
    }
  }
  return {sample: result, counter};
}
