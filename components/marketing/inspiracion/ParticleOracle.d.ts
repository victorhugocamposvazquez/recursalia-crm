import type { CSSProperties, ForwardRefExoticComponent, RefAttributes } from 'react';

export type ParticleOracleColors = Partial<{
  lime: string;
  limeDeep: string;
  limeShadow: string;
  limeGlow: string;
  specular: string;
}>;

export type ParticleOracleProps = {
  size?: number;
  bodyCount?: number;
  haloCount?: number;
  thinking?: boolean;
  thinkingDuration?: number;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  colors?: ParticleOracleColors;
};

export type ParticleOracleHandle = {
  pulse: () => void;
  isThinking: () => boolean;
};

declare const ParticleOracle: ForwardRefExoticComponent<
  ParticleOracleProps & RefAttributes<ParticleOracleHandle>
>;

export default ParticleOracle;
