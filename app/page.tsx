"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { useState, useEffect } from "react"

export default function Home() {
  const [activeSection, setActiveSection] = useState("home")
  const [isScrolled, setIsScrolled] = useState(false)
  const [timelineProgress, setTimelineProgress] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; opacity: number }>>([])
  const [floatingElements, setFloatingElements] = useState<
    Array<{ id: number; x: number; y: number; rotation: number }>
  >([])

  const [showGamePopup, setShowGamePopup] = useState(false)
  const [showGame, setShowGame] = useState(false)
  const [gameScore, setGameScore] = useState(0)
  const [gameActive, setGameActive] = useState(false)
  const [playerPosition, setPlayerPosition] = useState({ x: 150, y: 250 })
  const [targetPosition, setTargetPosition] = useState({ x: 200, y: 100 })
  const [gameLevel, setGameLevel] = useState(1)
  const [promoCode, setPromoCode] = useState("")

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
      const timelineSection = document.getElementById("timeline")
      if (timelineSection) {
        const rect = timelineSection.getBoundingClientRect()
        const progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / window.innerHeight))
        setTimelineProgress(progress)
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      if (Math.random() > 0.95) {
        const newParticle = {
          id: Date.now(),
          x: e.clientX,
          y: e.clientY,
          opacity: 1,
        }
        setParticles((prev) => [...prev.slice(-10), newParticle])
      }
    }

    const floatingInterval = setInterval(() => {
      setFloatingElements((prev) =>
        prev.map((el) => ({
          ...el,
          y: el.y + Math.sin(Date.now() * 0.001 + el.id) * 0.5,
          rotation: el.rotation + 0.5,
        })),
      )
    }, 50)

    const initFloatingElements = () => {
      const elements = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        rotation: Math.random() * 360,
      }))
      setFloatingElements(elements)
    }

    const popupTimer = setTimeout(() => {
      setShowGamePopup(true)
    }, 10000)

    window.addEventListener("scroll", handleScroll)
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("resize", initFloatingElements)
    initFloatingElements()

    const particleInterval = setInterval(() => {
      setParticles((prev) => prev.map((p) => ({ ...p, opacity: p.opacity - 0.05 })).filter((p) => p.opacity > 0))
    }, 50)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", initFloatingElements)
      clearInterval(particleInterval)
      clearInterval(floatingInterval)
      clearTimeout(popupTimer)
    }
  }, [])

  const startGame = () => {
    setShowGame(true)
    setGameActive(true)
    setGameScore(0)
    setGameLevel(1)
    setPlayerPosition({ x: 150, y: 250 })
    generateNewTarget()
  }

  const generateNewTarget = () => {
    setTargetPosition({
      x: Math.random() * 250 + 25,
      y: Math.random() * 200 + 50,
    })
  }

  const handleGameClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gameActive) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    const distance = Math.sqrt(Math.pow(clickX - targetPosition.x, 2) + Math.pow(clickY - targetPosition.y, 2))

    if (distance < 30) {
      const newScore = gameScore + 10
      setGameScore(newScore)
      setPlayerPosition({ x: clickX, y: clickY })

      if (newScore >= 100) {
        const code = `NOXEL${Math.random().toString(36).substr(2, 6).toUpperCase()}`
        setPromoCode(code)
        setGameActive(false)
      } else {
        generateNewTarget()
        if (newScore % 30 === 0) {
          setGameLevel(gameLevel + 1)
        }
      }
    }
  }

  const resetGame = () => {
    setGameScore(0)
    setGameLevel(1)
    setGameActive(false)
    setPromoCode("")
    setPlayerPosition({ x: 150, y: 250 })
    generateNewTarget()
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
      setActiveSection(sectionId)
    }
  }

  const timelineSteps = [
    { title: "Идея", description: "Анализ требований и планирование", icon: "💡" },
    { title: "Дизайн", description: "UX/UI прототипирование", icon: "🎨" },
    { title: "Разработка", description: "Программирование и интеграция", icon: "⚙️" },
    { title: "Тестирование", description: "Проверка качества и отладка", icon: "🔍" },
    { title: "Запуск", description: "Деплой и поддержка", icon: "🚀" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-x-hidden">
      {showGamePopup && !showGame && (
        <div className="fixed bottom-4 right-4 z-50 animate-pulse">
          <Card className="bg-gradient-to-r from-[#4B63BF] to-[#3a4f99] text-white border-none shadow-2xl max-w-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">🎮 Получите скидку 5%!</h3>
                <button onClick={() => setShowGamePopup(false)} className="text-white/80 hover:text-white text-xl">
                  ×
                </button>
              </div>
              <p className="text-sm mb-3">Сыграйте в нашу мини-игру и получите промокод на 5% скидку на наши услуги!</p>
              <Button onClick={startGame} className="w-full bg-white text-[#4B63BF] hover:bg-gray-100 font-bold">
                Играть сейчас!
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showGame && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="bg-white max-w-md w-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#4B63BF]">Цветная Мишень</h2>
                <button onClick={() => setShowGame(false)} className="text-gray-500 hover:text-gray-700 text-xl">
                  ×
                </button>
              </div>

              {!promoCode ? (
                <>
                  <div className="mb-4 text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      Кликайте по цветным мишеням! Наберите 100 очков для получения промокода.
                    </p>
                    <div className="flex justify-between text-sm">
                      <span>
                        Очки: <strong>{gameScore}</strong>
                      </span>
                      <span>
                        Уровень: <strong>{gameLevel}</strong>
                      </span>
                    </div>
                  </div>

                  <div
                    className="relative w-full h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg border-2 border-[#4B63BF]/20 cursor-crosshair overflow-hidden"
                    onClick={handleGameClick}
                  >
                    {/* Player indicator */}
                    <div
                      className="absolute w-4 h-4 bg-[#4B63BF] rounded-full transform -translate-x-2 -translate-y-2 transition-all duration-300"
                      style={{ left: playerPosition.x, top: playerPosition.y }}
                    />

                    {/* Target */}
                    {gameActive && (
                      <div
                        className="absolute w-8 h-8 rounded-full transform -translate-x-4 -translate-y-4 animate-pulse cursor-pointer"
                        style={{
                          left: targetPosition.x,
                          top: targetPosition.y,
                          background: `hsl(${(gameLevel * 60) % 360}, 70%, 60%)`,
                          boxShadow: `0 0 20px hsl(${(gameLevel * 60) % 360}, 70%, 60%)`,
                        }}
                      />
                    )}

                    {/* Floating particles */}
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-2 h-2 bg-white/30 rounded-full animate-ping"
                        style={{
                          left: `${20 + i * 15}%`,
                          top: `${30 + (i % 2) * 40}%`,
                          animationDelay: `${i * 0.5}s`,
                        }}
                      />
                    ))}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button onClick={resetGame} variant="outline" className="flex-1 bg-transparent">
                      Сброс
                    </Button>
                    <Button
                      onClick={() => setGameActive(!gameActive)}
                      className="flex-1 bg-[#4B63BF] hover:bg-[#3a4f99]"
                    >
                      {gameActive ? "Пауза" : "Старт"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-xl font-bold text-[#4B63BF] mb-2">Поздравляем!</h3>
                  <p className="text-gray-600 mb-4">Вы набрали {gameScore} очков и заработали промокод на скидку 5%!</p>
                  <div className="bg-[#4B63BF]/10 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-600 mb-1">Ваш промокод:</p>
                    <p className="text-2xl font-bold text-[#4B63BF] tracking-wider">{promoCode}</p>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">Используйте этот код при заказе любой услуги NOXEL</p>
                  <Button
                    onClick={() => {
                      setShowGame(false)
                      setShowGamePopup(false)
                    }}
                    className="w-full bg-[#4B63BF] hover:bg-[#3a4f99]"
                  >
                    Отлично!
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {particles.map((particle) => (
        <div
          key={particle.id}
          className="fixed w-2 h-2 bg-[#4B63BF] rounded-full pointer-events-none z-10 animate-ping"
          style={{
            left: particle.x,
            top: particle.y,
            opacity: particle.opacity,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {floatingElements.map((element) => (
        <div
          key={element.id}
          className="fixed w-4 h-4 bg-[#4B63BF]/10 rounded-full pointer-events-none z-5 animate-pulse"
          style={{
            left: element.x,
            top: element.y,
            transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
            transition: "all 0.1s ease-out",
          }}
        />
      ))}

      <div
        className="fixed inset-0 pointer-events-none opacity-5 transition-all duration-1000"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, #4B63BF, transparent 40%)`,
        }}
      />

      <div className="fixed inset-0 pointer-events-none opacity-10">
        <Image
          src="/vector-695.svg"
          alt=""
          width={800}
          height={600}
          className="absolute top-20 -right-20 animate-pulse hover:scale-110 transition-transform duration-700 hover:animate-bounce"
        />
        <Image
          src="/vector-740.svg"
          alt=""
          width={600}
          height={400}
          className="absolute bottom-20 -left-20 animate-pulse hover:scale-110 transition-transform duration-700 hover:animate-bounce"
        />
      </div>

      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 group">
              <Image
                src="/favicon.png"
                alt="NOXEL"
                width={32}
                height={32}
                className="opacity-80 hover:opacity-100 transition-all duration-300 group-hover:rotate-12"
              />
              <span className="text-xl font-bold text-[#4B63BF] group-hover:scale-105 transition-transform duration-300">
                NOXEL
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {[
                { id: "home", label: "Главная" },
                { id: "timeline", label: "Процесс" },
                { id: "services", label: "Услуги" },
                { id: "portfolio", label: "Портфолио" },
                { id: "about", label: "О нас" },
                { id: "contacts", label: "Контакты" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-sm font-medium transition-all duration-300 hover:text-[#4B63BF] hover:scale-110 relative ${
                    activeSection === item.id ? "text-[#4B63BF]" : "text-gray-600"
                  }`}
                >
                  {item.label}
                  {activeSection === item.id && (
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#4B63BF] animate-pulse" />
                  )}
                </button>
              ))}
            </div>

            <Button
              onClick={() => scrollToSection("contacts")}
              className="bg-[#4B63BF] hover:bg-[#3a4f99] text-white px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              Связаться
            </Button>
          </div>
        </div>
      </nav>

      <section id="home" className="pt-32 pb-16 px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12 animate-fade-in">
            <div className="hover:scale-105 transition-transform duration-500 group">
              <Image
                src="/noxel-logo.png"
                alt="NOXEL"
                width={600}
                height={200}
                className="mx-auto mb-8 group-hover:drop-shadow-2xl transition-all duration-500"
                priority
              />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-[#4B63BF] mb-8 animate-pulse">
              КРЕАТИВ, ТЕХНОЛОГИИ, БУДУЩЕЕ
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 mb-12 border border-[#4B63BF]/20 hover:shadow-xl transition-all duration-500 hover:scale-105 hover:bg-white/90">
            <h2 className="text-2xl font-bold text-[#4B63BF] mb-6">КОНТАКТЫ</h2>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <a
                href="https://t.me/noxel"
                className="flex items-center gap-3 text-[#4B63BF] hover:text-[#3a4f99] transition-all duration-300 hover:scale-110 group"
              >
                <div className="w-8 h-8 bg-[#4B63BF] rounded-full flex items-center justify-center group-hover:bg-[#3a4f99] transition-all duration-300 group-hover:rotate-12">
                  <span className="text-white text-sm font-bold">T</span>
                </div>
                <span className="font-medium">Telegram</span>
              </a>
              <a
                href="mailto:info@noxel.ru"
                className="flex items-center gap-3 text-[#4B63BF] hover:text-[#3a4f99] transition-all duration-300 hover:scale-110 group"
              >
                <div className="w-8 h-8 bg-[#4B63BF] rounded-full flex items-center justify-center group-hover:bg-[#3a4f99] transition-all duration-300 group-hover:rotate-12">
                  <span className="text-white text-sm">@</span>
                </div>
                <span className="font-medium">info@noxel.ru</span>
              </a>
              <a
                href="tel:+79999999999"
                className="flex items-center gap-3 text-[#4B63BF] hover:text-[#3a4f99] transition-all duration-300 hover:scale-110 group"
              >
                <div className="w-8 h-8 bg-[#4B63BF] rounded-full flex items-center justify-center group-hover:bg-[#3a4f99] transition-all duration-300 group-hover:rotate-12">
                  <span className="text-white text-sm">📞</span>
                </div>
                <span className="font-medium">+7 (999) 999-99-99</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        id="timeline"
        className="py-16 px-4 bg-gradient-to-r from-white/70 to-blue-50/70 relative overflow-hidden"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-[#4B63BF] text-center mb-8">КАК МЫ СОЗДАЕМ САЙТЫ</h2>

          <div className="text-center mb-16">
            <p className="text-xl md:text-2xl text-gray-700 font-medium leading-relaxed max-w-4xl mx-auto">
              <span className="text-[#4B63BF] font-bold">От искры идеи</span> до{" "}
              <span className="text-[#4B63BF] font-bold">живого цифрового решения</span> — мы превращаем ваши мечты в{" "}
              <span className="text-[#4B63BF] font-bold">интерактивную реальность</span>, где каждый клик ведет к успеху
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gray-200 rounded-full">
              <div
                className="w-full bg-gradient-to-b from-[#4B63BF] to-[#3a4f99] rounded-full transition-all duration-1000 ease-out"
                style={{ height: `${timelineProgress * 100}%` }}
              />
            </div>

            <div className="space-y-16">
              {timelineSteps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center ${index % 2 === 0 ? "flex-row" : "flex-row-reverse"} gap-8 relative transition-all duration-700 ${
                    timelineProgress > index / timelineSteps.length
                      ? "opacity-100 translate-y-0"
                      : "opacity-50 translate-y-8"
                  }`}
                >
                  <div className={`flex-1 ${index % 2 === 0 ? "text-right pr-8" : "text-left pl-8"}`}>
                    <Card className="bg-white/90 border-[#4B63BF]/20 hover:border-[#4B63BF]/40 transition-all duration-500 hover:shadow-xl hover:scale-105 group cursor-pointer hover:bg-gradient-to-br hover:from-white hover:to-blue-50/30">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-[#4B63BF] mb-2 group-hover:scale-105 transition-transform duration-300">
                          {step.title}
                        </h3>
                        <p className="text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
                          {step.description}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="relative z-10">
                    <div
                      className={`w-16 h-16 rounded-full bg-white border-4 border-[#4B63BF] flex items-center justify-center text-2xl transition-all duration-500 hover:scale-125 hover:rotate-12 cursor-pointer ${
                        timelineProgress > index / timelineSteps.length ? "shadow-lg animate-pulse" : ""
                      }`}
                    >
                      {step.icon}
                    </div>
                  </div>

                  <div className="flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="py-16 px-4 bg-white/50 relative">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-[#4B63BF] text-center mb-12">НАШИ УСЛУГИ</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-white/80 border-[#4B63BF]/20 hover:border-[#4B63BF]/40 transition-all duration-500 hover:shadow-lg hover:scale-105 group cursor-pointer hover:bg-gradient-to-br hover:from-white hover:to-blue-50/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-[#4B63BF] mb-3 group-hover:scale-105 transition-transform duration-300">
                  Создание веб-приложений любой сложности — от лендингов до интернет-магазинов
                </h3>
                <p className="text-gray-700 text-sm group-hover:text-gray-800 transition-colors duration-300">
                  Создание веб-приложений любой сложности: модульные архитектуры, высокая производительность, надёжная
                  типизация
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-[#4B63BF]/20 hover:border-[#4B63BF]/40 transition-all duration-500 hover:shadow-lg hover:scale-105 group cursor-pointer hover:bg-gradient-to-br hover:from-white hover:to-blue-50/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-[#4B63BF] mb-3 group-hover:scale-105 transition-transform duration-300">
                  Интеграция нейросетей и AI-API
                </h3>
                <p className="text-gray-700 text-sm group-hover:text-gray-800 transition-colors duration-300">
                  Подключение GPT, Groq, Gemini, DALL·E и других моделей для чат-ботов, ассистентов, генераторов
                  контента и персонализации
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-[#4B63BF]/20 hover:border-[#4B63BF]/40 transition-all duration-500 hover:shadow-lg hover:scale-105 group cursor-pointer hover:bg-gradient-to-br hover:from-white hover:to-blue-50/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-[#4B63BF] mb-3 group-hover:scale-105 transition-transform duration-300">
                  Single Page Applications (SPA)
                </h3>
                <p className="text-gray-700 text-sm group-hover:text-gray-800 transition-colors duration-300">
                  Максимальная скорость, плавная навигация, реактивный пользовательский опыт
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-[#4B63BF]/20 hover:border-[#4B63BF]/40 transition-all duration-500 hover:shadow-lg hover:scale-105 group cursor-pointer hover:bg-gradient-to-br hover:from-white hover:to-blue-50/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-[#4B63BF] mb-3 group-hover:scale-105 transition-transform duration-300">
                  SSR / SSG (Next.js / Remix)
                </h3>
                <p className="text-gray-700 text-sm group-hover:text-gray-800 transition-colors duration-300">
                  Продвинутая SEO-оптимизация, быстрая загрузка страниц и гибкая генерация контента
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-[#4B63BF]/20 hover:border-[#4B63BF]/40 transition-all duration-500 hover:shadow-lg hover:scale-105 group cursor-pointer hover:bg-gradient-to-br hover:from-white hover:to-blue-50/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-[#4B63BF] mb-3 group-hover:scale-105 transition-transform duration-300">
                  Progressive Web Applications (PWA)
                </h3>
                <p className="text-gray-700 text-sm group-hover:text-gray-800 transition-colors duration-300">
                  Поведение как у мобильных приложений — offline-режим, push-уведомления, установка на устройство
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-[#4B63BF]/20 hover:border-[#4B63BF]/40 transition-all duration-500 hover:shadow-lg hover:scale-105 group cursor-pointer hover:bg-gradient-to-br hover:from-white hover:to-blue-50/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-[#4B63BF] mb-3 group-hover:scale-105 transition-transform duration-300">
                  Интеграции с API и внешними сервисами
                </h3>
                <p className="text-gray-700 text-sm group-hover:text-gray-800 transition-colors duration-300">
                  REST, GraphQL, Firebase, Stripe, карты, SaaS — мощная связка клиент-сервер
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-[#4B63BF]/20 hover:border-[#4B63BF]/40 transition-all duration-500 hover:shadow-lg hover:scale-105 group cursor-pointer hover:bg-gradient-to-br hover:from-white hover:to-blue-50/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-[#4B63BF] mb-3 group-hover:scale-105 transition-transform duration-300">
                  Адаптивная верстка
                </h3>
                <p className="text-gray-700 text-sm group-hover:text-gray-800 transition-colors duration-300">
                  Используем Tailwind, Styled Components, CSS Modules — идеальный внешний вид на всех экранах
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-[#4B63BF]/20 hover:border-[#4B63BF]/40 transition-all duration-500 hover:shadow-lg hover:scale-105 group cursor-pointer hover:bg-gradient-to-br hover:from-white hover:to-blue-50/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-[#4B63BF] mb-3 group-hover:scale-105 transition-transform duration-300">
                  Многоязычные сайты (i18n)
                </h3>
                <p className="text-gray-700 text-sm group-hover:text-gray-800 transition-colors duration-300">
                  Локализация и международная адаптация с использованием i18next, LinguiJS, Next Translate
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-[#4B63BF]/20 hover:border-[#4B63BF]/40 transition-all duration-500 hover:shadow-lg hover:scale-105 group cursor-pointer hover:bg-gradient-to-br hover:from-white hover:to-blue-50/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-[#4B63BF] mb-3 group-hover:scale-105 transition-transform duration-300">
                  Разработка UI-компонентов
                </h3>
                <p className="text-gray-700 text-sm group-hover:text-gray-800 transition-colors duration-300">
                  Кастомные интерфейсы: таблицы, фильтры, калькуляторы, drag'n'drop, графики, анимации
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-[#4B63BF]/20 hover:border-[#4B63BF]/40 transition-all duration-500 hover:shadow-lg hover:scale-105 group cursor-pointer hover:bg-gradient-to-br hover:from-white hover:to-blue-50/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-[#4B63BF] mb-3 group-hover:scale-105 transition-transform duration-300">
                  Интеграция с Headless CMS
                </h3>
                <p className="text-gray-700 text-sm group-hover:text-gray-800 transition-colors duration-300">
                  Подключение к Strapi, Sanity, Contentful, Hygraph — управление контентом вне фронта
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-[#4B63BF]/20 hover:border-[#4B63BF]/40 transition-all duration-500 hover:shadow-lg hover:scale-105 group cursor-pointer hover:bg-gradient-to-br hover:from-white hover:to-blue-50/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-[#4B63BF] mb-3 group-hover:scale-105 transition-transform duration-300">
                  Работа с CRM, аналитикой и ERP
                </h3>
                <p className="text-gray-700 text-sm group-hover:text-gray-800 transition-colors duration-300">
                  Интеграции с Bitrix24, HubSpot, GA4, Amplitude, RetailCRM и другими системами
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-[#4B63BF]/20 hover:border-[#4B63BF]/40 transition-all duration-500 hover:shadow-lg hover:scale-105 group cursor-pointer hover:bg-gradient-to-br hover:from-white hover:to-blue-50/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-[#4B63BF] mb-3 group-hover:scale-105 transition-transform duration-300">
                  Поддержка Agile / SCRUM
                </h3>
                <p className="text-gray-700 text-sm group-hover:text-gray-800 transition-colors duration-300">
                  Командная разработка, спринты, быстрая обратная связь, документация и планирование
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="portfolio" className="py-16 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-[#4B63BF] text-center mb-12">ПОРТФОЛИО</h2>

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
                className="bg-white/90 border-[#4B63BF]/20 hover:border-[#4B63BF]/40 transition-all duration-300 hover:shadow-xl hover:scale-105 group"
              >
                <CardContent className="p-0">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <Image
                      src={project.image || "/placeholder.svg"}
                      alt={project.title}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-[#4B63BF]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-[#4B63BF] mb-3">{project.title}</h3>
                    <p className="text-gray-700 text-sm mb-4">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.tech.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-3 py-1 bg-[#4B63BF]/10 text-[#4B63BF] text-xs rounded-full font-medium"
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
          <h2 className="text-4xl font-bold text-[#4B63BF] text-center mb-12">О НАС</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
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
            <div className="relative">
              <Image
                src="/placeholder.svg?height=400&width=500"
                alt="Команда NOXEL"
                width={500}
                height={400}
                className="rounded-2xl shadow-xl hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-[#4B63BF] mb-8">ОСНОВАТЕЛИ АГЕНТСТВА</h3>
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
                className="bg-white/90 border-[#4B63BF]/20 hover:border-[#4B63BF]/40 transition-all duration-300 hover:shadow-xl hover:scale-105 group"
              >
                <CardContent className="p-8 text-center">
                  <div className="relative mb-6">
                    <Image
                      src={founder.image || "/placeholder.svg"}
                      alt={founder.name}
                      width={200}
                      height={200}
                      className="w-32 h-32 rounded-full mx-auto object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <h4 className="text-xl font-bold text-[#4B63BF] mb-2">{founder.name}</h4>
                  <p className="text-[#4B63BF]/70 font-medium mb-4">{founder.position}</p>
                  <p className="text-gray-700 leading-relaxed">{founder.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="contacts" className="py-16 px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#4B63BF] mb-6">Готовы обсудить ваш проект?</h2>
          <p className="text-xl text-gray-700 mb-8">Свяжитесь с нами для консультации и обсуждения деталей</p>
          <Button size="lg" className="bg-[#4B63BF] hover:bg-[#3a4f99] text-white px-12 py-4 text-lg rounded-xl">
            Связаться с нами
          </Button>
        </div>
      </section>

      <footer className="py-8 px-4 bg-[#4B63BF]/5 border-t border-[#4B63BF]/20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-2xl font-bold text-[#4B63BF] mb-4">NOXEL</div>
          <p className="text-gray-600">© 2024 NOXEL. Креатив, технологии, будущее.</p>
        </div>
      </footer>
    </div>
  )
}
