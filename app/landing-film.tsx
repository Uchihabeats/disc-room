"use client";

import { useEffect, useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import "./landing-film.css";

const FILM_URL = "/media/disc-room-film-v2.mp4";

export function LandingFilm() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"ready" | "loading" | "playing" | "paused" | "ended" | "error">("ready");
  const [buffering, setBuffering] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = 0.65;
    let autoplayAttempted = false;

    const pauseWhenHidden = () => {
      if (document.hidden && document.pictureInPictureElement !== video) video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && document.pictureInPictureElement !== video) video.pause();
      if (entry.isIntersecting && !document.hidden && !autoplayAttempted) {
        autoplayAttempted = true;
        // Keep the play button available if the browser declines autoplay.
        void video.play().catch(() => {});
      }
    });
    observer.observe(video);
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", pauseWhenHidden);
    };
  }, []);

  async function startFilm() {
    const video = videoRef.current;
    if (!video) return;
    if (status === "ended") video.currentTime = 0;
    if (status === "error") video.load();
    setStatus("loading");
    try {
      await video.play();
      video.focus({ preventScroll: true });
    } catch {
      setStatus("error");
    }
  }

  const showPlayButton = status === "ready" || status === "ended";

  return (
    <section className="landing-film" id="the-film" aria-labelledby="film-title">
      <div className="film-heading">
        <div>
          <span className="film-eyebrow">THE HANGOUT / IN MOTION</span>
          <h2 id="film-title">OLD GAMES.<br />NEW HANGOUTS.</h2>
        </div>
        <p>From choosing a console to sharing a room—with a real game in the middle. Take a look.</p>
      </div>

      <figure className="film-card">
        <div className="film-screen">
          <video
            ref={videoRef}
            className="film-video"
            width={1920}
            height={1080}
            controls
            playsInline
            muted={muted}
            preload="none"
            poster="/media/disc-room-film-poster-v2.webp"
            tabIndex={0}
            aria-label="Disc Room: Distance doesn’t get a turn"
            aria-describedby="film-caption"
            onPlay={() => setStatus("playing")}
            onPlaying={() => setBuffering(false)}
            onVolumeChange={() => setMuted(videoRef.current?.muted ?? true)}
            onWaiting={() => setBuffering(true)}
            onPause={() => setStatus((current) => current === "playing" ? "paused" : current)}
            onEnded={() => { setStatus("ended"); setBuffering(false); }}
            onError={() => { setStatus("error"); setBuffering(false); }}
          >
            <source src={FILM_URL} type="video/mp4" />
            <track kind="captions" src="/media/disc-room-film-v2.vtt" srcLang="en" label="English" />
            Your browser cannot play this video. <a href={FILM_URL}>Open the film.</a>
          </video>

          {showPlayButton ? (
            <button
              type="button"
              className="film-play"
              onClick={startFilm}
              aria-label={status === "ended" ? "Replay Disc Room film, 38 seconds" : "Play Disc Room film, 38 seconds"}
            >
              <span className="film-play-icon">{status === "ended" ? <RotateCcw size={25} aria-hidden="true" /> : <Play size={25} fill="currentColor" aria-hidden="true" />}</span>
              <span>{status === "ended" ? "Watch again" : "Watch the film"}<small>00:38 / DISC ROOM</small></span>
            </button>
          ) : null}

          {(status === "loading" || (buffering && status === "playing")) ? <span className="film-loading" role="status">Getting the film ready…</span> : null}
          {status === "error" ? (
            <div className="film-error" role="alert">
              <p>The film couldn’t load.</p>
              <button type="button" className="primary-button" onClick={startFilm}>Try again</button>
              <a href={FILM_URL}>Open the video</a>
            </div>
          ) : null}
        </div>
        <figcaption id="film-caption" className="film-caption">
          <span><span className="film-caption-dot" aria-hidden="true" />YOUR NEXT HANGOUT / 00:38</span>
          <span aria-live="polite">{status === "playing" ? (muted ? "PLAYING MUTED / UNMUTE FOR SOUND" : "NOW PLAYING") : status === "paused" ? "PAUSED" : status === "ended" ? "ONE MORE ROUND?" : "PRESS PLAY TO WATCH"}</span>
        </figcaption>
      </figure>

      <details className="film-transcript">
        <summary>Read the film transcript</summary>
        <div>
          <p>Player two? Still there? Distance doesn’t get a turn.</p>
          <p>Disc Room. One console, even miles apart. Pick your console from 39 systems. Bring the game: load it from your device. Your files stay local.</p>
          <p>Real game, in your browser. The film shows 8-Bit Table Tennis, a homebrew NES game by Michael Billington, running locally in Disc Room.</p>
          <p>Save a seat. Create a room. Invite your friend. Choose a game with local multiplayer. The couch is wherever you are.</p>
          <p>Play. Together. Choose a console. Bring your own ROM.</p>
        </div>
      </details>
    </section>
  );
}
