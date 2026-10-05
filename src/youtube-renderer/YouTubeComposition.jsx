import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';

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
          transformOrigin: 'center center'
        }}
      />
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
            <Shot image={image} durationInFrames={durationInFrames} />
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
