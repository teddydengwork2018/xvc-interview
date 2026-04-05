(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))s(t);new MutationObserver(t=>{for(const r of t)if(r.type==="childList")for(const i of r.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&s(i)}).observe(document,{childList:!0,subtree:!0});function o(t){const r={};return t.integrity&&(r.integrity=t.integrity),t.referrerPolicy&&(r.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?r.credentials="include":t.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(t){if(t.ep)return;t.ep=!0;const r=o(t);fetch(t.href,r)}})();const n=document.createElement("template");n.innerHTML=`
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
`;class c extends HTMLElement{constructor(){super();const e=this.attachShadow({mode:"open"});e.append(n.content.cloneNode(!0)),this.viewport=e.querySelector(".viewport"),this.thumb=e.querySelector(".thumb"),this.rail=e.querySelector(".rail"),this.dragging=!1,this.start_y=0,this.start_scroll=0,this.resize_observer=new ResizeObserver(()=>this.update()),this.onScroll=()=>this.update(),this.onMove=o=>{if(!this.dragging)return;const s=o.clientY-this.start_y,t=this.viewport.scrollHeight/this.viewport.clientHeight;this.viewport.scrollTop=this.start_scroll+s*t},this.onUp=()=>{this.dragging=!1,this.removeAttribute("dragging"),document.body.style.removeProperty("cursor"),window.removeEventListener("pointermove",this.onMove),window.removeEventListener("pointerup",this.onUp)},this.onThumbDown=o=>{this.dragging=!0,this.setAttribute("dragging",""),document.body.style.cursor="url('/grab.svg') 7 7, grabbing",this.start_y=o.clientY,this.start_scroll=this.viewport.scrollTop,this.thumb.setPointerCapture?.(o.pointerId),window.addEventListener("pointermove",this.onMove),window.addEventListener("pointerup",this.onUp)},this.viewport.addEventListener("scroll",this.onScroll),this.thumb.addEventListener("pointerdown",this.onThumbDown)}connectedCallback(){this.resize_observer.observe(this),this.resize_observer.observe(this.viewport),this.update()}disconnectedCallback(){this.resize_observer.disconnect(),document.body.style.removeProperty("cursor"),window.removeEventListener("pointermove",this.onMove),window.removeEventListener("pointerup",this.onUp)}update(){const e=this.viewport.clientHeight,o=this.viewport.scrollHeight,s=this.viewport.scrollTop;if(o<=e){this.thumb.style.display="none";return}this.thumb.style.display="block";const t=Math.max(e/o*e,30),r=e-t,i=s/(o-e)*r;this.thumb.style.height=`${t}px`,this.thumb.style.transform=`translateY(${i}px)`}}customElements.get("v-scroll")||customElements.define("v-scroll",c);
