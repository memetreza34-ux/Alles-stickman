import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

const FONT = '"Arial Black", "Helvetica Neue", Arial, sans-serif';

function Shot({ image, durationInFrames }) {
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
          transformOrigin: `${Number(motion.originX ?? 50)}% ${Number(motion.originY ?? 50)}%`
        }}
      />
    </AbsoluteFill>
  );
}

// Text kommt nie aus dem Bildmodell, sondern exakt aus BILD_AUDIO_ZUORDNUNG.json (overlay).
function Overlay({ overlay }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = Math.round(Number(overlay.delaySeconds ?? 0) * fps);
  if (frame < delay) return null;
  const pop = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 180 } });
  const position = overlay.position ?? (overlay.style === 'card' ? 'center' : 'top');
  const justify = { top: 'flex-start', center: 'center', bottom: 'flex-end' }[position] ?? 'flex-start';

  if (overlay.style === 'card') {
    return (
      <AbsoluteFill style={{ backgroundColor: '#FBF7EE', justifyContent: 'center', alignItems: 'center', opacity: Math.min(1, pop * 1.5) }}>
        <div style={{ fontFamily: FONT, fontSize: 150, color: '#1F1E1C', textAlign: 'center', padding: '0 120px', lineHeight: 1.1, transform: `scale(${0.9 + 0.1 * pop})` }}>
          {overlay.text}
        </div>
      </AbsoluteFill>
    );
  }

  const label = overlay.style === 'label';
  return (
    <AbsoluteFill style={{ justifyContent: justify, alignItems: 'center', padding: '70px 80px' }}>
      <div
        style={{
          fontFamily: FONT,
          fontSize: label ? 68 : 140,
          color: label ? '#FFFFFF' : '#FFD400',
          backgroundColor: label ? 'rgba(20, 20, 20, 0.82)' : 'transparent',
          borderRadius: label ? 18 : 0,
          padding: label ? '14px 34px' : 0,
          WebkitTextStroke: label ? undefined : '10px #000',
          paintOrder: 'stroke fill',
          textAlign: 'center',
          lineHeight: 1.05,
          transform: `scale(${0.6 + 0.4 * pop})`
        }}
      >
        {overlay.text}
      </div>
    </AbsoluteFill>
  );
}

export function YouTubeComposition({ plan }) {
  const fps = Number(plan.fps ?? 30);
  const totalFrames = Math.max(1, Math.ceil(Number(plan.durationSeconds ?? 1) * fps));

  return (
    <AbsoluteFill style={{ backgroundColor: '#111' }}>
      <Audio src={staticFile(plan.audioFile)} />
      {plan.backgroundMusicFile && (
        <Audio
          src={staticFile(plan.backgroundMusicFile)}
          volume={Number(plan.backgroundMusicVolume ?? 0.08)}
          loop
        />
      )}
      {plan.images.map((image) => {
        const from = Math.max(0, Math.round(Number(image.startSeconds) * fps));
        const end = Math.max(from + 1, Math.round(Number(image.endSeconds) * fps));
        const durationInFrames = end - from;
        return (
          <Sequence key={image.imageNumber} from={from} durationInFrames={durationInFrames} premountFor={fps}>
            <Shot image={image} durationInFrames={durationInFrames} />
            {image.overlay?.text ? <Overlay overlay={image.overlay} /> : null}
          </Sequence>
        );
      })}
      {(plan.sounds ?? []).filter((sound) => sound.file).map((sound, index) => {
        const from = Math.max(0, Math.round(Number(sound.fromSeconds ?? 0) * fps));
        const durationInFrames = sound.durationSeconds
          ? Math.max(1, Math.round(Number(sound.durationSeconds) * fps))
          : Math.max(1, totalFrames - from);
        return (
          <Sequence key={`${sound.imageNumber ?? 'sfx'}-${index}`} from={from} durationInFrames={durationInFrames}>
            <Audio src={staticFile(sound.file)} volume={Number(sound.volume ?? 0.15)} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
