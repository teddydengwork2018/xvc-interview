import fallback_css_text from '/src/styles/v-scroll.css?inline';

const TEMPLATE = document.createElement('template');
const STYLE_ID = 'v-scroll-theme-style';
const SCROLL_CURSOR_URL = new URL('./scroll.svg', document.baseURI).href;
const GRAB_CURSOR_URL = new URL('./grab.svg', document.baseURI).href;
let theme_css_promise = null;

const loadThemeCss = async()=> {
  try {
    const theme_module = await import('$/v-scroll.js');

    return theme_module.default || fallback_css_text;
  } catch {
    return fallback_css_text;
  }
};

const ensureThemeStyle = async()=> {
  theme_css_promise ||= loadThemeCss();

  const css_text = await theme_css_promise;
  const style = document.getElementById(STYLE_ID);

  if (style) {
    if (style.textContent !== css_text) {
      style.textContent = css_text;
    }

    return;
  }

  const next_style = document.createElement('style');

  next_style.id = STYLE_ID;
  next_style.textContent = css_text;
  document.head.append(next_style);
};

TEMPLATE.innerHTML = `
  <div class="viewport" part="viewport">
    <slot></slot>
  </div>

  <div class="rail" part="rail">
    <div class="track" part="track">
      <div class="thumb" part="thumb"></div>
    </div>
  </div>
`;

class VScroll extends HTMLElement {
  constructor() {
    super();

    ensureThemeStyle();
    this.style.setProperty('--v-scroll-cursor', `url('${SCROLL_CURSOR_URL}') 10 10, ns-resize`);
    this.style.setProperty('--v-scroll-cursor-grab', `url('${GRAB_CURSOR_URL}') 7 7, grabbing`);

    const shadow = this.attachShadow({ mode: 'open' });

    shadow.append(TEMPLATE.content.cloneNode(true));

    this.viewport = shadow.querySelector('.viewport');
    this.thumb = shadow.querySelector('.thumb');
    this.rail = shadow.querySelector('.rail');
    this.destroyed = false;
    this.bound = false;
    this.observing = false;
    this.dragging = false;
    this.start_y = 0;
    this.start_top = 0;
    this.hide_timer = 0;
    this.resize_observer = new ResizeObserver(()=>this.update());

    this.getNumberVar = (name, fallback = 0)=> {
      const value = getComputedStyle(this).getPropertyValue(name).trim();
      const number = Number.parseFloat(value);

      return Number.isNaN(number) ? fallback : number;
    };
    this.getMetrics = ()=> {
      const height = this.viewport.clientHeight;
      const scroll_height = this.viewport.scrollHeight;
      const inset = this.getNumberVar('--v-scroll-thumb-inset', 3);
      const min_height = this.getNumberVar('--v-scroll-min-bar', 30);
      const available = Math.max(height - inset * 2, 0);
      const thumb_height = Math.min(Math.max((height / scroll_height) * available, min_height), available);
      const max_top = Math.max(available - thumb_height, 0);

      return { height, scroll_height, inset, thumb_height, max_top };
    };
    this.clearHideTimer = ()=> {
      clearTimeout(this.hide_timer);
      this.hide_timer = 0;
    };
    this.showRail = ()=> {
      this.setAttribute('active', '');
    };
    this.hideRail = ()=> {
      if (this.dragging || this.rail.matches(':hover')) {
        return;
      }

      this.removeAttribute('active');
    };
    this.scheduleHide = ()=> {
      this.clearHideTimer();
      this.hide_timer = window.setTimeout(()=>this.hideRail(), 700);
    };
    this.onScroll = ()=> {
      this.update();
      this.showRail();
      this.scheduleHide();
    };
    this.onMove = (event)=> {
      if (!this.dragging) {
        return;
      }

      const { scroll_height, height, max_top } = this.getMetrics();
      const delta = event.clientY - this.start_y;
      const next_top = Math.min(Math.max(this.start_top + delta, 0), max_top);
      const ratio = max_top > 0 ? next_top / max_top : 0;
      const max_scroll = Math.max(scroll_height - height, 0);

      this.viewport.scrollTop = ratio * max_scroll;
    };
    this.onUp = ()=> {
      this.dragging = false;
      this.removeAttribute('dragging');
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
      this.scheduleHide();
      window.removeEventListener('pointermove', this.onMove);
      window.removeEventListener('pointerup', this.onUp);
      window.removeEventListener('pointercancel', this.onUp);
    };
    this.onThumbDown = (event)=> {
      event.preventDefault();

      const { inset, thumb_height, max_top, scroll_height, height } = this.getMetrics();
      const max_scroll = Math.max(scroll_height - height, 0);
      const ratio = max_scroll > 0 ? this.viewport.scrollTop / max_scroll : 0;

      this.dragging = true;
      this.setAttribute('dragging', '');
      this.showRail();
      this.clearHideTimer();
      document.body.style.cursor = `url('/grab.svg') 7 7, grabbing`;
      document.body.style.userSelect = 'none';
      this.start_y = event.clientY;
      this.start_top = Math.min(Math.max(ratio * max_top, 0), max_top);
      this.thumb.style.setProperty('--thumb_y', `${this.start_top + inset}px`);
      this.thumb.style.setProperty('--thumb_height', `${thumb_height}px`);
      this.thumb.setPointerCapture?.(event.pointerId);
      window.addEventListener('pointermove', this.onMove);
      window.addEventListener('pointerup', this.onUp);
      window.addEventListener('pointercancel', this.onUp);
    };
    this.onRailEnter = ()=> {
      this.showRail();
      this.clearHideTimer();
    };
    this.onRailLeave = ()=> {
      this.scheduleHide();
    };
  }

  connectedCallback() {
    this.destroyed = false;
    this.bindEvents();
    this.startObserving();
    this.update();
  }

  disconnectedCallback() {
    this.destroy();
  }

  bindEvents() {
    if (this.bound) {
      return;
    }

    this.viewport.addEventListener('scroll', this.onScroll);
    this.thumb.addEventListener('pointerdown', this.onThumbDown);
    this.rail.addEventListener('pointerenter', this.onRailEnter);
    this.rail.addEventListener('pointerleave', this.onRailLeave);
    this.bound = true;
  }

  unbindEvents() {
    if (!this.bound) {
      return;
    }

    this.viewport.removeEventListener('scroll', this.onScroll);
    this.thumb.removeEventListener('pointerdown', this.onThumbDown);
    this.rail.removeEventListener('pointerenter', this.onRailEnter);
    this.rail.removeEventListener('pointerleave', this.onRailLeave);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    this.bound = false;
  }

  startObserving() {
    if (this.observing) {
      return;
    }

    this.resize_observer.observe(this);
    this.resize_observer.observe(this.viewport);
    this.observing = true;
  }

  stopObserving() {
    if (!this.observing) {
      return;
    }

    this.resize_observer.disconnect();
    this.observing = false;
  }

  destroy() {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    this.dragging = false;
    this.removeAttribute('dragging');
    this.removeAttribute('active');
    this.stopObserving();
    this.clearHideTimer();
    document.body.style.removeProperty('cursor');
    document.body.style.removeProperty('user-select');
    this.unbindEvents();
  }

  update() {
    const { height, scroll_height, inset, thumb_height, max_top } = this.getMetrics();
    const top = this.viewport.scrollTop;

    if (scroll_height <= height) {
      this.removeAttribute('scrollable');
      this.removeAttribute('active');
      this.thumb.style.setProperty('--thumb_display', 'none');
      return;
    }

    this.setAttribute('scrollable', '');
    this.thumb.style.setProperty('--thumb_display', 'block');

    const max_scroll = Math.max(scroll_height - height, 0);
    const ratio = max_scroll > 0 ? top / max_scroll : 0;
    const y = inset + ratio * max_top;

    this.thumb.style.setProperty('--thumb_height', `${thumb_height}px`);
    this.thumb.style.setProperty('--thumb_y', `${y}px`);
  }
}

customElements.get('v-scroll') || customElements.define('v-scroll', VScroll);
