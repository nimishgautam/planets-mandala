import GUI, { type Controller } from 'lil-gui';
import type { AppState, Store } from '../app/store';
import { displayScale } from '../render/displayScale';
import type { Stage } from '../render/renderer';

export interface GuiHooks {
  onScaleChange(): void;
  getPickerSpeed(): number;
  setPickerSpeed(v: number): void;
}

/** Advanced / debug controls (lil-gui), collapsed by default. */
export function createAdvancedGui(store: Store, stage: Stage, hooks: GuiHooks): GUI {
  const gui = new GUI({ title: 'Settings' });
  gui.close();
  const proxy = { ...store.get() } as AppState;
  const ctrls: Controller[] = [];
  const bind = <K extends keyof AppState>(c: Controller, key: K, after?: (v: AppState[K]) => Partial<AppState>) => {
    c.onChange((v: AppState[K]) => store.set({ [key]: v, ...(after?.(v) ?? {}) } as Partial<AppState>));
    ctrls.push(c);
    return c;
  };

  const pat = gui.addFolder('Pattern');
  bind(pat.add(proxy, 'autoDuration').name('auto duration'), 'autoDuration');
  bind(pat.add(proxy, 'years', 0.001, 250, 0.001).name('years'), 'years', () => ({ autoDuration: false }));
  bind(pat.add(proxy, 'start').name('start (YYYY-MM-DD)'), 'start');
  bind(pat.add(proxy, 'closureTolerance', 0.001, 0.08, 0.001).name('closure tolerance'), 'closureTolerance');
  bind(pat.add(proxy, 'chords', 20, 4000, 10).name('tether chords'), 'chords');
  bind(pat.add(proxy, 'zScale', 0, 10, 0.1).name('out-of-plane ×'), 'zScale');

  const look = gui.addFolder('Look');
  bind(look.add(proxy, 'cycleSeconds', 5, 600, 1).name('seconds per cycle'), 'cycleSeconds');
  bind(look.add(proxy, 'fade', 0.005, 1, 0.005).name('fleeting trail'), 'fade');
  bind(look.add(proxy, 'intensity', 0.05, 3, 0.01).name('line intensity'), 'intensity');
  bind(look.add(proxy, 'hueCycles', 0, 12, 0.25).name('hue cycles'), 'hueCycles');
  const bloom = { strength: stage.bloom.strength, radius: stage.bloom.radius, autoRotate: true };
  look.add(bloom, 'strength', 0, 3, 0.01).name('bloom').onChange((v: number) => (stage.bloom.strength = v));
  look.add(bloom, 'radius', 0, 1, 0.01).name('bloom radius').onChange((v: number) => (stage.bloom.radius = v));
  look.add(bloom, 'autoRotate').name('slow drift').onChange((v: boolean) => (stage.controls.autoRotate = v));

  const snd = gui.addFolder('Sound');
  bind(snd.add(proxy, 'audio').name('sound on'), 'audio');
  bind(snd.add(proxy, 'shimmer').name('shimmer (true detune)'), 'shimmer');
  bind(snd.add(proxy, 'bells').name('approach bells'), 'bells');

  const sc = gui.addFolder('Picker scaling');
  const speed = { daysPerSecond: hooks.getPickerSpeed() };
  sc.add(speed, 'daysPerSecond', 0, 30, 0.05).name('days / second').onChange(hooks.setPickerSpeed);
  sc.add(displayScale, 'kDist', 10, 200, 1).name('planet distance k').onFinishChange(hooks.onScaleChange);
  sc.add(displayScale, 'distPow', 0.2, 1, 0.01).name('distance power').onFinishChange(hooks.onScaleChange);
  sc.add(displayScale, 'kRadius', 0.005, 0.2, 0.001).name('radius k').onFinishChange(hooks.onScaleChange);
  sc.add(displayScale, 'radiusPow', 0.2, 1, 0.01).name('radius power').onFinishChange(hooks.onScaleChange);
  sc.add(displayScale, 'sunMaxRadius', 1, 40, 0.5).name('sun max radius').onFinishChange(hooks.onScaleChange);
  sc.add(displayScale, 'moonBase', 1, 4, 0.05).name('moon base').onFinishChange(hooks.onScaleChange);
  sc.add(displayScale, 'kMoon', 0.1, 3, 0.05).name('moon spread').onFinishChange(hooks.onScaleChange);
  sc.close();

  store.subscribe((s) => {
    Object.assign(proxy, s);
    for (const c of ctrls) c.updateDisplay();
  });
  return gui;
}
