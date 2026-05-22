import React from 'react';
import { Heart, Mail, Phone, Code2 } from 'lucide-react';
import Logo from './Logo';

const Footer: React.FC = () => {
  return (
    <footer>
      {/* Top — light blue */}
      <div className="bg-primary-500 text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

            {/* Col 1 — Our Mission */}
            <div className="flex flex-col gap-4">
              <p className="text-xs font-bold uppercase tracking-widest text-white">
                Our Mission
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <span className="text-base">🌱</span>
                  <p className="text-sm text-white leading-relaxed">
                    Mental health support should be accessible to everyone.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-base">🤝</span>
                  <p className="text-sm text-white leading-relaxed">
                    We combine technology with care to guide your wellbeing journey.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-base">💙</span>
                  <p className="text-sm text-white leading-relaxed">
                    Always here — not to replace care, but to support it.
                  </p>
                </div>
              </div>
            </div>

            {/* Col 2 — Brand center */}
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 rounded-full p-0.5 ring-1 ring-white/40">
                  <Logo />
                </div>
                <span className="text-xl font-bold text-white">MindfulCheck</span>
              </div>
              <p className="text-white text-sm leading-relaxed max-w-xs">
                Self-assessment tools, personalized insights, and professional
                guidance for your mental health journey.
              </p>
              <div className="flex items-center gap-1 text-white/80 text-xs">
                <span>Made with</span>
                <Heart size={11} className="text-red-200 fill-red-200" />
                <span>for better mental health</span>
              </div>
            </div>

            {/* Col 3 — Contact */}
            <div className="flex flex-col items-center md:items-end gap-4">
              <p className="text-xs font-bold uppercase tracking-widest text-white">
                Contact Us
              </p>
              <a href="mailto:support@MindfulCheck.com"
                className="flex items-center gap-2 text-sm text-white hover:text-white/70 transition-colors">
                <Mail size={14} className="text-white shrink-0" />
                <span>support@MindfulCheck.com</span>
              </a>
              <a href="tel:+918125052430"
                className="flex items-center gap-2 text-sm text-white hover:text-white/70 transition-colors">
                <Phone size={14} className="text-white shrink-0" />
                <span>+91 81250 52430</span>
              </a>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom — white, centered */}
      <div className="bg-white border-t border-gray-100">
        <div className="container mx-auto px-6 py-4 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5">
            <Code2 size={13} className="text-primary-500" />
            <span className="text-sm font-semibold text-primary-600">
              Designed &amp; Developed by B. Poojitha
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            &copy; {new Date().getFullYear()} MindfulCheck. All rights reserved.
          </p>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
