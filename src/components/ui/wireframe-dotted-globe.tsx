"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"

interface RotatingEarthProps {
  width?: number
  height?: number
  className?: string
  globeScale?: number
}

interface GlobeDotsData {
  points: number[]
  step: number
}

type GlobeRenderProfile = {
  dotAsset: string
  maxDpr: number
  maxFps: number
  dotRadius: number
  autoRotateSpeed: number
  scrollSensitivity: number
  dragSensitivity: number
  allowDrag: boolean
  allowAutoRotate: boolean
}

type NavigatorWithHints = Navigator & {
  connection?: {
    saveData?: boolean
  }
  deviceMemory?: number
}

const LAND_DATA_URL = "/assets/data/world-land.json"
const DESKTOP_DOTS_URL = "/assets/data/world-dots-desktop.json"
const MOBILE_DOTS_URL = "/assets/data/world-dots-mobile.json"
const graticule = d3.geoGraticule()
const jsonCache = new Map<string, Promise<unknown>>()

const getJson = <T,>(url: string): Promise<T> => {
  const cached = jsonCache.get(url)
  if (cached) {
    return cached as Promise<T>
  }

  const request = fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load ${url}`)
      }

      return response.json() as Promise<T>
    })
    .catch((error) => {
      jsonCache.delete(url)
      throw error
    })

  jsonCache.set(url, request)
  return request
}

const getRenderProfile = (): GlobeRenderProfile => {
  const navigatorWithHints = navigator as NavigatorWithHints
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches
  const narrowViewport = window.innerWidth < 768
  const saveData = navigatorWithHints.connection?.saveData === true
  const deviceMemory = navigatorWithHints.deviceMemory ?? 8
  const hardwareConcurrency = navigator.hardwareConcurrency ?? 8

  const lowPowerDevice =
    prefersReducedMotion ||
    coarsePointer ||
    narrowViewport ||
    saveData ||
    deviceMemory <= 4 ||
    hardwareConcurrency <= 4

  if (lowPowerDevice) {
    return {
      dotAsset: MOBILE_DOTS_URL,
      maxDpr: 1,
      maxFps: 18,
      dotRadius: 0.9,
      autoRotateSpeed: prefersReducedMotion ? 0 : 0.04,
      scrollSensitivity: 0.012,
      dragSensitivity: 0.25,
      allowDrag: false,
      allowAutoRotate: prefersReducedMotion === false,
    }
  }

  return {
    dotAsset: DESKTOP_DOTS_URL,
    maxDpr: 1.5,
    maxFps: 30,
    dotRadius: 1.1,
    autoRotateSpeed: 0.08,
    scrollSensitivity: 0.018,
    dragSensitivity: 0.4,
    allowDrag: true,
    allowAutoRotate: true,
  }
}

export default function RotatingEarth({
  width = 800,
  height = 800,
  className = "",
  globeScale = 1.0,
}: RotatingEarthProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isVisibleRef = useRef(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d", {
      alpha: true,
      desynchronized: true,
    })
    if (!context) return

    const renderProfile = getRenderProfile()
    const containerWidth = width
    const containerHeight = height
    const radius = (Math.min(containerWidth, containerHeight) / 2) * globeScale
    const dpr = Math.min(window.devicePixelRatio || 1, renderProfile.maxDpr)

    canvas.width = Math.round(containerWidth * dpr)
    canvas.height = Math.round(containerHeight * dpr)
    context.setTransform(dpr, 0, 0, dpr, 0, 0)

    const projection = d3
      .geoOrthographic()
      .scale(radius)
      .translate([containerWidth / 2, containerHeight / 2])
      .clipAngle(90)

    const path = d3.geoPath().projection(projection).context(context)
    const rotation: [number, number] = [0, 0]

    let landFeatures: any = null
    let dotPoints: number[] = []
    let needsRender = true
    let lastFrame = 0
    let autoRotate = renderProfile.allowAutoRotate
    let scrollVelocity = 0
    let lastScrollY = window.scrollY
    let dragCleanup: (() => void) | undefined

    const render = () => {
      context.clearRect(0, 0, containerWidth, containerHeight)

      const currentScale = projection.scale()
      const sf = currentScale / radius

      context.beginPath()
      context.arc(containerWidth / 2, containerHeight / 2, currentScale, 0, 2 * Math.PI)
      context.strokeStyle = "rgba(255,255,255,0.15)"
      context.lineWidth = 1 * sf
      context.stroke()

      if (!landFeatures) return

      context.beginPath()
      path(graticule())
      context.strokeStyle = "#ffffff"
      context.lineWidth = 1 * sf
      context.globalAlpha = 0.25
      context.stroke()
      context.globalAlpha = 1

      context.beginPath()
      landFeatures.features.forEach((feature: any) => path(feature))
      context.strokeStyle = "#ffffff"
      context.lineWidth = 1 * sf
      context.stroke()

      if (dotPoints.length === 0) return

      const dotRadius = renderProfile.dotRadius * sf
      context.beginPath()

      for (let index = 0; index < dotPoints.length; index += 2) {
        const projected = projection([dotPoints[index], dotPoints[index + 1]])

        if (
          projected &&
          projected[0] >= 0 &&
          projected[0] <= containerWidth &&
          projected[1] >= 0 &&
          projected[1] <= containerHeight
        ) {
          context.moveTo(projected[0] + dotRadius, projected[1])
          context.arc(projected[0], projected[1], dotRadius, 0, 2 * Math.PI)
        }
      }

      context.fillStyle = "#999999"
      context.fill()
    }

    const rotate = (elapsed: number) => {
      if (!isVisibleRef.current || document.visibilityState !== "visible") return
      if (elapsed - lastFrame < 1000 / renderProfile.maxFps) return

      let hasMotion = false

      if (Math.abs(scrollVelocity) > 0.01) {
        rotation[0] += scrollVelocity
        scrollVelocity *= 0.9
        hasMotion = true
      } else if (autoRotate && renderProfile.autoRotateSpeed > 0) {
        rotation[0] += renderProfile.autoRotateSpeed
        hasMotion = true
      }

      if (hasMotion) {
        projection.rotate(rotation as [number, number])
        needsRender = true
      }

      if (!needsRender) return

      lastFrame = elapsed
      render()
      needsRender = false
    }

    render()
    needsRender = false

    const rotationTimer = d3.timer(rotate)

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const delta = currentScrollY - lastScrollY
      lastScrollY = currentScrollY
      scrollVelocity = Math.max(
        -3,
        Math.min(3, scrollVelocity + delta * renderProfile.scrollSensitivity),
      )
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!renderProfile.allowDrag || event.pointerType === "touch") return

      autoRotate = false
      scrollVelocity = 0

      const startX = event.clientX
      const startY = event.clientY
      const startRotation: [number, number] = [rotation[0], rotation[1]]

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - startX
        const dy = moveEvent.clientY - startY

        rotation[0] = startRotation[0] + dx * renderProfile.dragSensitivity
        rotation[1] = Math.max(
          -90,
          Math.min(90, startRotation[1] - dy * renderProfile.dragSensitivity),
        )

        projection.rotate(rotation as [number, number])
        needsRender = true
        render()
        needsRender = false
      }

      const handlePointerUp = () => {
        document.removeEventListener("pointermove", handlePointerMove)
        document.removeEventListener("pointerup", handlePointerUp)
        document.removeEventListener("pointercancel", handlePointerUp)
        autoRotate = renderProfile.allowAutoRotate
      }

      dragCleanup = handlePointerUp

      document.addEventListener("pointermove", handlePointerMove)
      document.addEventListener("pointerup", handlePointerUp)
      document.addEventListener("pointercancel", handlePointerUp)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    if (renderProfile.allowDrag) {
      canvas.addEventListener("pointerdown", handlePointerDown)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting
        if (entry.isIntersecting) {
          needsRender = true
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(canvas)

    let aborted = false

    ;(async () => {
      try {
        const [landResult, dotsResult] = await Promise.allSettled([
          getJson<any>(LAND_DATA_URL),
          getJson<GlobeDotsData>(renderProfile.dotAsset),
        ])

        if (aborted) return

        if (landResult.status === "fulfilled") {
          landFeatures = landResult.value
        }

        if (dotsResult.status === "fulfilled") {
          dotPoints = dotsResult.value.points
        }

        needsRender = true
      } catch {
        // Silently degrade to the wireframe shell.
      }
    })()

    return () => {
      aborted = true
      rotationTimer.stop()
      observer.disconnect()
      window.removeEventListener("scroll", handleScroll)

      if (dragCleanup) {
        dragCleanup()
      }

      if (renderProfile.allowDrag) {
        canvas.removeEventListener("pointerdown", handlePointerDown)
      }
    }
  }, [width, height, globeScale])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full aspect-square h-auto ${className}`}
      style={{
        maxWidth: "100%",
        height: "auto",
        aspectRatio: "1/1",
        background: "transparent",
      }}
    />
  )
}
