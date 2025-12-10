import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Users, Video, MessageSquare, Calendar, Shield, Zap, Star } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen hero-gradient text-foreground overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-200/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">LiveClass</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition">Features</Link>
            <Link href="#testimonials" className="text-sm text-gray-600 hover:text-gray-900 transition">Testimonials</Link>
            <Link href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white border-0">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 animate-fade-in">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-600">Trusted by 10,000+ educators worldwide</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-slide-up text-gray-900">
              The Future of
              <span className="block gradient-text">Live Learning</span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Create immersive live classes with real-time video, interactive chat, and powerful course management. Built for educators who demand excellence.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Link href="/sign-up">
                <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white animate-pulse-glow">
                  Start Teaching Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 py-6 text-lg border-gray-300 hover:bg-gray-100 text-gray-700 gap-2">
                <Play className="w-5 h-5" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text">50K+</div>
                <div className="text-sm text-gray-500 mt-1">Active Students</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text">10K+</div>
                <div className="text-sm text-gray-500 mt-1">Live Classes</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text">99.9%</div>
                <div className="text-sm text-gray-500 mt-1">Uptime</div>
              </div>
            </div>
          </div>

          {/* Hero Image/Preview */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
            <div className="glass-card rounded-2xl p-2 glow-purple animate-float">
              <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-100/80">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-4 text-sm text-gray-500">Live Classroom</span>
                </div>
                <div className="grid grid-cols-4 gap-4 p-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-video bg-gradient-to-br from-purple-100 to-cyan-100 rounded-lg flex items-center justify-center border border-gray-100">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              Everything You Need to
              <span className="gradient-text"> Teach Online</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Powerful features designed for modern educators. Create engaging learning experiences that students love.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Video, title: "HD Video Streaming", desc: "Crystal clear video with adaptive quality for any connection", color: "from-purple-100 to-purple-50" },
              { icon: MessageSquare, title: "Real-time Chat", desc: "Engage students with instant messaging and reactions", color: "from-cyan-100 to-cyan-50" },
              { icon: Users, title: "Unlimited Students", desc: "Scale your classes to hundreds of students effortlessly", color: "from-blue-100 to-blue-50" },
              { icon: Calendar, title: "Smart Scheduling", desc: "Schedule sessions with automatic timezone conversion", color: "from-emerald-100 to-emerald-50" },
              { icon: Shield, title: "Enterprise Security", desc: "Bank-grade encryption for all your class data", color: "from-orange-100 to-orange-50" },
              { icon: Zap, title: "Lightning Fast", desc: "Sub-second latency for real-time interactions", color: "from-yellow-100 to-yellow-50" },
            ].map((feature, i) => (
              <div
                key={i}
                className="glass-card rounded-2xl p-6 card-hover group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              Loved by <span className="gradient-text">Educators</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Dr. Sarah Chen", role: "University Professor", quote: "LiveClass transformed how I teach. The engagement tools are incredible." },
              { name: "Marcus Johnson", role: "Coding Bootcamp", quote: "Best platform for technical courses. Screen sharing just works." },
              { name: "Emily Rodriguez", role: "Music Instructor", quote: "The audio quality is perfect for my music lessons. Students love it!" },
            ].map((testimonial, i) => (
              <div key={i} className="glass-card rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-cyan-400" />
                  <div>
                    <div className="font-medium text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-cyan-100/50" />
            <div className="relative">
              <h2 className="text-4xl font-bold mb-4 text-gray-900">
                Ready to Transform Your Teaching?
              </h2>
              <p className="text-gray-600 mb-8 max-w-xl mx-auto">
                Join thousands of educators already using LiveClass. Start for free, no credit card required.
              </p>
              <Link href="/sign-up">
                <Button size="lg" className="px-8 py-6 text-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white">
                  Get Started for Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text">LiveClass</span>
          </div>
          <div className="text-sm text-gray-500">
            © 2024 LiveClass. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-sm text-gray-500 hover:text-gray-900 transition">Privacy</Link>
            <Link href="#" className="text-sm text-gray-500 hover:text-gray-900 transition">Terms</Link>
            <Link href="#" className="text-sm text-gray-500 hover:text-gray-900 transition">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
