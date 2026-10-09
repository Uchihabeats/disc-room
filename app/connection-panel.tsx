import {streamProfiles, type StreamQuality, type NetworkSample} from './remote-connection';

type Props = {
  quality: StreamQuality;
  changeQuality: (value: StreamQuality) => void;
  network: NetworkSample | null;
  connected: boolean;
  guest: boolean;
  inputStatus: 'waiting' | 'ready' | 'active' | 'stalled';
  relayAvailable: boolean;
  relayOnly: boolean;
  relayWarning: string;
  streamWarning: string;
  tryRelay: () => Promise<void>;
};

export function ConnectionPanel(props: Props) {
  const {network, guest, inputStatus} = props;
  const control = inputStatus === 'active' ? (guest ? 'Your buttons reached the host.' : 'P2 buttons reached the emulator.') : inputStatus === 'ready' ? 'Controller link ready. Press a button to check it.' : inputStatus === 'stalled' ? 'Controller updates stopped. Click the game and try again.' : 'Checking the controller link…';
  return <div className="connection-panel">
    <label className="field-label" htmlFor="stream-quality">STREAM QUALITY</label>
    <select id="stream-quality" value={props.quality} disabled={guest && !props.connected} onChange={event => props.changeQuality(event.target.value as StreamQuality)}>
      {Object.entries(streamProfiles).map(([value, profile]) => <option value={value} key={value}>{profile.label} · {profile.fps} FPS</option>)}
    </select>
    <p className="connection-note">Stuttering? Choose Data saver on either screen.</p>
    {props.connected && <p className={`control-receipt ${inputStatus === 'stalled' ? 'control-warning' : ''}`} role="status">{control}</p>}
    <details className="connection-details">
      <summary>Connection details</summary>
      <dl>
        <div><dt>Path</dt><dd>{network?.route === 'relay' ? 'Relay' : network?.route === 'direct' ? 'Direct' : 'Connecting'}</dd></div>
        <div><dt>Round trip</dt><dd>{network?.rtt != null ? `${network.rtt} ms` : '—'}</dd></div>
        <div><dt>Video</dt><dd>{network?.fps != null ? `${network.fps} FPS` : '—'}</dd></div>
        <div><dt>{guest ? 'Receiving' : 'Sending'}</dt><dd>{network?.bitrate != null ? `${network.bitrate} kbps` : '—'}</dd></div>
        {guest && <><div><dt>Packet loss</dt><dd>{network?.loss != null ? `${network.loss}%` : '—'}</dd></div><div><dt>Jitter</dt><dd>{network?.jitter != null ? `${network.jitter} ms` : '—'}</dd></div></>}
      </dl>
      {network?.limitation === 'cpu' && <p className="connection-note">Your device is struggling to encode video. Choose Data saver.</p>}
      {network?.limitation === 'bandwidth' && <p className="connection-note">The connection is limiting video quality. Choose Data saver.</p>}
      {props.relayAvailable ? <button className="outline-button" disabled={props.relayOnly} onClick={() => void props.tryRelay().catch(() => {})}>{props.relayOnly ? 'Using relay connection' : 'Try relay connection'}</button> : <p className="connection-note">Relay fallback is not configured yet.</p>}
      {props.relayWarning && <p className="connection-note">{props.relayWarning}</p>}
      {props.streamWarning && <p className="connection-note">{props.streamWarning}</p>}
    </details>
  </div>;
}
