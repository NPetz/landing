// Performance optimization for Three.js and WebGL
class PerformanceOptimizer {
  constructor() {
    this.threeLoaded = false;
    this.webglPaused = false;
    this.canvasElement = null;
    this.intersectionObserver = null;
    this.isIdle = false;
  }

  // Defer Three.js loading until interaction or idle
  async initThreeJs() {
    if (this.threeLoaded) return;

    try {
      // Wait for idle or user interaction
      await this.waitForIdleOrInteraction();

      // Dynamic import with fallback
      const THREE = (await this.loadThreeWithFallback()).default;

      // Initialize your Three.js scene here
      this.initWebGLScene(THREE);
      this.threeLoaded = true;

      // Setup intersection observer for WebGL pause/resume
      this.setupWebGLObserver();
    } catch (error) {
      console.warn("Three.js loading failed:", error);
      // Graceful fallback - keep preview image
    }
  }

  waitForIdleOrInteraction() {
    return new Promise((resolve) => {
      // Check if requestIdleCallback is available
      if ("requestIdleCallback" in window) {
        requestIdleCallback(
          () => {
            this.isIdle = true;
            resolve();
          },
          { timeout: 2000 }
        );
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          this.isIdle = true;
          resolve();
        }, 1000);
      }

      // Also resolve on any user interaction
      const interactionEvents = ["click", "scroll", "touchstart", "keydown"];
      const handleInteraction = () => {
        interactionEvents.forEach((event) => {
          document.removeEventListener(event, handleInteraction, {
            passive: true,
          });
        });
        resolve();
      };

      interactionEvents.forEach((event) => {
        document.addEventListener(event, handleInteraction, {
          passive: true,
          once: true,
        });
      });
    });
  }

  async loadThreeWithFallback() {
    // Try CDN first
    try {
      const module = await import(
        "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.180.0/three.module.min.js"
      );
      return module;
    } catch (cdnError) {
      console.warn("CDN loading failed, trying backup:", cdnError);

      // Fallback to different CDN
      try {
        const module = await import(
          "https://unpkg.com/three@0.180.0/build/three.module.js"
        );
        return module;
      } catch (backupError) {
        console.error("All Three.js sources failed:", backupError);
        throw backupError;
      }
    }
  }

  initWebGLScene(THREE) {
    this.canvasElement = document.getElementById("canvas");
    if (!this.canvasElement) return;

    // Hide preview image once WebGL is ready
    const previewImage = document.getElementById("canvas-preview");
    if (previewImage) {
      previewImage.style.transition = "opacity 0.5s ease-out";
      previewImage.style.opacity = "0";
      setTimeout(() => (previewImage.style.display = "none"), 500);
    }

    // Initialize your Three.js scene here
    // This is where you'd put your existing Three.js code
    console.log("Three.js loaded and ready");
  }

  setupWebGLObserver() {
    if (!this.canvasElement || !("IntersectionObserver" in window)) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === this.canvasElement) {
            if (entry.isIntersecting && this.webglPaused) {
              // Resume WebGL rendering
              this.resumeWebGL();
            } else if (!entry.isIntersecting && !this.webglPaused) {
              // Pause WebGL rendering to save resources
              this.pauseWebGL();
            }
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% visible
      }
    );

    this.intersectionObserver.observe(this.canvasElement);
  }

  pauseWebGL() {
    this.webglPaused = true;
    // Implement your WebGL pause logic here
    console.log("WebGL paused - saving resources");
  }

  resumeWebGL() {
    this.webglPaused = false;
    // Implement your WebGL resume logic here
    console.log("WebGL resumed");
  }

  // Clean up
  destroy() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    const optimizer = new PerformanceOptimizer();
    optimizer.initThreeJs();
  });
} else {
  const optimizer = new PerformanceOptimizer();
  optimizer.initThreeJs();
}

export default PerformanceOptimizer;
