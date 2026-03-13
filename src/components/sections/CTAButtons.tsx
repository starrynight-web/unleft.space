"use client";

import React from "react";
import { motion, MotionConfig } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { HoverButton } from "@/components/ui/hover-button";

export default function CTAButtons() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <HoverButton
            onClick={() => (window.location.href = "/contact")}
            className="h-14 px-10 text-lg font-bold shadow-[0_0_20px_rgba(124,58,237,0.2)]"
          >
            Start a Project
          </HoverButton>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <HoverButton
            onClick={() => (window.location.href = "/projects")}
            className="h-14 px-10 text-lg font-bold [--circle-start:#C084FC] [--circle-end:#7B2CBF] bg-[#7B2CBF]/10 text-white border border-[#C084FC]/30 hover:bg-[#7B2CBF]/20 shadow-[0_0_20px_rgba(124,58,237,0.3)]"
          >
            View Our Work
          </HoverButton>
        </motion.div>
      </div>
    </MotionConfig>
  );
}
