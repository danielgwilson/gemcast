import { Header } from "@/components/landing/header"
import { Hero } from "@/components/landing/hero"
import { AgentCards } from "@/components/landing/agent-cards"
import { HowItWorks } from "@/components/landing/how-it-works"
import { CTA } from "@/components/landing/cta"
import { Footer } from "@/components/landing/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[700px] h-[700px] bg-chart-1/15 rounded-full blur-[180px] animate-pulse" />
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-chart-4/12 rounded-full blur-[160px] animate-pulse [animation-delay:1s]" />
        <div className="absolute bottom-1/4 right-1/3 w-[650px] h-[650px] bg-chart-2/15 rounded-full blur-[170px] animate-pulse [animation-delay:2s]" />
        <div className="absolute top-2/3 left-1/2 w-[550px] h-[550px] bg-chart-3/12 rounded-full blur-[150px] animate-pulse [animation-delay:1.5s]" />
        <div className="absolute bottom-1/3 left-1/4 w-[500px] h-[500px] bg-chart-5/10 rounded-full blur-[140px] animate-pulse [animation-delay:0.5s]" />
      </div>

      <Header />
      <main>
        <Hero />
        <AgentCards />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}

