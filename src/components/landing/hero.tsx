import { Button } from "@/components/landing/ui/button"
import { Sparkles, Mic } from "lucide-react"

export function Hero() {
  return (
    <section className="py-20 md:py-32 px-4 relative">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-primary/20 shadow-lg shadow-primary/5">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-gradient-gemini">AI-Powered Podcast Creation</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-balance leading-[1.1] tracking-tight">
            Your podcast team,
            <br />
            <span className="text-gradient-gemini">powered by AI</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed font-medium">
            Meet your three AI agents that handle everything from ideation to production. Launch your podcast with the
            support of a full creative team.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              className="text-base font-semibold px-8 h-12 bg-gradient-to-r from-chart-1 via-chart-5 to-chart-4 hover:opacity-90 transition-all hover:scale-105 shadow-xl shadow-primary/25"
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Creating
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base font-semibold px-8 h-12 glass border-border/50 bg-transparent hover:bg-white/50"
            >
              Watch Demo
            </Button>
          </div>

          <div className="pt-8 text-sm text-muted-foreground font-medium">
            From zero to published in days, not months
          </div>
        </div>
      </div>
    </section>
  )
}
