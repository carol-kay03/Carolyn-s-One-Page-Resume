(() => {
  function setup() {
    const slide = document.getElementById('image-trail-slide');
    const background = slide?.slideBackgroundContentElement;
    const sources = window.mouseTrailImages || [];
    if (!background || !sources.length) return;

    const layer = document.createElement('div');
    layer.className = 'mouse-image-trail';
    layer.setAttribute('aria-hidden', 'true');
    background.append(layer);
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const images = sources.map(src => {
      const image = new Image();
      image.src = src;
      image.decoding = 'async';
      return image;
    });
    let index = 0;
    let lastPoint = null;
    let lastTime = 0;

    function reset() {
      lastPoint = null;
      lastTime = 0;
      layer.replaceChildren();
    }

    function show(event, force = false) {
      if (Reveal.getCurrentSlide() !== slide || Reveal.isOverview()) return;
      if (!force && (event.pointerType === 'touch' || reducedMotion.matches)) return;
      const rect = layer.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (!rect.width || x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      const now = performance.now();
      if (!force && lastPoint &&
          (Math.hypot(x - lastPoint.x, y - lastPoint.y) < 80 || now - lastTime < 50)) return;
      // Skip unavailable images rather than showing a broken or blank card.
      let source;
      for (let attempt = 0; attempt < images.length; attempt++) {
        const candidate = images[index++ % images.length];
        if (candidate.complete && candidate.naturalWidth) { source = candidate; break; }
      }
      if (!source) return;
      lastPoint = { x, y };
      lastTime = now;
      const image = source.cloneNode();
      image.alt = '';
      image.draggable = false;
      // Fit the original aspect ratio, without enlarging small source images.
      const scale = Math.min(1, rect.width * 0.48 / source.naturalWidth,
        rect.height * 0.62 / source.naturalHeight);
      const width = source.naturalWidth * scale;
      const height = source.naturalHeight * scale;
      const left = Math.max(0, Math.min(rect.width - width, x - width / 2));
      const top = Math.max(0, Math.min(rect.height - height, y - height / 2));
      Object.assign(image.style, {
        width: `${width / rect.width * 100}%`,
        height: `${height / rect.height * 100}%`,
        left: `${left / rect.width * 100}%`,
        top: `${top / rect.height * 100}%`
      });
      layer.append(image);
      while (layer.children.length > 8) layer.firstElementChild.remove();
    }
    window.addEventListener('pointermove', event => show(event), { passive: true });
    // Tap support also offers a motion-free alternative for reduced-motion users.
    window.addEventListener('pointerdown', event => show(event, true), { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { lastPoint = null; });
    Reveal.on('slidechanged', reset);
    Reveal.on('overviewshown', reset);
    window.addEventListener('resize', reset);
  }
  if (Reveal.isReady()) setup();
  else Reveal.on('ready', setup);
})();
