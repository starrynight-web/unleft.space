"use client";

import React, { useId } from "react";
import type { CSSProperties } from "react";

interface ResponsiveImage {
  src: string;
  alt?: string;
  srcSet?: string;
}

interface AnimationConfig {
  preview?: boolean;
  scale: number;
  speed: number;
}

interface NoiseConfig {
  opacity: number;
  scale: number;
}

interface ShadowOverlayProps {
  type?: "preset" | "custom";
  presetIndex?: number;
  customImage?: ResponsiveImage;
  sizing?: "fill" | "stretch";
  color?: string;
  animation?: AnimationConfig;
  noise?: NoiseConfig;
  style?: CSSProperties;
  className?: string;
  children?: React.ReactNode;
}

type ShadowRenderProfile = {
  mode: "full" | "lite";
  maskUrl: string;
  enableAnimation: boolean;
  enableNoise: boolean;
  blur: number;
};

type NavigatorWithConnectionHints = Navigator & {
  connection?: {
    saveData?: boolean;
  };
  deviceMemory?: number;
};

function mapRange(
  value: number,
  fromLow: number,
  fromHigh: number,
  toLow: number,
  toHigh: number,
): number {
  if (fromLow === fromHigh) {
    return toLow;
  }

  const percentage = (value - fromLow) / (fromHigh - fromLow);
  return toLow + percentage * (toHigh - toLow);
}

const useInstanceId = (): string => {
  const id = useId();
  const cleanId = id.replace(/:/g, "");
  return `shadowoverlay-${cleanId}`;
};

const SHOW_SHADOW = true;
const FULL_MASK_URL = "/assets/images/shadow-mask-lite.webp";
const MOBILE_MASK_URL = "/assets/images/shadow-mask-mobile.webp";

const LITE_SHADOW_PROFILE: ShadowRenderProfile = {
  mode: "lite",
  maskUrl: MOBILE_MASK_URL,
  enableAnimation: false,
  enableNoise: false,
  blur: 0,
};

const FULL_SHADOW_PROFILE: ShadowRenderProfile = {
  mode: "full",
  maskUrl: FULL_MASK_URL,
  enableAnimation: true,
  enableNoise: true,
  blur: 4,
};

function getShadowRenderProfile(): ShadowRenderProfile {
  const navigatorWithHints = navigator as NavigatorWithConnectionHints;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const narrowViewport = window.innerWidth < 768;
  const saveData = navigatorWithHints.connection?.saveData === true;
  const deviceMemory = navigatorWithHints.deviceMemory ?? 8;
  const hardwareConcurrency = navigator.hardwareConcurrency ?? 8;

  const lowPowerDevice =
    prefersReducedMotion ||
    coarsePointer ||
    narrowViewport ||
    saveData ||
    deviceMemory <= 4 ||
    hardwareConcurrency <= 4;

  return lowPowerDevice ? LITE_SHADOW_PROFILE : FULL_SHADOW_PROFILE;
}

export function EtheralShadow({
  sizing = "fill",
  color = "rgba(124, 58, 237, 0.5)",
  animation = { scale: 100, speed: 90 },
  noise = { opacity: 1, scale: 1.2 },
  style,
  className,
  children,
  zIndex = -1,
  position = "fixed",
}: ShadowOverlayProps & { zIndex?: number; position?: "fixed" | "absolute" }) {
  const id = useInstanceId();
  const [isEnabled, setIsEnabled] = React.useState(SHOW_SHADOW);
  const [renderProfile, setRenderProfile] =
    React.useState<ShadowRenderProfile>(LITE_SHADOW_PROFILE);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shadowParam = params.get("shadow");

    if (shadowParam === "false" || shadowParam === "off") {
      setIsEnabled(false);
      return;
    }

    if (shadowParam === "lite" || shadowParam === "low") {
      setRenderProfile(LITE_SHADOW_PROFILE);
      return;
    }

    if (shadowParam === "full" || shadowParam === "on") {
      setRenderProfile(FULL_SHADOW_PROFILE);
      return;
    }

    setRenderProfile(getShadowRenderProfile());
  }, []);

  if (!isEnabled) {
    return null;
  }

  const animationEnabled =
    renderProfile.enableAnimation && animation && animation.scale > 0;
  const displacementScale = animationEnabled
    ? mapRange(animation.scale, 1, 100, 20, 100)
    : 0;
  const animationDurationStr = animation
    ? `${mapRange(animation.speed, 1, 100, 40, 2)}s`
    : "10s";
  const maskImage = `url('${renderProfile.maskUrl}')`;

  return (
    <div
      className={className}
      style={{
        overflow: "hidden",
        position,
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex,
        pointerEvents: "none",
        contain: "paint",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: animationEnabled ? -displacementScale : 0,
          filter: animationEnabled
            ? `url(#${id}) blur(${renderProfile.blur}px)`
            : "none",
          willChange: animationEnabled ? "filter, transform" : "auto",
          transform: animationEnabled ? "translateZ(0)" : "none",
          backfaceVisibility: "hidden",
        }}
      >
        {animationEnabled && (
          <svg style={{ position: "absolute", width: 0, height: 0 }}>
            <defs>
              <filter id={id}>
                <feTurbulence
                  result="undulation"
                  numOctaves="1"
                  baseFrequency={`${mapRange(animation.scale, 0, 100, 0.001, 0.0005)},${mapRange(animation.scale, 0, 100, 0.004, 0.002)}`}
                  seed="0"
                  type="turbulence"
                />
                <feColorMatrix in="undulation" type="hueRotate" values="180">
                  <animate
                    attributeName="values"
                    from="0"
                    to="360"
                    dur={animationDurationStr}
                    repeatCount="indefinite"
                  />
                </feColorMatrix>
                <feColorMatrix
                  in="dist"
                  result="circulation"
                  type="matrix"
                  values="4 0 0 0 1  4 0 0 0 1  4 0 0 0 1  1 0 0 0 0"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="circulation"
                  scale={displacementScale}
                  result="dist"
                />
                <feDisplacementMap
                  in="dist"
                  in2="undulation"
                  scale={displacementScale}
                  result="output"
                />
              </filter>
            </defs>
          </svg>
        )}
        <div
          style={{
            backgroundColor: color,
            maskImage,
            WebkitMaskImage: maskImage,
            maskSize: sizing === "stretch" ? "100% 100%" : "cover",
            WebkitMaskSize: sizing === "stretch" ? "100% 100%" : "cover",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskPosition: "center",
            width: "100%",
            height: "100%",
            opacity: renderProfile.mode === "lite" ? 0.82 : 1,
          }}
        />
      </div>

      {noise && noise.opacity > 0 && renderProfile.enableNoise && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: 'url("/assets/images/noise.webp")',
            backgroundSize: noise.scale * 200,
            backgroundRepeat: "repeat",
            opacity: Math.min(noise.opacity / 3, 0.35),
          }}
        />
      )}
      {children}
    </div>
  );
}
