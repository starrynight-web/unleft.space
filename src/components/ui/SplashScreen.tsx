"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

export function SplashScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    camera: THREE.Camera;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    uniforms: any;
    animationId: number;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Default to visible only on homepage AND if splash hasn't been shown this session
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.location.pathname === "/" &&
      !sessionStorage.getItem("unleft-splash-seen")
    );
  });
  const [key, setKey] = useState(0); // Forces THREE.js canvas to remount on re-trigger

  const isHomePage = () =>
    typeof window !== "undefined" && window.location.pathname === "/";

  const startSplash = useCallback(() => {
    // Clear any pending hide timer
    if (timerRef.current) clearTimeout(timerRef.current);
    // Show the splash and force THREE.js canvas re-initialization
    setIsVisible(true);
    setKey((k) => k + 1);
    timerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 4000);
  }, []);

  // On mount: remove FOUC blocker, then check if we should show splash
  useEffect(() => {
    // Remove the static blocker div that prevented flash before this island loaded
    document.getElementById("splash-blocker")?.remove();

    if (!isHomePage() || sessionStorage.getItem("unleft-splash-seen")) {
      setIsVisible(false);
      return;
    }
    // First homepage visit this session — mark as seen and start the timer
    sessionStorage.setItem("unleft-splash-seen", "true");
    timerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 4000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Listen for Astro View Transition navigation events
  useEffect(() => {
    const handleAfterSwap = () => {
      if (isHomePage()) {
        // Only show splash if it hasn't been shown yet this session
        if (sessionStorage.getItem("unleft-splash-seen")) {
          setIsVisible(false);
          return;
        }
        sessionStorage.setItem("unleft-splash-seen", "true");
        startSplash();
      } else {
        // Navigated away: hide immediately, no animation needed
        if (timerRef.current) clearTimeout(timerRef.current);
        setIsVisible(false);
      }
    };

    document.addEventListener("astro:after-swap", handleAfterSwap);
    return () => {
      document.removeEventListener("astro:after-swap", handleAfterSwap);
    };
  }, [startSplash]);

  // THREE.js canvas setup — re-runs whenever `key` changes (i.e., on re-trigger)
  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    const container = containerRef.current;

    const vertexShader = `
      void main() {
        gl_Position = vec4( position, 1.0 );
      }
    `;

    const fragmentShader = `
      #define TWO_PI 6.2831853072
      #define PI 3.14159265359

      precision highp float;
      uniform vec2 resolution;
      uniform float time;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t = time*0.05;
        float lineWidth = 0.002;

        vec3 color = vec3(0.0);
        for(int j = 0; j < 3; j++){
          for(int i=0; i < 5; i++){
            float progress = (t - 0.01*float(j)+float(i)*0.01) * 5.0;
            color[j] += lineWidth*float(i*i) / abs(progress - length(uv) + mod(uv.x+uv.y, 0.2));
          }
        }
        
        gl_FragColor = vec4(color[0],color[1],color[2],1.0);
      }
    `;

    const camera = new THREE.Camera();
    camera.position.z = 1;

    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
      time: { type: "f", value: 1.0 },
      resolution: { type: "v2", value: new THREE.Vector2() },
    };

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const onWindowResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      uniforms.resolution.value.x = renderer.domElement.width;
      uniforms.resolution.value.y = renderer.domElement.height;
    };

    onWindowResize();
    window.addEventListener("resize", onWindowResize, false);

    let animationId = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      uniforms.time.value += 0.05;
      renderer.render(scene, camera);
      if (sceneRef.current) {
        sceneRef.current.animationId = animationId;
      }
    };

    sceneRef.current = { camera, scene, renderer, uniforms, animationId: 0 };
    animate();

    return () => {
      window.removeEventListener("resize", onWindowResize);
      cancelAnimationFrame(animationId);
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      sceneRef.current = null;
    };
  }, [key, isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={key}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-background overflow-hidden"
        >
          <div
            ref={containerRef}
            className="absolute inset-0 w-full h-full"
            style={{ overflow: "hidden" }}
          />
          <motion.div
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.5, duration: 1 }}
            className="relative z-10 flex flex-row items-center gap-3 md:gap-6"
          >
            <img
              src="/logos/unleft_logo.png"
              alt="Unleft logo"
              height={160}
              className="h-20 md:h-24 w-auto brightness-110 contrast-125"
            />
            <h1
              className="text-2xl sm:text-4xl md:text-7xl font-bold tracking-widest uppercase text-white whitespace-nowrap"
              style={{ fontFamily: "'Bruno Ace SC', sans-serif" }}
            >
              UNLEFT
            </h1>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
