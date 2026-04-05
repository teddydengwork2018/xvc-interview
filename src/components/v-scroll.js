const TEMPLATE = document.createElement('template');

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
    this.start_scroll = 0;
    this.hide_timer = 0;
    this.resize_observer = new ResizeObserver(()=>this.update());

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

      const delta = event.clientY - this.start_y;
      const scale = this.viewport.scrollHeight / this.viewport.clientHeight;

      this.viewport.scrollTop = this.start_scroll + delta * scale;
    };
    this.onUp = ()=> {
      this.dragging = false;
      this.removeAttribute('dragging');
      document.body.style.removeProperty('cursor');
      this.scheduleHide();
      window.removeEventListener('pointermove', this.onMove);
      window.removeEventListener('pointerup', this.onUp);
    };
    this.onThumbDown = (event)=> {
      this.dragging = true;
      this.setAttribute('dragging', '');
      this.showRail();
      this.clearHideTimer();
      document.body.style.cursor = `url('/grab.svg') 7 7, grabbing`;
      this.start_y = event.clientY;
      this.start_scroll = this.viewport.scrollTop;
      this.thumb.setPointerCapture?.(event.pointerId);
      window.addEventListener('pointermove', this.onMove);
      window.addEventListener('pointerup', this.onUp);
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
    this.unbindEvents();
  }

  update() {
    const height = this.viewport.clientHeight;
    const scroll_height = this.viewport.scrollHeight;
    const top = this.viewport.scrollTop;

    if (scroll_height <= height) {
      this.removeAttribute('scrollable');
      this.removeAttribute('active');
      this.thumb.style.setProperty('--thumb_display', 'none');
      return;
    }

    this.setAttribute('scrollable', '');
    this.thumb.style.setProperty('--thumb_display', 'block');

    const thumb_height = Math.max((height / scroll_height) * height, 30);
    const max = height - thumb_height;
    const y = (top / (scroll_height - height)) * max;

    this.thumb.style.setProperty('--thumb_height', `${thumb_height}px`);
    this.thumb.style.setProperty('--thumb_y', `${y}px`);
  }
}

customElements.get('v-scroll') || customElements.define('v-scroll', VScroll);
