(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))s(t);new MutationObserver(t=>{for(const i of t)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function r(t){const i={};return t.integrity&&(i.integrity=t.integrity),t.referrerPolicy&&(i.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?i.credentials="include":t.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(t){if(t.ep)return;t.ep=!0;const i=r(t);fetch(t.href,i)}})();const n=document.createElement("template");n.innerHTML=`
  <style>
    :host {
      --cursor_scroll: url('/scroll.svg') 10 10, ns-resize;
      --cursor_grab: url('/grab.svg') 7 7, grabbing;
      --rail_hit_width: 14px;
      --track_width: 10px;
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
      right: 2px;
      bottom: 2px;
      width: var(--rail_hit_width);
      opacity: 0;
      cursor: var(--cursor_scroll);
      transition: opacity 0.28s ease;
    }

    .track {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 6px;
      padding: 0;
      border-radius: 999px;
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
      left: 0;
      right: 0;
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
`;class l extends HTMLElement{constructor(){super();const e=this.attachShadow({mode:"open"});e.append(n.content.cloneNode(!0)),this.viewport=e.querySelector(".viewport"),this.thumb=e.querySelector(".thumb"),this.rail=e.querySelector(".rail"),this.track=e.querySelector(".track"),this.dragging=!1,this.start_y=0,this.start_scroll=0,this.hide_timer=0,this.resize_observer=new ResizeObserver(()=>this.update()),this.clearHideTimer=()=>{clearTimeout(this.hide_timer),this.hide_timer=0},this.showRail=()=>{this.setAttribute("active","")},this.hideRail=()=>{this.dragging||this.rail.matches(":hover")||this.removeAttribute("active")},this.scheduleHide=()=>{this.clearHideTimer(),this.hide_timer=window.setTimeout(()=>this.hideRail(),700)},this.onScroll=()=>{this.update(),this.showRail(),this.scheduleHide()},this.onMove=r=>{if(!this.dragging)return;const s=r.clientY-this.start_y,t=this.viewport.scrollHeight/this.viewport.clientHeight;this.viewport.scrollTop=this.start_scroll+s*t},this.onUp=()=>{this.dragging=!1,this.removeAttribute("dragging"),document.body.style.removeProperty("cursor"),this.scheduleHide(),window.removeEventListener("pointermove",this.onMove),window.removeEventListener("pointerup",this.onUp)},this.onThumbDown=r=>{this.dragging=!0,this.setAttribute("dragging",""),this.showRail(),this.clearHideTimer(),document.body.style.cursor="url('/grab.svg') 7 7, grabbing",this.start_y=r.clientY,this.start_scroll=this.viewport.scrollTop,this.thumb.setPointerCapture?.(r.pointerId),window.addEventListener("pointermove",this.onMove),window.addEventListener("pointerup",this.onUp)},this.onRailEnter=()=>{this.showRail(),this.clearHideTimer()},this.onRailLeave=()=>{this.scheduleHide()},this.viewport.addEventListener("scroll",this.onScroll),this.thumb.addEventListener("pointerdown",this.onThumbDown),this.rail.addEventListener("pointerenter",this.onRailEnter),this.rail.addEventListener("pointerleave",this.onRailLeave)}connectedCallback(){this.resize_observer.observe(this),this.resize_observer.observe(this.viewport),this.update()}disconnectedCallback(){this.resize_observer.disconnect(),this.clearHideTimer(),document.body.style.removeProperty("cursor"),window.removeEventListener("pointermove",this.onMove),window.removeEventListener("pointerup",this.onUp),this.rail.removeEventListener("pointerenter",this.onRailEnter),this.rail.removeEventListener("pointerleave",this.onRailLeave)}update(){const e=this.viewport.clientHeight,r=this.viewport.scrollHeight,s=this.viewport.scrollTop;if(r<=e){this.removeAttribute("scrollable"),this.removeAttribute("active"),this.thumb.style.display="none";return}this.setAttribute("scrollable",""),this.thumb.style.display="block";const t=Math.max(e/r*e,30),i=e-t,o=s/(r-e)*i;this.thumb.style.height=`${t}px`,this.thumb.style.transform=`translateY(${o}px)`}}customElements.get("v-scroll")||customElements.define("v-scroll",l);
