"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"

export default function Home() {
  const [activeSection, setActiveSection] = useState("home")
  const [isScrolled, setIsScrolled] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isLoaded, setIsLoaded] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  const [showGamePopup, setShowGamePopup] = useState(false)
  const [showGame, setShowGame] = useState(false)
  const [gameState, setGameState] = useState({
    player: { x: 200, y: 400, vx: 0, vy: 0, color: "#4B63BF", onGround: false },
    platforms: [] as Array<{
      x: number
      y: number
      width: number
      color: string
      used: boolean
      type: "normal" | "moving" | "breakable"
      vx?: number
      broken?: boolean
    }>,
    camera: { y: 0 },
    score: 0,
    gameOver: false,
    promoCode: "",
    showPromoCode: false,
    colorChangeTimer: 0,
  })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>()
  const keysRef = useRef<{ [key: string]: boolean }>({})

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
      const scrolled = window.pageYOffset
      const parallax = document.querySelectorAll(".parallax")
      parallax.forEach((element) => {
        const speed = 0.5
        const yPos = -(scrolled * speed)
        ;(element as HTMLElement).style.transform = `translateY(${yPos}px)`
      })
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-fade-in-up")
        }
      })
    }, observerOptions)

    document.querySelectorAll(".animate-on-scroll").forEach((el) => {
      observer.observe(el)
    })

    window.addEventListener("scroll", handleScroll)
    window.addEventListener("mousemove", handleMouseMove)
    setIsLoaded(true)

    const timer = setTimeout(() => {
      setShowGamePopup(true)
    }, 5000)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("mousemove", handleMouseMove)
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
      setActiveSection(sectionId)
    }
  }

  const initializeGame = () => {
    const platforms = []
    // Starting platform
    platforms.push({ x: 150, y: 450, width: 100, color: "#4B63BF", used: false, type: "normal" as const })

    // Generate platforms with different types
    for (let i = 1; i < 100; i++) {
      const platformType = Math.random() < 0.7 ? "normal" : Math.random() < 0.8 ? "moving" : "breakable"
      const platform = {
        x: Math.random() * 300,
        y: 450 - i * 100,
        width: 80,
        color: ["#4B63BF", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"][Math.floor(Math.random() * 5)],
        used: false,
        type: platformType,
        vx: platformType === "moving" ? (Math.random() - 0.5) * 2 : 0,
        broken: false,
      }
      platforms.push(platform)
    }

    setGameState((prev) => ({
      ...prev,
      platforms,
      player: { x: 200, y: 400, vx: 0, vy: 0, color: "#4B63BF", onGround: false },
      camera: { y: 0 },
      score: 0,
      gameOver: false,
      promoCode: "",
      showPromoCode: false,
      colorChangeTimer: 0,
    }))
  }

  const startGame = () => {
    setShowGame(true)
    initializeGame()

    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.focus()
        // Start the game loop immediately
        gameLoopRef.current = requestAnimationFrame(gameLoop)
      }
    }, 50)
  }

  const gameLoop = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setGameState((prev) => {
      if (prev.gameOver) return prev

      const newState = { ...prev }
      const player = { ...newState.player }

      // Handle input for horizontal movement
      if (keysRef.current["ArrowLeft"] || keysRef.current["a"] || keysRef.current["A"]) {
        player.vx = Math.max(player.vx - 0.8, -6)
      }
      if (keysRef.current["ArrowRight"] || keysRef.current["d"] || keysRef.current["D"]) {
        player.vx = Math.min(player.vx + 0.8, 6)
      }

      // Jump only when on ground
      if (
        (keysRef.current["ArrowUp"] || keysRef.current["w"] || keysRef.current["W"] || keysRef.current[" "]) &&
        player.onGround
      ) {
        player.vy = -15
        player.onGround = false
      }

      // Apply physics
      player.vy += 0.6 // gravity
      player.x += player.vx
      player.y += player.vy
      player.vx *= 0.92 // air resistance

      // Wrap around screen horizontally
      if (player.x < -10) player.x = 410
      if (player.x > 410) player.x = -10

      // Update moving platforms
      newState.platforms.forEach((platform) => {
        if (platform.type === "moving" && platform.vx) {
          platform.x += platform.vx
          if (platform.x <= 0 || platform.x >= 400 - platform.width) {
            platform.vx *= -1
          }
        }
      })

      // Platform collision detection
      player.onGround = false
      newState.platforms.forEach((platform) => {
        if (platform.broken) return

        if (
          player.x + 15 > platform.x &&
          player.x < platform.x + platform.width &&
          player.y + 20 > platform.y &&
          player.y + 20 < platform.y + 25 &&
          player.vy > 0
        ) {
          // Automatic bounce on any platform
          player.y = platform.y - 20
          player.vy = -12
          player.onGround = true

          if (!platform.used) {
            platform.used = true
            newState.score += 10

            // Break breakable platforms after use
            if (platform.type === "breakable") {
              setTimeout(() => {
                platform.broken = true
              }, 500)
            }
          }
        }
      })

      // Color change timer
      newState.colorChangeTimer++
      if (newState.colorChangeTimer >= 300) {
        // Change color every 5 seconds at 60fps
        const colors = ["#4B63BF", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"]
        player.color = colors[Math.floor(Math.random() * colors.length)]
        newState.colorChangeTimer = 0
      }

      // Camera follows player upward
      const targetCameraY = player.y - 300
      if (targetCameraY < newState.camera.y) {
        newState.camera.y = targetCameraY
      }

      // Update score based on height
      const heightScore = Math.max(0, Math.floor((450 - player.y) / 10))
      if (heightScore > newState.score) {
        newState.score = heightScore
      }

      // Game over if player falls below camera
      if (player.y > newState.camera.y + 600) {
        newState.gameOver = true
      }

      // Win condition
      if (newState.score >= 500 && !newState.showPromoCode) {
        newState.promoCode = "NOXEL5OFF" + Math.random().toString(36).substr(2, 4).toUpperCase()
        newState.showPromoCode = true
      }

      return { ...newState, player }
    })

    const currentState = gameState

    // Clear and render background
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, "#87CEEB")
    gradient.addColorStop(1, "#f0f8ff")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Platforms
    currentState.platforms.forEach((platform) => {
      if (platform.broken) return

      const screenY = platform.y - currentState.camera.y
      if (screenY > -50 && screenY < canvas.height + 50) {
        // Platform shadow
        ctx.fillStyle = "rgba(0,0,0,0.1)"
        ctx.fillRect(platform.x + 2, screenY + 2, platform.width, 15)

        // Platform color based on type
        if (platform.type === "breakable") {
          ctx.fillStyle = platform.used ? "#8B4513" : "#D2691E"
        } else if (platform.type === "moving") {
          ctx.fillStyle = platform.used ? "#696969" : "#4169E1"
        } else {
          ctx.fillStyle = platform.used ? "#94a3b8" : platform.color
        }

        ctx.fillRect(platform.x, screenY, platform.width, 15)

        // Platform highlight
        ctx.fillStyle = "rgba(255,255,255,0.3)"
        ctx.fillRect(platform.x, screenY, platform.width, 3)
      }
    })

    // Player with better graphics
    const playerScreenY = currentState.player.y - currentState.camera.y

    // Player shadow
    ctx.fillStyle = "rgba(0,0,0,0.2)"
    ctx.beginPath()
    ctx.ellipse(currentState.player.x + 10, playerScreenY + 25, 12, 4, 0, 0, 2 * Math.PI)
    ctx.fill()

    // Player body
    ctx.fillStyle = currentState.player.color
    ctx.fillRect(currentState.player.x + 2, playerScreenY + 2, 16, 16)

    // Player highlight
    ctx.fillStyle = "rgba(255,255,255,0.4)"
    ctx.fillRect(currentState.player.x + 2, playerScreenY + 2, 16, 4)

    // Player eyes
    ctx.fillStyle = "white"
    ctx.fillRect(currentState.player.x + 5, playerScreenY + 6, 3, 3)
    ctx.fillRect(currentState.player.x + 12, playerScreenY + 6, 3, 3)
    ctx.fillStyle = "black"
    ctx.fillRect(currentState.player.x + 6, playerScreenY + 7, 1, 1)
    ctx.fillRect(currentState.player.x + 13, playerScreenY + 7, 1, 1)

    // UI with better styling
    ctx.fillStyle = "rgba(255,255,255,0.9)"
    ctx.fillRect(5, 5, 200, 70)
    ctx.strokeStyle = "#4B63BF"
    ctx.lineWidth = 2
    ctx.strokeRect(5, 5, 200, 70)

    ctx.fillStyle = "#1f2937"
    ctx.font = "bold 16px Arial"
    ctx.fillText(`Счет: ${currentState.score}`, 15, 25)
    ctx.font = "12px Arial"
    ctx.fillText(`Цвет игрока:`, 15, 45)
    ctx.fillStyle = currentState.player.color
    ctx.fillRect(90, 35, 20, 15)
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 1
    ctx.strokeRect(90, 35, 20, 15)

    ctx.fillStyle = "#666"
    ctx.font = "10px Arial"
    ctx.fillText(`Высота: ${Math.max(0, Math.floor((450 - currentState.player.y) / 10))}м`, 15, 65)

    // Game over screen
    if (currentState.gameOver) {
      ctx.fillStyle = "rgba(0,0,0,0.8)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = "white"
      ctx.font = "bold 28px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Игра окончена!", canvas.width / 2, canvas.height / 2 - 40)

      ctx.font = "18px Arial"
      ctx.fillText(`Финальный счет: ${currentState.score}`, canvas.width / 2, canvas.height / 2)

      ctx.font = "14px Arial"
      ctx.fillText("Нажмите R для перезапуска", canvas.width / 2, canvas.height / 2 + 40)
      ctx.textAlign = "left"
    }

    // Promo code display
    if (currentState.showPromoCode) {
      ctx.fillStyle = "rgba(75, 99, 191, 0.95)"
      ctx.fillRect(50, 150, canvas.width - 100, 120)
      ctx.strokeStyle = "white"
      ctx.lineWidth = 3
      ctx.strokeRect(50, 150, canvas.width - 100, 120)

      ctx.fillStyle = "white"
      ctx.font = "bold 20px Arial"
      ctx.textAlign = "center"
      ctx.fillText("🎉 Поздравляем! 🎉", canvas.width / 2, 180)

      ctx.font = "14px Arial"
      ctx.fillText("Ваш промокод на 5% скидку:", canvas.width / 2, 205)

      ctx.font = "bold 18px Arial"
      ctx.fillStyle = "#FFD700"
      ctx.fillText(currentState.promoCode, canvas.width / 2, 235)

      ctx.fillStyle = "white"
      ctx.font = "12px Arial"
      ctx.fillText("Скопируйте и используйте при заказе!", canvas.width / 2, 255)
      ctx.textAlign = "left"
    }

    if (!currentState.gameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true
      if (e.key === "r" || e.key === "R") {
        if (gameState.gameOver) {
          initializeGame()
          setTimeout(() => {
            gameLoopRef.current = requestAnimationFrame(gameLoop)
          }, 100)
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false
    }

    const handleCanvasClick = (e: MouseEvent) => {
      if (canvasRef.current && showGame) {
        const rect = canvasRef.current.getBoundingClientRect()
        const clickX = e.clientX - rect.left

        // Move player towards click position
        setGameState((prev) => {
          if (prev.gameOver) return prev
          const player = { ...prev.player }
          if (clickX < player.x + 10) {
            player.vx = Math.max(player.vx - 2, -6)
          } else {
            player.vx = Math.min(player.vx + 2, 6)
          }

          // Jump if on ground
          if (player.onGround) {
            player.vy = -15
            player.onGround = false
          }

          return { ...prev, player }
        })
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      if (canvasRef.current && showGame) {
        const rect = canvasRef.current.getBoundingClientRect()
        const touch = e.touches[0]
        const touchX = touch.clientX - rect.left

        setGameState((prev) => {
          if (prev.gameOver) return prev
          const player = { ...prev.player }
          if (touchX < player.x + 10) {
            player.vx = Math.max(player.vx - 2, -6)
          } else {
            player.vx = Math.min(player.vx + 2, 6)
          }

          if (player.onGround) {
            player.vy = -15
            player.onGround = false
          }

          return { ...prev, player }
        })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    if (canvasRef.current) {
      canvasRef.current.addEventListener("click", handleCanvasClick)
      canvasRef.current.addEventListener("touchstart", handleTouchStart)
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      if (canvasRef.current) {
        canvasRef.current.removeEventListener("click", handleCanvasClick)
        canvasRef.current.removeEventListener("touchstart", handleTouchStart)
      }
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameState.gameOver, showGame])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <Image
          src="/vector-695.svg"
          alt=""
          width={800}
          height={600}
          className="absolute top-20 -right-20 animate-pulse parallax"
        />
        <Image
          src="/vector-740.svg"
          alt=""
          width={600}
          height={400}
          className="absolute bottom-20 -left-20 animate-pulse parallax"
        />
        <div
          className="absolute w-4 h-4 bg-[#4B63BF]/20 rounded-full transition-all duration-1000 ease-out"
          style={{
            left: mousePosition.x * 0.05,
            top: mousePosition.y * 0.05,
          }}
        />
        <div
          className="absolute w-6 h-6 bg-[#4B63BF]/10 rounded-full transition-all duration-1500 ease-out"
          style={{
            left: mousePosition.x * 0.03,
            top: mousePosition.y * 0.03,
          }}
        />
      </div>

      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-[#4B63BF]/10" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <Image
                  src="/favicon.png"
                  alt="NOXEL"
                  width={32}
                  height={32}
                  className="opacity-80 hover:opacity-100 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-[#4B63BF]/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-300 opacity-0 group-hover:opacity-100"></div>
              </div>
              <span className="text-xl font-bold text-[#4B63BF] group-hover:text-[#3a4f99] transition-colors">
                NOXEL
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {[
                { id: "home", label: "Главная" },
                { id: "services", label: "Услуги" },
                { id: "portfolio", label: "Портфолио" },
                { id: "about", label: "О нас" },
                { id: "contacts", label: "Контакты" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-sm font-medium transition-all duration-300 hover:text-[#4B63BF] relative group ${
                    activeSection === item.id ? "text-[#4B63BF]" : "text-gray-600"
                  }`}
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#4B63BF] transition-all duration-300 group-hover:w-full"></span>
                </button>
              ))}
            </div>

            <Button
              onClick={() => scrollToSection("contacts")}
              className="bg-[#4B63BF] hover:bg-[#3a4f99] text-white px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg relative overflow-hidden group"
            >
              <span className="relative z-10">Связаться</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#3a4f99] to-[#4B63BF] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </Button>
          </div>
        </div>
      </nav>

      <section
        id="home"
        className={`pt-32 pb-16 px-4 relative transition-all duration-1000 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12 animate-on-scroll">
            <div className="hover:scale-105 transition-transform duration-500 group relative">
              <Image
                src="/noxel-logo.png"
                alt="NOXEL"
                width={600}
                height={200}
                className="mx-auto mb-8 group-hover:drop-shadow-2xl transition-all duration-500"
                priority
              />
              <div className="absolute inset-0 bg-[#4B63BF]/5 rounded-2xl scale-0 group-hover:scale-110 transition-transform duration-500 opacity-0 group-hover:opacity-100 blur-xl"></div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-[#4B63BF] mb-8 animate-pulse">
              КРЕАТИВ, ТЕХНОЛОГИИ, БУДУЩЕЕ
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 mb-12 border border-[#4B63BF]/20 hover:shadow-2xl transition-all duration-500 hover:scale-105 animate-on-scroll group">
            <h2 className="text-2xl font-bold text-[#4B63BF] mb-6 group-hover:text-[#3a4f99] transition-colors">
              КОНТАКТЫ
            </h2>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              {[
                { href: "https://t.me/noxel", icon: "T", label: "Telegram" },
                { href: "mailto:info@noxel.ru", icon: "@", label: "info@noxel.ru" },
                { href: "tel:+79999999999", icon: "📞", label: "+7 (999) 999-99-99" },
              ].map((contact, index) => (
                <a
                  key={index}
                  href={contact.href}
                  className="flex items-center gap-3 text-[#4B63BF] hover:text-[#3a4f99] transition-all duration-300 hover:scale-110 group/contact relative"
                >
                  <div className="w-8 h-8 bg-[#4B63BF] rounded-full flex items-center justify-center group-hover/contact:bg-[#3a4f99] transition-all duration-300 group-hover/contact:rotate-12 group-hover/contact:shadow-lg">
                    <span className="text-white text-sm font-bold">{contact.icon}</span>
                  </div>
                  <span className="font-medium relative">
                    {contact.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#4B63BF] transition-all duration-300 group-hover/contact:w-full"></span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="py-16 px-4 bg-white/50 relative">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-[#4B63BF] text-center mb-12 animate-on-scroll">НАШИ УСЛУГИ</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "🌐",
                title: "Создание веб-приложений",
                desc: "Создание веб-приложений любой сложности: модульные архитектуры, высокая производительность, надёжная типизация",
              },
              {
                icon: "🧠",
                title: "Интеграция нейросетей и AI-API",
                desc: "Подключение GPT, Groq, Gemini, DALL·E и других моделей для чат-ботов, ассистентов, генераторов контента и персонализации",
              },
              {
                icon: "⚡",
                title: "Single Page Applications (SPA)",
                desc: "Максимальная скорость, плавная навигация, реактивный пользовательский опыт",
              },
              {
                icon: "🚀",
                title: "SSR / SSG (Next.js / Remix)",
                desc: "Продвинутая SEO-оптимизация, быстрая загрузка страниц и гибкая генерация контента",
              },
              {
                icon: "📲",
                title: "Progressive Web Applications (PWA)",
                desc: "Поведение как у мобильных приложений — offline-режим, push-уведомления, установка на устройство",
              },
              {
                icon: "🔌",
                title: "Интеграции с API и внешними сервисами",
                desc: "REST, GraphQL, Firebase, Stripe, карты, SaaS — мощная связка клиент-сервер",
              },
              {
                icon: "📱",
                title: "Адаптивная верстка",
                desc: "Используем Tailwind, Styled Components, CSS Modules — идеальный внешний вид на всех экранах",
              },
              {
                icon: "🌍",
                title: "Многоязычные сайты (i18n)",
                desc: "Локализация и международная адаптация с использованием i18next, LinguiJS, Next Translate",
              },
              {
                icon: "🧩",
                title: "Разработка UI-компонентов",
                desc: "Кастомные интерфейсы: таблицы, фильтры, калькуляторы, drag'n'drop, графики, анимации",
              },
              {
                icon: "🏗",
                title: "Интеграция с Headless CMS",
                desc: "Подключение к Strapi, Sanity, Contentful, Hygraph — управление контентом вне фронта",
              },
              {
                icon: "🧮",
                title: "Работа с CRM, аналитикой и ERP",
                desc: "Интеграции с Bitrix24, HubSpot, GA4, Amplitude, RetailCRM и другими системами",
              },
              {
                icon: "🛎",
                title: "Поддержка Agile / SCRUM",
                desc: "Командная разработка, спринты, быстрая обратная связь, документация и планирование",
              },
            ].map((service, index) => (
              <Card
                key={index}
                className="bg-white/80 border-[#4B63BF]/20 hover:border-[#4B63BF]/40 transition-all duration-700 hover:shadow-xl hover:scale-[1.02] animate-on-scroll group cursor-pointer overflow-hidden"
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6 relative overflow-hidden">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br from-[#4B63BF]/5 to-transparent transition-all duration-700 ease-out ${hoveredCard === index ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
                  ></div>
                  <div
                    className={`text-3xl mb-4 transition-all duration-500 ease-out ${hoveredCard === index ? "scale-110 rotate-6" : ""}`}
                  >
                    {service.icon}
                  </div>
                  <h3 className="text-lg font-bold text-[#4B63BF] mb-3 group-hover:text-[#3a4f99] transition-colors duration-500 relative z-10">
                    {service.title}
                  </h3>
                  <p className="text-gray-700 text-sm relative z-10">{service.desc}</p>
                  <div
                    className={`absolute bottom-0 left-0 h-1 bg-[#4B63BF] transition-all duration-700 ease-out ${hoveredCard === index ? "w-full" : "w-0"}`}
                  ></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="portfolio" className="py-16 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-[#4B63BF] text-center mb-12 animate-on-scroll">ПОРТФОЛИО</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "AI-Чат-бот для e-commerce",
                description: "Интеллектуальный помощник с интеграцией GPT-4 для онлайн-магазина",
                tech: ["Next.js", "OpenAI API", "TypeScript"],
                image: "/placeholder.svg?height=200&width=300",
              },
              {
                title: "SaaS-платформа аналитики",
                description: "Комплексная система аналитики с real-time дашбордами",
                tech: ["React", "Node.js", "PostgreSQL"],
                image: "/placeholder.svg?height=200&width=300",
              },
              {
                title: "PWA мобильное приложение",
                description: "Прогрессивное веб-приложение с offline-функциональностью",
                tech: ["Vue.js", "PWA", "Firebase"],
                image: "/placeholder.svg?height=200&width=300",
              },
            ].map((project, index) => (
              <Card
                key={index}
                className="bg-white/90 border-[#4B63BF]/20 hover:border-[#4B63BF]/40 transition-all duration-500 hover:shadow-2xl hover:scale-105 group animate-on-scroll cursor-pointer"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <CardContent className="p-0 relative overflow-hidden">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <Image
                      src={project.image || "/placeholder.svg"}
                      alt={project.title}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#4B63BF]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <span className="text-white font-bold text-lg bg-[#4B63BF]/80 px-4 py-2 rounded-lg backdrop-blur-sm">
                        Посмотреть проект
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-[#4B63BF] mb-3 group-hover:text-[#3a4f99] transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-gray-700 text-sm mb-4">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.tech.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-3 py-1 bg-[#4B63BF]/10 text-[#4B63BF] text-xs rounded-full font-medium hover:bg-[#4B63BF]/20 transition-colors cursor-pointer"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="py-16 px-4 bg-white/50 relative">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-[#4B63BF] text-center mb-12 animate-on-scroll">О НАС</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16 animate-on-scroll">
            <div>
              <h3 className="text-2xl font-bold text-[#4B63BF] mb-6">Наша миссия</h3>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                NOXEL — это команда профессионалов, которая создает цифровые решения будущего. Мы объединяем
                креативность, передовые технологии и глубокое понимание бизнеса, чтобы воплощать в жизнь самые смелые
                идеи наших клиентов.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Наш подход основан на инновациях, качестве и долгосрочном партнерстве. Мы не просто разрабатываем сайты
                — мы создаем цифровые экосистемы, которые помогают бизнесу расти и развиваться.
              </p>
            </div>
            <div className="relative group">
              <Image
                src="/placeholder.svg?height=400&width=500"
                alt="Команда NOXEL"
                width={500}
                height={400}
                className="rounded-2xl shadow-xl hover:scale-105 transition-transform duration-500 group-hover:shadow-2xl"
              />
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-[#4B63BF]/20 rounded-full animate-bounce group-hover:scale-150 transition-transform duration-300"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-[#4B63BF]/30 rounded-full animate-pulse group-hover:scale-125 transition-transform duration-300"></div>
            </div>
          </div>

          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-[#4B63BF] mb-8 animate-on-scroll">ОСНОВАТЕЛИ АГЕНТСТВА</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                name: "Даниил Шишкин",
                position: "Ведущий backend разработчик",
                description:
                  "Эксперт в области серверной разработки с глубокими знаниями Node.js, Python и архитектуры микросервисов. Отвечает за техническую реализацию и масштабируемость проектов.",
                image: "/placeholder.svg?height=300&width=300",
              },
              {
                name: "Татьяна Эпова",
                position: "Маркетолог и дизайнер",
                description:
                  "Креативный директор с экспертизой в UX/UI дизайне и цифровом маркетинге. Создает визуальные концепции и стратегии продвижения для наших клиентов.",
                image: "/placeholder.svg?height=300&width=300",
              },
            ].map((founder, index) => (
              <Card
                key={index}
                className="bg-white/90 border-[#4B63BF]/20 hover:border-[#4B63BF]/40 transition-all duration-500 hover:shadow-2xl hover:scale-105 group animate-on-scroll cursor-pointer"
                style={{ animationDelay: `${index * 300}ms` }}
              >
                <CardContent className="p-8 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#4B63BF]/5 via-transparent to-[#4B63BF]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative mb-6">
                    <div className="relative">
                      <Image
                        src={founder.image || "/placeholder.svg"}
                        alt={founder.name}
                        width={200}
                        height={200}
                        className="w-32 h-32 rounded-full mx-auto object-cover group-hover:scale-110 transition-transform duration-500 group-hover:shadow-xl"
                      />
                      <div className="absolute inset-0 rounded-full border-2 border-[#4B63BF]/20 scale-110 opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500"></div>
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-[#4B63BF] mb-2 group-hover:text-[#3a4f99] transition-colors relative z-10">
                    {founder.name}
                  </h4>
                  <p className="text-[#4B63BF]/70 font-medium mb-4 relative z-10">{founder.position}</p>
                  <p className="text-gray-700 leading-relaxed relative z-10">{founder.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="contacts" className="py-16 px-4 relative">
        <div className="max-w-4xl mx-auto text-center animate-on-scroll">
          <h2 className="text-3xl font-bold text-[#4B63BF] mb-6">Готовы обсудить ваш проект?</h2>
          <p className="text-xl text-gray-700 mb-8">Свяжитесь с нами для консультации и обсуждения деталей</p>
          <Button
            size="lg"
            className="bg-[#4B63BF] hover:bg-[#3a4f99] text-white px-12 py-4 text-lg rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl relative overflow-hidden group animate-pulse"
          >
            <span className="relative z-10">Связаться с нами</span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#3a4f99] via-[#4B63BF] to-[#3a4f99] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center"></div>
          </Button>
        </div>
      </section>

      {showGamePopup && (
        <div className="fixed bottom-4 right-4 z-50 animate-bounce">
          <div
            className="bg-[#4B63BF] text-white p-4 rounded-lg shadow-2xl max-w-sm relative group cursor-pointer hover:scale-105 transition-transform duration-300"
            onClick={startGame}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowGamePopup(false)
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
            >
              ×
            </button>
            <div className="flex items-center gap-3">
              <div className="text-2xl animate-pulse">🎮</div>
              <div>
                <h3 className="font-bold text-sm">Сыграйте в нашу игру!</h3>
                <p className="text-xs opacity-90">Получите 5% скидку на услуги</p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#4B63BF] to-[#3a4f99] opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-lg"></div>
          </div>
        </div>
      )}

      {showGame && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full relative">
            <button
              onClick={() => {
                setShowGame(false)
                if (gameLoopRef.current) {
                  cancelAnimationFrame(gameLoopRef.current)
                }
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>

            <h2 className="text-2xl font-bold text-[#4B63BF] mb-4 text-center">Doodle Jump NOXEL</h2>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Прыгайте автоматически при касании платформ! Наберите 500 очков для промокода.
              <br />
              Управление: стрелки/WASD для движения, клик/тап для направления
            </p>

            <canvas
              ref={canvasRef}
              width={400}
              height={500}
              className="border-2 border-[#4B63BF]/20 rounded-lg mx-auto block focus:outline-none focus:border-[#4B63BF] cursor-pointer"
              tabIndex={0}
            />

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                🟦 Обычные платформы 🟫 Ломающиеся 🔵 Движущиеся
                <br />
                Прыгайте выше для большего счета!
              </p>
            </div>
          </div>
        </div>
      )}

      <footer className="py-8 px-4 bg-[#4B63BF]/5 border-t border-[#4B63BF]/20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-2xl font-bold text-[#4B63BF] mb-4">NOXEL</div>
          <p className="text-gray-600">© 2024 NOXEL. Креатив, технологии, будущее.</p>
        </div>
      </footer>
    </div>
  )
}
