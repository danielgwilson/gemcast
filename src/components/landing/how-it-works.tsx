export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Define Your Vision",
      description:
        "Chat with Ida to develop your podcast concept, target audience, and content pillars. Get your first 3 episodes mapped out.",
      gradient: "from-chart-2 to-chart-5",
    },
    {
      number: "02",
      title: "Stay On Track",
      description:
        "Astra integrates with your Google Suite to schedule recording sessions, manage assets, and keep you accountable to your goals.",
      gradient: "from-chart-4 to-primary",
    },
    {
      number: "03",
      title: "Create & Polish",
      description:
        "Ember helps you plan engaging content and edit your episodes to perfection. From outline to published, she's got you covered.",
      gradient: "from-accent to-chart-1",
    },
    {
      number: "04",
      title: "Launch & Grow",
      description:
        "Publish consistently with your AI team supporting you every step. Come back to any agent anytime you need help.",
      gradient: "from-primary to-chart-3",
    },
  ]

  return (
    <section id="how-it-works" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-balance">
            From idea to{" "}
            <span className="bg-gradient-to-r from-primary via-chart-4 to-accent bg-clip-text text-transparent">
              published
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            Your AI team guides you through every stage of podcast creation
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex gap-6 glass-strong p-6 rounded-2xl hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="flex-shrink-0">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg`}
                >
                  <span className="text-2xl font-bold text-white">{step.number}</span>
                </div>
              </div>
              <div className="space-y-2 pt-1">
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
