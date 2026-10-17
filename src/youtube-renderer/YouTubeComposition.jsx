import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';

function Shot({ image, durationInFrames, fps }) {
  const frame = useCurrentFrame();
  const progress = durationInFrames <= 1 ? 0 : frame / (durationInFrames - 1);
  const motion = image.motion ?? {};
  const scale = interpolate(progress, [0, 1], [Number(motion.scaleFrom ?? 1.01), Number(motion.scaleTo ?? 1.035)], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const x = interpolate(progress, [0, 1], [Number(motion.xFrom ?? 0), Number(motion.xTo ?? 0)], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const y = interpolate(progress, [0, 1], [Number(motion.yFrom ?? 0), Number(motion.yTo ?? 0)], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#111', overflow: 'hidden' }}>
      <Img
        src={staticFile(image.file)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
          transformOrigin: 'center center'
        }}
      />
      {(image.cues ?? []).filter(cue => cue?.type === 'highlight' || cue?.type === 'label').map((cue, index) => {
        // Coordinates are editorial annotations (normalized 0..1), not AI-guessed paths.
        const x = Number(cue.x), y = Number(cue.y);
        const w = Number(cue.width ?? 0.2), h = Number(cue.height ?? 0.12);
        if (![x, y, w, h].every(Number.isFinite) || x < 0 || y < 0 ||
            w <= 0 || h <= 0 || x + w > 1 || y + h > 1) return null;
        const at = Math.max(0, Number(cue.atSeconds ?? 0));
        const until = Number(cue.untilSeconds ?? (durationInFrames / fps));
        if (!Number.isFinite(until) || until <= at) return null;
        const elapsed = frame / fps;
        const opacity = elapsed < at || elapsed > until ? 0 :
          Math.min(1, (elapsed - at) / 0.22, (until - elapsed) / 0.22);
        const label = String(cue.text ?? '').trim();
        if (cue.type === 'label' && (!label || label.length > 32 ||
            /Bild\s*\d|SCENE_KEY|OUTPUT FILE|Polaris/i.test(label))) return null;
        return (
          <div key={index} style={{
            position: 'absolute', left: (x * 100) + '%', top: (y * 100) + '%',
            width: (w * 100) + '%', height: (h * 100) + '%',
            opacity, boxSizing: 'border-box', pointerEvents: 'none',
            border: cue.type === 'highlight' ? '5px solid #E6AF55' : 'none',
            borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Arial, sans-serif', fontSize: 34, fontWeight: 700,
            textAlign: 'center', color: '#fff',
            textShadow: '0 2px 4px rgba(0,0,0,.8)',
            background: cue.type === 'label' ? 'rgba(18,29,38,.82)' : 'transparent'
          }}>{cue.type === 'label' ? label : null}</div>
        );
      })}
    </AbsoluteFill>
  );
}

export function YouTubeComposition({ plan }) {
  const fps = Number(plan.fps ?? 30);
  const totalFrames = Math.max(1, Math.ceil(Number(plan.durationSeconds ?? 1) * fps));

  return (
    <AbsoluteFill style={{ backgroundColor: '#111' }}>
      <Audio src={staticFile(plan.audioFile)} />
      {plan.images.map((image) => {
        const from = Math.max(0, Math.round(Number(image.startSeconds) * fps));
        const end = Math.max(from + 1, Math.round(Number(image.endSeconds) * fps));
        const durationInFrames = end - from;
        return (
          <Sequence key={image.imageNumber} from={from} durationInFrames={durationInFrames} premountFor={fps}>
            <Shot image={image} durationInFrames={durationInFrames} fps={fps} />
          </Sequence>
        );
      })}
      {(plan.sounds ?? []).filter((sound) => sound.file).map((sound, index) => {
        const from = Math.max(0, Math.round(Number(sound.fromSeconds ?? 0) * fps));
        return (
          <Sequence key={`${sound.imageNumber ?? 'sfx'}-${index}`} from={from} durationInFrames={Math.max(1, totalFrames - from)}>
            <Audio src={staticFile(sound.file)} volume={Number(sound.volume ?? 0.15)} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
