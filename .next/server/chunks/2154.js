"use strict";exports.id=2154,exports.ids=[2154],exports.modules={2154:(e,t,i)=>{i.d(t,{D7:()=>initializeTheme,KV:()=>preloadThemeAssets,XY:()=>addThemeTransitionStyles,gz:()=>getCurrentTheme,hJ:()=>optimizedThemeSwitch,ub:()=>r});let n=!1,o=null;function optimizedThemeSwitch(e,t){"undefined"!=typeof document&&(n&&o&&clearTimeout(o),n=!0,document.body.classList.add("theme-transitioning"),requestAnimationFrame(()=>{["dark","dark-blue","pink","yellow","green"].forEach(e=>{document.documentElement.classList.remove(e)}),"light"!==e&&document.documentElement.classList.add(e);try{localStorage.setItem("theme",e)}catch(e){console.warn("Failed to save theme preference:",e)}o=setTimeout(()=>{document.body.classList.remove("theme-transitioning"),n=!1,t&&t(e)},300)}))}function preloadThemeAssets(e){if("undefined"==typeof document)return;let t=document.createElement("div");t.style.position="absolute",t.style.top="-9999px",t.style.left="-9999px",t.style.width="1px",t.style.height="1px",t.style.opacity="0",t.style.pointerEvents="none",e.forEach(e=>{let i=document.createElement("div");i.className=e.id,i.style.background="var(--bg-gradient-start)",i.style.color="var(--primary)",i.style.borderColor="var(--theme-primary)",t.appendChild(i)}),document.body.appendChild(t),setTimeout(()=>{t.parentNode&&t.parentNode.removeChild(t)},1e3)}function getCurrentTheme(e="light"){return e}function initializeTheme(e){"undefined"!=typeof document&&(["dark","dark-blue","pink","yellow","green"].forEach(e=>{document.documentElement.classList.remove(e)}),"light"!==e&&document.documentElement.classList.add(e))}function addThemeTransitionStyles(){if("undefined"==typeof document||document.getElementById("theme-transition-styles"))return;let e=document.createElement("style");e.id="theme-transition-styles",e.textContent=`
    /* Theme transition optimization */
    .theme-transitioning * {
      transition: 
        background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        backdrop-filter 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    
    /* Prevent layout shifts during theme transitions */
    .theme-transitioning {
      overflow-x: hidden;
    }
    
    /* Optimize specific elements for theme switching */
    .theme-transitioning .card,
    .theme-transitioning .btn,
    .theme-transitioning .glass,
    .theme-transitioning .chat-box,
    .theme-transitioning .classroom-card {
      will-change: background-color, border-color, box-shadow;
    }
    
    /* Reduce motion for users who prefer it */
    @media (prefers-reduced-motion: reduce) {
      .theme-transitioning * {
        transition-duration: 0.1s !important;
      }
    }
  `,document.head.appendChild(e)}let r=new class{constructor(){this.metrics={switchCount:0,averageSwitchTime:0,totalSwitchTime:0}}startMeasure(){this.startTime=performance.now()}endMeasure(){if(!this.startTime)return;let e=performance.now()-this.startTime;return this.metrics.switchCount++,this.metrics.totalSwitchTime+=e,this.metrics.averageSwitchTime=this.metrics.totalSwitchTime/this.metrics.switchCount,e>100&&console.warn(`Slow theme switch detected: ${e.toFixed(2)}ms`),this.startTime=null,e}getMetrics(){return{...this.metrics}}reset(){this.metrics={switchCount:0,averageSwitchTime:0,totalSwitchTime:0}}}}};