"use client";

import { useEffect, useState } from "react";
import { Cookie, Shield, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CookiePanelProps {
  title?: string;
  message?: string;
  icon?: "cookie" | "shield" | "info";
  className?: string;
  privacyHref?: string;
}

const CookiePanel = (props: CookiePanelProps) => {
  const {
    title = "Unleft uses cookies",
    message = "This site uses cookies for form security and analytics.",
    icon = "cookie",
    className,
    privacyHref = "/legal/cookies",
  } = props;

  const [visible, setVisible] = useState(false);
  const [render, setRender] = useState(false);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("cookie-notice-dismissed")
        : null;

    if (!stored) {
      setRender(true);
      requestAnimationFrame(() => setVisible(true));
    }
  }, []);

  const dismissNotice = () => {
    localStorage.setItem("cookie-notice-dismissed", "true");
    setVisible(false);
    setTimeout(() => setRender(false), 300);
  };

  if (!render) return null;

  const IconEl = icon === "shield" ? Shield : icon === "info" ? Info : Cookie;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie notice"
      className={cn(
        "fixed right-4 bottom-4 md:right-6 md:bottom-6",
        "z-50 w-90 max-w-[90vw]",
      )}
    >
      <div
        className={cn(
          "relative border border-border/70 rounded-xl bg-card/95 text-card-foreground shadow-xl backdrop-blur",
          "p-4 flex flex-col gap-3",
          visible
            ? cn("animate-in", "fade-in", "slide-in-from-bottom-8")
            : cn("animate-out", "fade-out", "slide-out-to-bottom-8"),
          "duration-300 ease-out",
          className,
        )}
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
            <IconEl className="size-5" aria-hidden="true" />
          </span>

          <h2 className="text-sm font-semibold leading-5">{title}</h2>

          <button
            type="button"
            onClick={dismissNotice}
            className="ml-auto inline-flex size-8 items-center justify-center rounded-md hover:bg-foreground/5 cursor-pointer"
            aria-label="Dismiss cookie notice"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        <p className="text-xs leading-5 text-muted-foreground">
          {message}{" "}
          <a
            href={privacyHref}
            className="underline underline-offset-4 hover:text-foreground cursor-pointer"
          >
            Learn more
          </a>
        </p>
      </div>
    </div>
  );
};

export { CookiePanel as CookieBanner };
export default CookiePanel;
