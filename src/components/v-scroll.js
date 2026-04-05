const TEMPLATE = document.createElement('template');

TEMPLATE.innerHTML = `
  <style>
    :host {
      --cursor_scroll: url('/scroll.svg') 10 10, ns-resize;
      --cursor_grab: url('/grab.svg') 7 7, grabbing;
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
      right: 2px;
      bottom: 2px;
      width: 10px;
      cursor: var(--cursor_scroll);
    }

    .thumb {
      position: absolute;
      width: 100%;
      border-radius: 999px;
      background: #00ff00;
      cursor: inherit;
      transition: background 0.2s;
    }

    .rail:hover .thumb {
      background: #00cc00;
    }

    :host([dragging]) .thumb {
      background: #009900;
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
    <div class="thumb"></div>
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
    this.dragging = false;
    this.start_y = 0;
    this.start_scroll = 0;
    this.resize_observer = new ResizeObserver(()=>this.update());

    this.onScroll = ()=>this.update();
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
      window.removeEventListener('pointermove', this.onMove);
      window.removeEventListener('pointerup', this.onUp);
    };
    this.onThumbDown = (event)=> {
      this.dragging = true;
      this.setAttribute('dragging', '');
      document.body.style.cursor = `url('/grab.svg') 7 7, grabbing`;
      this.start_y = event.clientY;
      this.start_scroll = this.viewport.scrollTop;
      this.thumb.setPointerCapture?.(event.pointerId);
      window.addEventListener('pointermove', this.onMove);
      window.addEventListener('pointerup', this.onUp);
    };

    this.viewport.addEventListener('scroll', this.onScroll);
    this.thumb.addEventListener('pointerdown', this.onThumbDown);
  }

  connectedCallback() {
    this.resize_observer.observe(this);
    this.resize_observer.observe(this.viewport);
    this.update();
  }

  disconnectedCallback() {
    this.resize_observer.disconnect();
    document.body.style.removeProperty('cursor');
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
  }

  update() {
    const height = this.viewport.clientHeight;
    const scroll_height = this.viewport.scrollHeight;
    const top = this.viewport.scrollTop;

    if (scroll_height <= height) {
      this.thumb.style.display = 'none';
      return;
    }

    this.thumb.style.display = 'block';

    const thumb_height = Math.max((height / scroll_height) * height, 30);
    const max = height - thumb_height;
    const y = (top / (scroll_height - height)) * max;

    this.thumb.style.height = `${thumb_height}px`;
    this.thumb.style.transform = `translateY(${y}px)`;
  }
}

customElements.get('v-scroll') || customElements.define('v-scroll', VScroll);
