/* ==========================================================================
   Sony WH-1000XM6 Landing Page Scroll-linked Animation Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- Constants and State ---
  const TOTAL_FRAMES = 240;
  const imageFolder = 'ezgif-63be88cbbd9455f6-jpg.js';
  const preprocessedCanvases = [];
  let loadedCount = 0;
  
  // Smooth scroll interpolation variables
  let targetProgress = 0;
  let currentProgress = 0;
  const lerpFactor = 0.08; // Physics easing: lower means smoother/buttery, higher means faster
  
  // --- DOM Elements ---
  const loader = document.getElementById('loader');
  const loaderBar = document.getElementById('loader-bar');
  const loaderStatus = document.getElementById('loader-status');
  const navbar = document.getElementById('navbar');
  const canvas = document.getElementById('product-canvas');
  const ctx = canvas.getContext('2d');
  const scrollContainer = document.getElementById('scrolly-container');
  const scrollProgressFill = document.getElementById('scroll-progress-indicator');
  
  const beats = [
    { element: document.getElementById('beat-hero'), start: 0.0, end: 0.15 },
    { element: document.getElementById('beat-engineering'), start: 0.15, end: 0.42 },
    { element: document.getElementById('beat-anc'), start: 0.42, end: 0.68 },
    { element: document.getElementById('beat-sound'), start: 0.68, end: 0.88 },
    { element: document.getElementById('beat-reassembly'), start: 0.88, end: 1.0 }
  ];
  
  const dotElements = document.querySelectorAll('.scroll-dot');

  // --- Status messages for loader ---
  const statusMessages = [
    "Initializing neural core...",
    "Scanning auditory chassis...",
    "Extracting carbon fiber driver rings...",
    "Calibrating active mic sensors...",
    "Decoding acoustic void matrices...",
    "Assembling electrostatic sub-assemblies...",
    "Tuning 40mm LCP liquid crystal layers...",
    "Syncing DSEE audio upscaling engine...",
    "Finalizing premium rendering matrix..."
  ];

  // Helper function to pad numbers to 3 digits (e.g. 1 -> 001)
  const pad = (num, size) => ('000' + num).slice(-size);

  // --- Preloading & Preprocessing Engine ---
  function preloadImages() {
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = `${imageFolder}/ezgif-frame-${pad(i, 3)}.jpg`;
      
      img.onload = () => {
        handleImageLoad(img, i - 1);
      };
      
      img.onerror = () => {
        console.error(`Failed to load frame ${i}`);
        // Still proceed with progress even if a frame fails
        handleImageLoad(null, i - 1);
      };
    }
  }

  function handleImageLoad(img, index) {
    loadedCount++;
    
    // Update progress bar
    const progressPercent = Math.round((loadedCount / TOTAL_FRAMES) * 100);
    loaderBar.style.width = `${progressPercent}%`;
    
    // Rotate loading messages based on progress
    const msgIndex = Math.min(
      Math.floor((loadedCount / TOTAL_FRAMES) * statusMessages.length),
      statusMessages.length - 1
    );
    loaderStatus.innerText = `${statusMessages[msgIndex]} ${progressPercent}%`;
    
    // Process image to transparency canvas
    if (img) {
      const offCanvas = document.createElement('canvas');
      const offCtx = offCanvas.getContext('2d');
      applyLumaKey(img, offCanvas, offCtx);
      preprocessedCanvases[index] = offCanvas;
    } else {
      // Fallback in case of image load error
      preprocessedCanvases[index] = null;
    }
    
    // When loading and filtering are complete, unlock the interface
    if (loadedCount === TOTAL_FRAMES) {
      setTimeout(finishLoading, 800); // Small delay to enjoy the 100% completion glow
    }
  }

  // --- Canvas Luma-Key Transparency Filter ---
  function applyLumaKey(img, offCanvas, offCtx) {
    offCanvas.width = img.naturalWidth;
    offCanvas.height = img.naturalHeight;
    offCtx.drawImage(img, 0, 0);
    
    const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
    const data = imgData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];
      
      const maxVal = Math.max(r, g, b);
      const minVal = Math.min(r, g, b);
      const saturation = maxVal - minVal;
      
      // Look for bright and desaturated pixels (representing the light gradient bg)
      if (minVal > 140 && saturation < 25) {
        if (minVal > 235) {
          // Absolute background: set opacity to 0
          data[i+3] = 0;
        } else {
          // Soft shadow range: scale alpha based on brightness (closer to 140 is darker/denser)
          const alphaRatio = (235 - minVal) / (235 - 140);
          // Scale it down to a soft transparent shadow mask (25% max opacity)
          data[i+3] = Math.floor(alphaRatio * 255 * 0.25);
        }
      }
    }
    offCtx.putImageData(imgData, 0, 0);
  }

  function finishLoading() {
    loader.classList.add('fade-out');
    document.body.style.overflowY = 'auto'; // Re-enable scrolling
    
    // Set initial size and render
    resizeCanvas();
    updateScrollProgress();
    requestAnimationFrame(renderLoop);
  }

  // --- Canvas Sizing & DPR Handling ---
  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Scale drawings back by DPR in context
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    // Draw current frame immediately to prevent blank flash on resize
    drawFrame(currentProgress);
  }

  window.addEventListener('resize', resizeCanvas);

  // --- Frame Drawing Function (Centered Contain) ---
  function drawFrame(progress) {
    const frameIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.floor(progress * (TOTAL_FRAMES - 1))));
    const cachedCanvas = preprocessedCanvases[frameIndex];
    
    if (!cachedCanvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;
    
    const imgWidth = cachedCanvas.width;
    const imgHeight = cachedCanvas.height;
    
    // Calculate aspect ratio containment (object-fit: contain)
    const ratio = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);
    
    // Add subtle scaling based on progress for zoom-in / zoom-out transitions
    // e.g. slightly zoom in on exploded view, settle back on reassembly
    let scaleMultiplier = 0.95;
    if (progress > 0.15 && progress < 0.85) {
      // Zoom out slightly to accommodate the exploded parts
      scaleMultiplier = 0.85;
    } else if (progress >= 0.85) {
      scaleMultiplier = 1.0; // Hero beauty reassembly
    }
    
    const newWidth = imgWidth * ratio * scaleMultiplier;
    const newHeight = imgHeight * ratio * scaleMultiplier;
    
    const x = (canvasWidth - newWidth) / 2;
    const y = (canvasHeight - newHeight) / 2;
    
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(cachedCanvas, x, y, newWidth, newHeight);
  }

  // --- Scroll Progress Tracker ---
  function updateScrollProgress() {
    const scrollTop = window.scrollY || window.pageYOffset;
    const containerHeight = scrollContainer.scrollHeight - window.innerHeight;
    
    if (containerHeight <= 0) return;
    
    targetProgress = Math.max(0, Math.min(1, scrollTop / containerHeight));
    
    // Toggle active classes on text beats instantly for precise trigger response
    beats.forEach(beat => {
      if (targetProgress >= beat.start && targetProgress <= beat.end) {
        if (!beat.element.classList.contains('active')) {
          beat.element.classList.add('active');
        }
      } else {
        if (beat.element.classList.contains('active')) {
          beat.element.classList.remove('active');
        }
      }
    });

    // Toggle Apple navbar scrolled background class
    if (scrollTop > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Update active side dots based on progress
    const activeIndex = Math.min(
      Math.floor(targetProgress * dotElements.length),
      dotElements.length - 1
    );
    dotElements.forEach((dot, index) => {
      if (index === activeIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
    
    // Update vertical side progress bar fill height
    if (scrollProgressFill) {
      scrollProgressFill.style.height = `${targetProgress * 100}%`;
    }
  }

  window.addEventListener('scroll', updateScrollProgress);

  // --- Physics Lerp Render Loop ---
  function renderLoop() {
    // Lerp calculation: current = current + (target - current) * factor
    const progressDiff = targetProgress - currentProgress;
    
    if (Math.abs(progressDiff) > 0.0001) {
      currentProgress += progressDiff * lerpFactor;
      drawFrame(currentProgress);
    }
    
    requestAnimationFrame(renderLoop);
  }

  // --- Side Dots Click-to-Scroll Event ---
  dotElements.forEach(dot => {
    dot.addEventListener('click', () => {
      const targetPercent = parseInt(dot.getAttribute('data-target')) / 100;
      const containerHeight = scrollContainer.scrollHeight - window.innerHeight;
      const targetScrollY = targetPercent * containerHeight;
      
      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth'
      });
    });
  });

  // --- Start the Preloader ---
  // Lock scrolling initially during loading
  document.body.style.overflowY = 'hidden';
  preloadImages();
});
