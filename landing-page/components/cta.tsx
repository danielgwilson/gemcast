import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-chart-4/20 to-accent/20" />
      <div className="absolute inset-0 glass" />

      <div className="container mx-auto max-w-4xl text-center space-y-8 relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold text-balance">
          Ready to launch your{' '}
          <span className="bg-gradient-to-r from-primary via-chart-4 to-accent bg-clip-text text-transparent">
            podcast?
          </span>
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
          Join creators who are turning their podcast dreams into reality with
          GEMCAST's AI-powered team
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button
            size="lg"
            className="text-base px-8 h-12 bg-gradient-to-r from-primary to-chart-4 hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
          >
            Start Your Podcast
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-base px-8 h-12 glass border-border/50 bg-transparent"
          >
            Schedule a Demo
          </Button>
        </div>
        <div className="pt-4 text-sm text-muted-foreground">
          No credit card required · Get started in minutes
        </div>
      </div>
    </section>
  );
}
