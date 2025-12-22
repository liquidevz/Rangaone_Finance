// components\image-trail-hero.tsx
"use client"
import { motion, useAnimate } from "framer-motion"
import { useRef } from "react"
import Image from "next/image"

export const ImageTrailHero = () => {
  return (
    <>
      <MouseImageTrail
        renderImageBuffer={60}
        rotationRange={20}
        images={[
          "/imgs/active/1.png",
          "/imgs/active/2.jpg",
          "/imgs/active/3.jpg",
          "/imgs/active/4.jpg",
          "/imgs/active/5.png",
          "/imgs/active/6.png",
          "/imgs/active/7.png",
          "/imgs/active/8.png",
        ]}
      >
        <section className="h-[20rem] md:h-screen bg-[#bce7ff8c] op w-screen overflow-hidden relative">
          <Copy />
          <WatermarkWrapper />
        </section>
      </MouseImageTrail>
    </>
  )
}

const Copy = () => {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-40">
    <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-end justify-between px-4 md:px-8 relative">
      <div className="relative w-full">
        {/* Mobile Hero Image */}
        <div className="absolute bottom-0 left-0 z-10 block md:hidden">
          <Image
            src="/landing-page/mobileHeroImage.png"
            alt="RangaOne Hero Mobile"
            width={400}
            height={300}
            priority
            className="w-full h-auto max-w-full object-contain"
            style={{
              maxHeight: '40vh',
              minHeight: '150px',
            }}
          />
        </div>
  
        {/* Desktop Hero Image */}
        <div className="absolute bottom-0 left-0 z-10 hidden md:block">
          <Image
            src="/landing-page/HeroImage.png"
            alt="RangaOne Hero Desktop"
            width={800}
            height={600}
            priority
            className="w-full h-auto max-w-full object-contain"
            style={{
              maxHeight: '50vh',
              minHeight: '250px',
            }}
          />
        </div>
      </div>
    </div>
  </div>
  

  )
}

const WatermarkWrapper = () => {
  return (
    <>
      <Watermark text="Wealth Creation" />
      <Watermark text="Smart Investing" reverse />
      <Watermark text="Buy The Dip" />
      <Watermark text="Stock Market" reverse />
      <Watermark text="Wealth Creation" />
      <Watermark text="Smart Investing" reverse />
      <Watermark text="Buy The Dip" />
      <Watermark text="Stock Market" reverse />
    </>
  )
}

const Watermark = ({ reverse = false, text }: { reverse?: boolean; text: string }) => (
  <div className="flex -translate-y-12 select-none overflow-hidden">
    <TranslateWrapper reverse={reverse}>
      <span className="w-fit whitespace-nowrap text-[10vmax] md:text-[20vmax] font-black uppercase leading-[0.75] text-[#B9D9EB8C]">
        {text}
      </span>
    </TranslateWrapper>
    <TranslateWrapper reverse={reverse}>
      <span className="ml-48 w-fit whitespace-nowrap text-[10vmax] md:text-[20vmax] font-black uppercase leading-[0.75] text-[#B9D9EB8C]">
        {text}
      </span>
    </TranslateWrapper>
  </div>
)

const TranslateWrapper = ({ children, reverse = false }: { children: React.ReactNode; reverse?: boolean }) => {
  return (
    <div
      className="flex animate-marquee"
      style={{
        animationDirection: reverse ? 'reverse' : 'normal',
        animationDuration: '75s'
      }}
    >
      {children}
    </div>
  )
}

const MouseImageTrail = ({
  children,
  images,
  renderImageBuffer,
  rotationRange,
}: {
  children: React.ReactNode;
  images: string[];
  renderImageBuffer: number;
  rotationRange: number;
}) => {
  const [scope, animate] = useAnimate()

  const lastRenderPosition = useRef({ x: 0, y: 0 })
  const imageRenderCount = useRef(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { clientX, clientY } = e

    const distance = calculateDistance(clientX, clientY, lastRenderPosition.current.x, lastRenderPosition.current.y)

    if (distance >= renderImageBuffer) {
      lastRenderPosition.current.x = clientX
      lastRenderPosition.current.y = clientY

      renderNextImage()
    }
  }

  const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
    const deltaX = x2 - x1
    const deltaY = y2 - y1

    // Using the Pythagorean theorem to calculate the distance
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    return distance
  }

  const renderNextImage = () => {
    const imageIndex = imageRenderCount.current % images.length
    const selector = `[data-mouse-move-index="${imageIndex}"]`

    const el = document.querySelector(selector) as HTMLElement | null

    if (el) {
      el.style.top = `${lastRenderPosition.current.y}px`
      el.style.left = `${lastRenderPosition.current.x}px`
      el.style.zIndex = imageRenderCount.current.toString()

      const rotation = Math.random() * rotationRange

      animate(
        selector,
        {
          opacity: [0, 1],
          transform: [
            `translate(-50%, -25%) scale(0.5) ${imageIndex % 2 ? `rotate(${rotation}deg)` : `rotate(-${rotation}deg)`}`,
            `translate(-50%, -50%) scale(1) ${imageIndex % 2 ? `rotate(-${rotation}deg)` : `rotate(${rotation}deg)`}`,
          ],
        },
        { type: "spring", damping: 15, stiffness: 200 },
      )

      animate(
        selector,
        {
          opacity: [1, 0],
        },
        { ease: "linear", duration: 0.5, delay: 1 },
      )

      imageRenderCount.current = imageRenderCount.current + 1
    }
  }

  return (
    <div ref={scope} className="relative overflow-hidden" onMouseMove={handleMouseMove}>
      {children}

      {images.map((img, index) => (
        <Image
          className="pointer-events-none absolute left-0 top-0 h-36 w-auto rounded-xl border-2 border-slate-900 bg-slate-800 object-cover opacity-0"
          src={img || "/placeholder.svg"}
          alt={`Mouse move image ${index}`}
          key={index}
          data-mouse-move-index={index}
          width={144}
          height={144}
          loading="lazy"
        />
      ))}
    </div>
  )
}
