import type { AppState, Store } from '../app/store';
import type { BodyRegistry } from '../bodies/registry';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export interface OverlayHooks {
  onGo(): void;
  onBack(): void;
  onSeek(u: number): void;
  onAudio(): void;
}

/** Binds the hand-made overlay (dropdowns, segmented buttons, transport). */
export class Overlay {
  private selA = $<HTMLSelectElement>('sel-a');
  private selB = $<HTMLSelectElement>('sel-b');
  private hint = $<HTMLParagraphElement>('hint');
  private play = $<HTMLButtonElement>('play');
  private scrub = $<HTMLInputElement>('scrub');
  private clock = $<HTMLSpanElement>('clock');
  private audioBtn = $<HTMLButtonElement>('audio');
  private scrubbing = false;
  /** which slot the next click in the 3D picker fills */
  pickSlot: 'a' | 'b' = 'a';

  constructor(private store: Store, private bodies: BodyRegistry, hooks: OverlayHooks) {
    const kindHint: Record<string, string> = { dwarf: ' — dwarf planet', asteroid: ' — asteroid', comet: ' — comet' };
    for (const sel of [this.selA, this.selB]) {
      for (const b of bodies.all()) {
        const o = document.createElement('option');
        o.value = b.id;
        o.textContent =' '.repeat(Math.max(0, b.depth - 1)) + (b.depth > 1 ? '◦ ' : '') + b.name + (kindHint[b.kind] ?? '');
        sel.appendChild(o);
      }
    }
    this.selA.addEventListener('change', () => this.choose('a', this.selA.value));
    this.selB.addEventListener('change', () => this.choose('b', this.selB.value));
    $('swap').addEventListener('click', () => {
      const s = store.get();
      store.set({ a: s.b, b: s.a });
    });

    document.querySelectorAll<HTMLDivElement>('.seg').forEach((seg) => {
      const key = seg.dataset.key as keyof AppState;
      seg.querySelectorAll<HTMLButtonElement>('button').forEach((btn) =>
        btn.addEventListener('click', () => store.set({ [key]: btn.dataset.value } as Partial<AppState>)),
      );
    });

    $('go').addEventListener('click', hooks.onGo);
    $('back').addEventListener('click', hooks.onBack);
    this.play.addEventListener('click', () => store.set({ playing: !store.get().playing }));
    this.audioBtn.addEventListener('click', hooks.onAudio);
    this.scrub.addEventListener('input', () => {
      this.scrubbing = true;
      hooks.onSeek(+this.scrub.value / 1000);
    });
    this.scrub.addEventListener('change', () => (this.scrubbing = false));

    window.addEventListener('keydown', (e) => {
      if ((e.target as HTMLElement).tagName === 'SELECT') return;
      if (e.code === 'Space' && store.get().view === 'pattern') {
        e.preventDefault();
        store.set({ playing: !store.get().playing });
      } else if (e.code === 'Escape' && store.get().view === 'pattern') hooks.onBack();
      else if (e.code === 'Enter' && store.get().view === 'picker') hooks.onGo();
    });

    store.subscribe((s) => this.render(s));
    this.render(store.get());
  }

  /** Assign a body to a slot; picking the other slot's body swaps them. */
  choose(slot: 'a' | 'b', id: string): void {
    const s = this.store.get();
    const other = slot === 'a' ? s.b : s.a;
    if (id === other) this.store.set({ a: s.b, b: s.a });
    else this.store.set({ [slot]: id });
  }

  /** Called by the 3D picker on click: alternate observer → target. */
  pickFromScene(id: string): void {
    this.choose(this.pickSlot, id);
    this.pickSlot = this.pickSlot === 'a' ? 'b' : 'a';
    this.render(this.store.get());
  }

  setFrameAvailable(ok: boolean): void {
    const btn = document.querySelector<HTMLButtonElement>('.seg[data-key="frame"] button[data-value="corotating"]')!;
    btn.disabled = !ok;
    btn.title = ok
      ? "Rotates so the observer's parent stays in one direction"
      : 'Needs an observer that orbits something (not the Sun)';
  }

  render(s: AppState): void {
    document.body.dataset.view = s.view;
    this.selA.value = s.a;
    this.selB.value = s.b;
    document.querySelectorAll<HTMLDivElement>('.seg').forEach((seg) => {
      const v = s[seg.dataset.key as keyof AppState];
      seg.querySelectorAll<HTMLButtonElement>('button').forEach((b) => b.classList.toggle('on', b.dataset.value === v));
    });
    this.play.textContent = s.playing ? '❚❚' : '▶';
    this.audioBtn.classList.toggle('on', s.audio);
    const nameA = this.bodies.get(s.a).name;
    const nameB = this.bodies.get(s.b).name;
    this.hint.innerHTML =
      this.pickSlot === 'a'
        ? `Click a body to set the <b class="a">observer</b>. Currently <b class="a">${nameA}</b> → <b class="b">${nameB}</b>.`
        : `Now click the <b class="b">target</b> — the body whose dance you want to see from <b class="a">${nameA}</b>.`;
  }

  setTransport(u: number, clockText: string): void {
    if (!this.scrubbing) this.scrub.value = String(Math.round(u * 1000));
    this.clock.textContent = clockText;
  }

  setSoundCaption(text: string): void {
    $('caption-sound').textContent = text;
  }

  setCaption(title: string, sub: string): void {
    $('caption-title').textContent = title;
    $('caption-sub').textContent = sub;
  }
}
