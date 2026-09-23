import { Heart, Compass, Users, MessageCircle, Shield, BadgeCheck, Lock, MapPin, ArrowRight } from 'lucide-react';
import { Link } from '@/lib/router';
import { useLanguage } from '@/lib/language-context';
import { GEORGIAN_CITIES } from '@/lib/constants';

export function LandingPage() {
  const { t } = useLanguage();

  const steps = [
    { icon: <Heart size={28} />, title: t('landing.step1'), desc: t('landing.step1Desc') },
    { icon: <Compass size={28} />, title: t('landing.step2'), desc: t('landing.step2Desc') },
    { icon: <Users size={28} />, title: t('landing.step3'), desc: t('landing.step3Desc') },
    { icon: <MessageCircle size={28} />, title: t('landing.step4'), desc: t('landing.step4Desc') },
  ];

  const safetyFeatures = [
    { icon: <Shield size={24} />, title: t('landing.safetyBlock'), desc: t('landing.safetyBlockDesc') },
    { icon: <BadgeCheck size={24} />, title: t('landing.safetyVerify'), desc: t('landing.safetyVerifyDesc') },
    { icon: <Lock size={24} />, title: t('landing.safetyPrivacy'), desc: t('landing.safetyPrivacyDesc') },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Nav */}
      <nav className="absolute top-0 left-0 right-0 z-20 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
            <Heart size={20} className="text-white" fill="white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">siyvaruli<span className="text-primary-500">.ge</span></span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link to="/login" className="btn-ghost btn-sm">{t('landing.login')}</Link>
          <Link to="/signup" className="btn-primary btn-sm">{t('landing.signupFree')}</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-primary-50/50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary-200/30 dark:bg-primary-900/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent-200/20 dark:bg-accent-900/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center pt-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 text-sm font-medium mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            {t('landing.freeForever')}
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 animate-fade-in-up tracking-tight">
            {t('landing.heroTitle')}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto animate-fade-in-up leading-relaxed">
            {t('landing.heroSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up">
            <Link to="/signup" className="btn-primary btn-lg w-full sm:w-auto">
              {t('landing.signupFree')}
              <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="btn-secondary btn-lg w-full sm:w-auto">
              {t('landing.login')}
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">{t('landing.howItWorks')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {steps.map((step, i) => (
              <div key={i} className="card p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center mx-auto mb-4 text-primary-500">
                  {step.icon}
                </div>
                <div className="text-sm font-bold text-primary-500 mb-1">0{i + 1}</div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free banner */}
      <section className="py-16 px-6 bg-primary-500">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-3">{t('landing.freeForever')}</h2>
          <p className="text-lg text-primary-100 mb-0">{t('landing.freeDesc')}</p>
        </div>
      </section>

      {/* Safety */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">{t('landing.safetyTitle')}</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-xl mx-auto">{t('landing.safetyDesc')}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {safetyFeatures.map((f, i) => (
              <div key={i} className="card p-6">
                <div className="w-12 h-12 rounded-xl bg-success-50 dark:bg-success-700/20 flex items-center justify-center mb-4 text-success-600 dark:text-success-500">
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="py-20 px-6 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">{t('landing.citiesTitle')}</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12">{t('landing.citiesDesc')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {GEORGIAN_CITIES.slice(0, 7).map((city) => (
              <div key={city} className="flex items-center gap-2 px-5 py-3 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors cursor-default">
                <MapPin size={16} className="text-primary-500" />
                <span className="font-medium text-gray-700 dark:text-gray-300">{city}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-primary-50/50 dark:from-gray-950 dark:to-gray-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">{t('landing.ctaTitle')}</h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">{t('landing.ctaDesc')}</p>
          <Link to="/signup" className="btn-primary btn-lg">
            {t('landing.signupFree')}
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <Heart size={16} className="text-white" fill="white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white">siyvaruli.ge</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <Link to="/about" className="hover:text-primary-500">{t('about.title')}</Link>
              <Link to="/safety" className="hover:text-primary-500">{t('safety.title')}</Link>
              <Link to="/guidelines" className="hover:text-primary-500">{t('guidelines.title')}</Link>
              <Link to="/privacy" className="hover:text-primary-500">{t('privacy.title')}</Link>
              <Link to="/terms" className="hover:text-primary-500">{t('terms.title')}</Link>
              <Link to="/contact" className="hover:text-primary-500">{t('contact.title')}</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-gray-400">
            <p>© 2026 siyvaruli.ge. {t('landing.footerRights')}</p>
            <p>{t('landing.footerMadeWith')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="flex items-center rounded-full bg-gray-100 dark:bg-gray-800 p-0.5 text-sm">
      <button
        onClick={() => setLang('ka')}
        className={`px-3 py-1 rounded-full font-medium transition-colors ${lang === 'ka' ? 'bg-white dark:bg-gray-700 text-primary-500 shadow-sm' : 'text-gray-500'}`}
      >
        ქართული
      </button>
      <button
        onClick={() => setLang('en')}
        className={`px-3 py-1 rounded-full font-medium transition-colors ${lang === 'en' ? 'bg-white dark:bg-gray-700 text-primary-500 shadow-sm' : 'text-gray-500'}`}
      >
        English
      </button>
    </div>
  );
}
