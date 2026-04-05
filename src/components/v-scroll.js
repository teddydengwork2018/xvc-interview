const TEMPLATE = document.createElement('template');

TEMPLATE.innerHTML = `
  <style>
    :host {
      --cursor_scroll: url('/scroll.svg') 10 10, ns-resize;
      --cursor_grab: url('/grab.svg') 7 7, grabbing;
      --rail_hit_width: 14px;
      --track_width: 15px;
      --track_padding: 2px;
      display: block;
      position: relative;
    }

    .viewport {
      height: 100%;
      overflow: auto;
      scrollbar-width: none;
    }

    .viewport::-webkit-scrollbar {
      display: none;
    }

    .rail {
      position: absolute;
      top: 2px;
      right: 0px;
      bottom: 2px;
      width: var(--rail_hit_width);
      opacity: 0;
      cursor: var(--cursor_scroll);
      transition: opacity 0.35s linear
    }

    .track {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 6px;
      padding: 0;
      background: rgb(0 0 0 / 0%);
      box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0%);
      transition:
        width 0.22s ease,
        padding 0.22s ease,
        background 0.22s ease,
        box-shadow 0.22s ease;
    }

    .thumb {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      right: 0;
      width: 35%;
      border-radius: 999px;
      background: #c7c7c7;
      cursor: inherit;
      transition:
        background 0.2s,
        left 0.22s ease,
        right 0.22s ease;
    }

    :host([scrollable][active]) .rail,
    :host([dragging]) .rail,
    .rail:hover {
      opacity: 1;
    }

    :host([scrollable][active]) .track,
    :host([dragging]) .track,
    .rail:hover .track {
      width: var(--track_width);
      padding: 0 var(--track_padding);
      background: rgb(0 0 0 / 8%);
      box-shadow: inset 0 0 0 1px rgb(0 0 0 / 12%);
    }

    .rail:hover .thumb,
    :host([scrollable][active]) .thumb {
      background: #adadad;
    }

    :host([dragging]) .thumb {
      background: #8f8f8f;
      cursor: var(--cursor_grab);
    }

    :host([dragging]) .rail {
      cursor: var(--cursor_grab);
    }
  </style>

  <div class="viewport">
    <slot></slot>
  </div>

  <div class="rail">
    <div class="track">
      <div class="thumb"></div>
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
    this.track = shadow.querySelector('.track');
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

    this.viewport.addEventListener('scroll', this.onScroll);
    this.thumb.addEventListener('pointerdown', this.onThumbDown);
    this.rail.addEventListener('pointerenter', this.onRailEnter);
    this.rail.addEventListener('pointerleave', this.onRailLeave);
  }

  connectedCallback() {
    this.resize_observer.observe(this);
    this.resize_observer.observe(this.viewport);
    this.update();
  }

  disconnectedCallback() {
    this.resize_observer.disconnect();
    this.clearHideTimer();
    document.body.style.removeProperty('cursor');
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    this.rail.removeEventListener('pointerenter', this.onRailEnter);
    this.rail.removeEventListener('pointerleave', this.onRailLeave);
  }

  update() {
    const height = this.viewport.clientHeight;
    const scroll_height = this.viewport.scrollHeight;
    const top = this.viewport.scrollTop;

    if (scroll_height <= height) {
      this.removeAttribute('scrollable');
      this.removeAttribute('active');
      this.thumb.style.display = 'none';
      return;
    }

    this.setAttribute('scrollable', '');
    this.thumb.style.display = 'block';

    const thumb_height = Math.max((height / scroll_height) * height, 30);
    const max = height - thumb_height;
    const y = (top / (scroll_height - height)) * max;

    this.thumb.style.height = `${thumb_height}px`;
    this.thumb.style.transform = `translateX(-50%) translateY(${y}px)`;
  }
}

customElements.get('v-scroll') || customElements.define('v-scroll', VScroll);
