import { EQ_FREQUENCIES, NORMALIZER_SETTINGS } from './dspPresets';

export class AudioGraph {
  private ctx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private normalizerNode: DynamicsCompressorNode | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  private isEqEnabled: boolean = true;
  private currentBands: number[] = new Array(EQ_FREQUENCIES.length).fill(0);
  private isNormalizationEnabled: boolean = true;
  private currentVolume: number = 0.8;

  constructor() {
    // AudioContext will be initialized on user gesture
  }

  public init(mediaElement: HTMLAudioElement): void {
    if (this.ctx) return;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // 1. Source Node
    this.sourceNode = this.ctx.createMediaElementSource(mediaElement);

    // 2. 10-Band BiquadFilter EQ
    this.eqFilters = EQ_FREQUENCIES.map((freq, index) => {
      if (!this.ctx) throw new Error('AudioContext missing');
      const filter = this.ctx.createBiquadFilter();
      filter.frequency.value = freq;

      if (index === 0) {
        filter.type = 'lowshelf';
      } else if (index === EQ_FREQUENCIES.length - 1) {
        filter.type = 'highshelf';
      } else {
        filter.type = 'peaking';
        filter.Q.value = 1.4;
      }

      filter.gain.value = this.isEqEnabled ? (this.currentBands[index] || 0) : 0;
      return filter;
    });

    // 3. Normalizer (DynamicsCompressorNode: -14 LUFS target baseline)
    this.normalizerNode = this.ctx.createDynamicsCompressor();
    this.applyNormalizerSettings(this.isNormalizationEnabled);

    // 4. Master Gain Node (Volume & Crossfade)
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);

    // 5. Analyser for visualizer micro-interactions
    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 64;
    this.analyserNode.smoothingTimeConstant = 0.8;

    // Connect Graph:
    // Source -> Filter[0] -> Filter[1] -> ... -> Filter[9] -> Compressor -> Gain -> Analyser -> Destination
    let previousNode: AudioNode = this.sourceNode;

    for (const filter of this.eqFilters) {
      previousNode.connect(filter);
      previousNode = filter;
    }

    previousNode.connect(this.normalizerNode);
    this.normalizerNode.connect(this.gainNode);
    this.gainNode.connect(this.analyserNode);
    this.analyserNode.connect(this.ctx.destination);
  }

  public async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public setVolume(volume: number, rampMs: number = 50): void {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (!this.gainNode || !this.ctx) return;

    const targetTime = this.ctx.currentTime + rampMs / 1000;
    this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(this.currentVolume, targetTime);
  }

  public setEqEnabled(enabled: boolean): void {
    this.isEqEnabled = enabled;
    if (!this.ctx) return;

    this.eqFilters.forEach((filter, index) => {
      const targetGain = enabled ? (this.currentBands[index] || 0) : 0;
      filter.gain.setTargetAtTime(targetGain, this.ctx!.currentTime, 0.05);
    });
  }

  public setBands(bands: number[]): void {
    this.currentBands = [...bands];
    if (!this.ctx) return;

    this.eqFilters.forEach((filter, index) => {
      const targetGain = this.isEqEnabled ? (bands[index] ?? 0) : 0;
      filter.gain.setTargetAtTime(targetGain, this.ctx!.currentTime, 0.05);
    });
  }

  public setBandGain(index: number, gainDb: number): void {
    if (index < 0 || index >= this.eqFilters.length) return;
    this.currentBands[index] = gainDb;
    if (!this.ctx) return;

    if (this.isEqEnabled) {
      this.eqFilters[index].gain.setTargetAtTime(gainDb, this.ctx.currentTime, 0.05);
    }
  }

  public setNormalization(enabled: boolean): void {
    this.isNormalizationEnabled = enabled;
    this.applyNormalizerSettings(enabled);
  }

  private applyNormalizerSettings(enabled: boolean): void {
    if (!this.normalizerNode || !this.ctx) return;
    const now = this.ctx.currentTime;

    if (enabled) {
      this.normalizerNode.threshold.setTargetAtTime(NORMALIZER_SETTINGS.threshold, now, 0.05);
      this.normalizerNode.knee.setTargetAtTime(NORMALIZER_SETTINGS.knee, now, 0.05);
      this.normalizerNode.ratio.setTargetAtTime(NORMALIZER_SETTINGS.ratio, now, 0.05);
      this.normalizerNode.attack.setTargetAtTime(NORMALIZER_SETTINGS.attack, now, 0.05);
      this.normalizerNode.release.setTargetAtTime(NORMALIZER_SETTINGS.release, now, 0.05);
    } else {
      // Linear bypass mode
      this.normalizerNode.threshold.setTargetAtTime(0, now, 0.05);
      this.normalizerNode.ratio.setTargetAtTime(1, now, 0.05);
    }
  }

  public fadeOut(durationSeconds: number): Promise<void> {
    return new Promise((resolve) => {
      if (!this.gainNode || !this.ctx || durationSeconds <= 0) {
        resolve();
        return;
      }
      const now = this.ctx.currentTime;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
      this.gainNode.gain.linearRampToValueAtTime(0.001, now + durationSeconds);
      setTimeout(resolve, durationSeconds * 1000);
    });
  }

  public fadeIn(durationSeconds: number): Promise<void> {
    return new Promise((resolve) => {
      if (!this.gainNode || !this.ctx || durationSeconds <= 0) {
        if (this.gainNode) this.gainNode.gain.value = this.currentVolume;
        resolve();
        return;
      }
      const now = this.ctx.currentTime;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(0.001, now);
      this.gainNode.gain.linearRampToValueAtTime(this.currentVolume, now + durationSeconds);
      setTimeout(resolve, durationSeconds * 1000);
    });
  }

  public getVisualizerData(dataArray: Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(dataArray as any);
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }
}
