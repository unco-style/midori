import { PerspectiveCamera, DepthTexture } from 'three';
import { EffectPass, EffectConfig, EffectConfigs, BlurEffectConfig, BloomEffectConfig, RgbShiftEffectConfig, VignetteEffectConfig, VignetteBlurEffectConfig, GlitchEffectConfig } from './pipeline/effect-pass';
import { EffectType, IEffect, MotionBlurEffect } from './effects/effect';

export type BackgroundEffectConfig = EffectConfig | MotionBlurEffectConfig;

export interface MotionBlurEffectConfig {
  // the intensity of the blur.
  intensity?: number;
  // the number of samples for the blur - more samples result in better quality at the cost of performance.
  samples?: number;
}

export interface BackgroundEffectConfigs extends EffectConfigs {
  [EffectType.MotionBlur]?: MotionBlurEffectConfig;
}

class BackgroundEffects extends EffectPass {
  // properties cached for motion blur support
  private _camera: PerspectiveCamera;
  private _depthTexture: DepthTexture;

  /**
   * Constructs a BackgroundEffects object.
   * @param {number} width
   * @param {number} height
   * @param {PerspectiveCamera} camera - a camera for motion blur support
   * @param {DepthTexture} depthTexture - a depth texture for motion blur support
   */
  constructor(width: number, height: number, camera: PerspectiveCamera, depthTexture: DepthTexture) {
    super(width, height);
    this._camera = camera;
    this._depthTexture = depthTexture;
  }

  /**
   * Returns the configurations for the currently set effects.
   * @returns BackgroundEffectConfigs
   */
  getConfigs(): BackgroundEffectConfigs {
    const configs: BackgroundEffectConfigs = super.getConfigs()
    const motionBlurEffect = this._effects[EffectType.MotionBlur];

    if (motionBlurEffect) {
      const { intensity, samples } = motionBlurEffect.getUniforms();
      configs[EffectType.MotionBlur] = { intensity, samples };
    }

    return configs;
  }

  /**
   * Returns the current effect for the specified type.
   * If no effect is currently set for the type, creates a new effect for the type and returns it.
   * @param {EffectType} type
   * @param {EffectConfig} config
   * @returns IEffect
   */
  protected _getEffect(type: EffectType): IEffect {
    if (type === EffectType.MotionBlur && !(type in this._effects)) {
      this._effects[EffectType.MotionBlur] = new MotionBlurEffect(this._camera, this._depthTexture);
      return this._effects[EffectType.MotionBlur];
    }

    return super._getEffect(type);
  }

  /**
   * Sets an effect. If an effect is already set, updates the set effect.
   * @param {EffectType} type - the effect to set.
   * @param {Object} config - configuration specific to the effect specified.
   */
  set(type: EffectType.Blur, config: BlurEffectConfig)
  set(type: EffectType.Bloom, config: BloomEffectConfig)
  set(type: EffectType.RgbShift, config: RgbShiftEffectConfig)
  set(type: EffectType.Vignette, config: VignetteEffectConfig)
  set(type: EffectType.VignetteBlur, config: VignetteBlurEffectConfig)
  set(type: EffectType.MotionBlur, config: MotionBlurEffectConfig)
  set(type: EffectType.Glitch, config: GlitchEffectConfig)
  set(type: EffectType, config: BackgroundEffectConfig = {}) {
    if (type === EffectType.MotionBlur) {
      // enable this pass when there is at least one effect.
      this.enabled = true;

      const motionBlurEffect = this._getEffect(EffectType.MotionBlur);
      const { intensity = 1, samples = 32 } = config as MotionBlurEffectConfig;
      motionBlurEffect.updateUniforms({ intensity, samples });
    } else {
      super.set(type as any, config as any);
    }
  }
}

export {
  BackgroundEffects,
}

export default BackgroundEffects;
