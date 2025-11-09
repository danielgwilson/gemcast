import { Card } from "@/components/landing/ui/card"
import { Lightbulb, Calendar, Sparkles } from "lucide-react"

const agents = [
  {
    name: "Ida",
    role: "The Idea Agent",
    icon: Lightbulb,
    description: "Your brand strategist and content architect",
    features: [
      "Develops your podcast concept and positioning",
      "Creates content pillars tailored to your niche",
      "Generates episode ideas that resonate",
      "Gets you to your first 3 episodes fast",
      "Always available for new episode brainstorming",
    ],
    gradient: "from-chart-1 to-chart-2",
    iconBg: "bg-chart-1/15",
    iconColor: "text-chart-1",
  },
  {
    name: "Astra",
    role: "The Accountability Agent",
    icon: Calendar,
    description: "Your AI project manager keeping you on track",
    features: [
      "Syncs with Google Calendar for scheduling",
      "Manages files and assets in Google Drive",
      "Sends reminders and tracks deadlines",
      "Coordinates workflow between all agents",
      "Keeps your podcast production moving forward",
    ],
    gradient: "from-chart-4 to-chart-5",
    iconBg: "bg-chart-4/15",
    iconColor: "text-chart-4",
  },
  {
    name: "Ember",
    role: "The Episode Planner",
    icon: Sparkles,
    description: "Your content specialist and production expert",
    features: [
      "Plans compelling episode content that hooks listeners",
      "Structures episodes for maximum engagement",
      "Assists with post-production editing",
      "Optimizes content for discoverability",
      "Ensures every episode is fire before it goes live",
    ],
    gradient: "from-chart-3 to-chart-2",
    iconBg: "bg-chart-3/15",
    iconColor: "text-chart-3",
  },
]

export function AgentCards() {
  return (
    <section id="agents" className="py-20 px-4 relative">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-balance tracking-tight">
            Meet your <span className="text-gradient-gemini">AI podcast team</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance font-medium">
            Three specialized agents working together to bring your podcast vision to life
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {agents.map((agent) => {
            const Icon = agent.icon
            return (
              <Card
                key={agent.name}
                className="p-8 glass-strong hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:scale-[1.02] border-border/50"
              >
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div
                      className={`inline-flex p-3 rounded-2xl ${agent.iconBg} ${agent.iconColor} shadow-lg border border-current/10`}
                    >
                      <Icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold tracking-tight">{agent.name}</h3>
                      <p
                        className={`text-sm font-semibold bg-gradient-to-r ${agent.gradient} bg-clip-text text-transparent`}
                      >
                        {agent.role}
                      </p>
                    </div>
                  </div>

                  <p className="text-muted-foreground leading-relaxed font-medium">{agent.description}</p>

                  <ul className="space-y-3">
                    {agent.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div
                          className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${agent.gradient} mt-2 flex-shrink-0 shadow-sm`}
                        />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
