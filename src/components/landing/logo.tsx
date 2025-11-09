export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-10">
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-pink-500 to-yellow-500 opacity-20 blur-md"></div>

        {/* Microphone icon with colorful gradient sections */}
        <svg viewBox="0 0 32 40" className="relative w-8 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Microphone capsule/head - gradient top to bottom */}
          <rect x="8" y="4" width="16" height="20" rx="8" fill="url(#gradient-mic-body)" className="drop-shadow-lg" />

          {/* Microphone grill lines for detail */}
          <line x1="10" y1="8" x2="22" y2="8" stroke="white" strokeWidth="1" opacity="0.3" />
          <line x1="10" y1="12" x2="22" y2="12" stroke="white" strokeWidth="1" opacity="0.3" />
          <line x1="10" y1="16" x2="22" y2="16" stroke="white" strokeWidth="1" opacity="0.3" />
          <line x1="10" y1="20" x2="22" y2="20" stroke="white" strokeWidth="1" opacity="0.3" />

          {/* Bottom arc/bracket */}
          <path
            d="M 6 24 Q 6 30, 16 30 Q 26 30, 26 24"
            stroke="url(#gradient-bracket)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            className="drop-shadow"
          />

          {/* Center line/stand */}
          <line
            x1="16"
            y1="30"
            x2="16"
            y2="36"
            stroke="url(#gradient-stand)"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="drop-shadow"
          />

          {/* Base */}
          <line
            x1="11"
            y1="36"
            x2="21"
            y2="36"
            stroke="url(#gradient-base)"
            strokeWidth="3"
            strokeLinecap="round"
            className="drop-shadow"
          />

          {/* Gradients */}
          <defs>
            {/* Main microphone body - vibrant multi-color */}
            <linearGradient id="gradient-mic-body" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="33%" stopColor="#14b8a6" />
              <stop offset="66%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>

            {/* Bracket - pink to yellow */}
            <linearGradient id="gradient-bracket" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>

            {/* Stand - teal to blue */}
            <linearGradient id="gradient-stand" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>

            {/* Base - magenta to purple */}
            <linearGradient id="gradient-base" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d946ef" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {/* GEMCAST text */}
      <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-pink-600 to-yellow-600 bg-clip-text text-transparent">
        GEMCAST
      </div>
    </div>
  )
}
