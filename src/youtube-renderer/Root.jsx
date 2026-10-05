import React from 'react';
import { Composition } from 'remotion';
import { YouTubeComposition } from './YouTubeComposition.jsx';

const emptyPlan = {
  fps: 30,
  width: 1920,
  height: 1080,
  durationSeconds: 1,
  audioFile: '',
  images: [],
  sounds: []
};

export const RemotionRoot = () => (
  <Composition
    id="YoutubeVideo"
    component={YouTubeComposition}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={30}
    defaultProps={{ plan: emptyPlan }}
    calculateMetadata={({ props }) => {
      const plan = props.plan ?? emptyPlan;
      const fps = Number(plan.fps ?? 30);
      return {
        fps,
        width: Number(plan.width ?? 1920),
        height: Number(plan.height ?? 1080),
        durationInFrames: Math.max(1, Math.ceil(Number(plan.durationSeconds ?? 1) * fps))
      };
    }}
  />
);
