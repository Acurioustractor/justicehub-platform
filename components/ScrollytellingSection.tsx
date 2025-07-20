'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, ReactNode } from 'react'

interface ScrollytellingSectionProps {
  title: string
  children: ReactNode
}

export function ScrollytellingSection({ title, children }: ScrollytellingSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [100, 0, 0, -100])
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.8, 1, 1, 0.8])

  return (
    <motion.section
      ref={containerRef}
      style={{ opacity }}
      className="min-h-screen py-20 px-4 relative"
    >
      <motion.div
        style={{ y, scale }}
        className="container mx-auto max-w-6xl"
      >
        {/* Section Title */}
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-white text-center mb-16"
        >
          {title}
        </motion.h2>

        {/* Progress Indicator */}
        <motion.div
          className="fixed right-8 top-1/2 transform -translate-y-1/2 z-20 hidden lg:block"
          style={{ opacity }}
        >
          <div className="relative h-48 w-1 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 w-full bg-qld-gold rounded-full"
              style={{
                height: useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
              }}
            />
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          {children}
        </motion.div>

        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            style={{
              x: useTransform(scrollYProgress, [0, 1], [-100, 100]),
              opacity: 0.05
            }}
            className="absolute top-1/4 left-0 w-96 h-96 bg-qld-gold rounded-full blur-3xl"
          />
          <motion.div
            style={{
              x: useTransform(scrollYProgress, [0, 1], [100, -100]),
              opacity: 0.05
            }}
            className="absolute bottom-1/4 right-0 w-96 h-96 bg-qld-maroon rounded-full blur-3xl"
          />
        </div>
      </motion.div>
    </motion.section>
  )
}