import { type ReactNode } from 'react';
import { Heart, ArrowLeft } from 'lucide-react';
import { Link } from '@/lib/router';
import { useLanguage } from '@/lib/language-context';
import type { TranslationKey } from '@/lib/i18n';

export function PublicPage({ page }: { page: 'about' | 'safety' | 'guidelines' | 'privacy' | 'terms' | 'contact' }) {
  const { t } = useLanguage();

  const titles: Record<string, TranslationKey> = {
    about: 'about.title',
    safety: 'safety.title',
    guidelines: 'guidelines.title',
    privacy: 'privacy.title',
    terms: 'terms.title',
    contact: 'contact.title',
  };

  const descs: Record<string, TranslationKey> = {
    about: 'about.desc',
    safety: 'safety.desc',
    guidelines: 'guidelines.desc',
    privacy: 'privacy.desc',
    terms: 'terms.desc',
    contact: 'contact.desc',
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <nav className="border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center gap-4">
        <Link to="/" className="btn-ghost btn-sm"><ArrowLeft size={18} /> {t('common.back')}</Link>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
            <Heart size={16} className="text-white" fill="white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white">siyvaruli.ge</span>
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{t(titles[page])}</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">{t(descs[page])}</p>

        <div className="prose dark:prose-invert max-w-none">
          {page === 'about' && <AboutContent />}
          {page === 'safety' && <SafetyContent />}
          {page === 'guidelines' && <GuidelinesContent />}
          {page === 'privacy' && <PrivacyContent />}
          {page === 'terms' && <TermsContent />}
          {page === 'contact' && <ContactContent />}
        </div>
      </div>

      <footer className="border-t border-gray-100 dark:border-gray-800 py-8 px-6 text-center text-sm text-gray-400">
        © 2026 siyvaruli.ge
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
      <div className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

function AboutContent() {
  const { t } = useLanguage();
  return (
    <>
      <Section title={t('about.title')}>
        <p>{t('about.desc')}</p>
        <p>siyvaruli.ge არის სრულიად უფასო პლატფორმა. ყველა ფუნქცია — მატჩები, შეტყობინებები, მოწონებები — უფასოა და ყოველთვის იქნება.</p>
      </Section>
      <Section title="რა ვსაქმობთ">
        <p>ჩვენ ვქმნით უსაფრთხო და თანაბარ გარემოს, სადაც ადამიანებს შეუძლიათ გაიცნონ ერთმანეთი საქართველოს მასშტაბით.</p>
      </Section>
    </>
  );
}

function SafetyContent() {
  return (
    <>
      <Section title="უსაფრთხოება">
        <p>თქვენი უსაფრთხოება ჩვენთვის პრიორიტეტია. აქ მოცემულია რამდენიმე რჩევა:</p>
        <p>• დაბლოკეთ და დაარეპორტეთ ნებისმიერი მომხმარებელი, რომელიც თქვენს მიმართ არასათანადოდ იქცევა.</p>
        <p>• არასოდეს გააზიაროთ პირადი ინფორმაცია (მისამართი, ბანკის დეტალები) პირველივე მატჩთან.</p>
        <p>• გაიარეთ ვერიფიკაცია, რათა სხვებმა იცოდნენ, რომ თქვენი პროფილი ნამდვილია.</p>
        <p>• შეხვდით ადამიანებს საჯარო ადგილებში პირველად.</p>
      </Section>
    </>
  );
}

function GuidelinesContent() {
  return (
    <>
      <Section title="საზოგადოების წესები">
        <p>1. იყავით პატივსაცემი და თანამოსაუბრე.</p>
        <p>2. არ გამოიყენოთ სიძულილის ენა ან შევიწროება.</p>
        <p>3. არ შექმნათ ყალბი პროფილები.</p>
        <p>4. არ გაგზავნოთ სპამი ან თაღლითობა.</p>
        <p>5. იყავით 18 წლის ან უფროსი.</p>
        <p>6. პატივი სცეთ სხვების პრივაციას.</p>
      </Section>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <Section title="პრივაციის პოლიტიკა">
        <p>თქვენი მონაცემების დაცვა ჩვენთვის მნიშვნელოვანია.</p>
        <p>• თქვენი ელ-ფოსტა არასოდეს ჩანს სხვებისთვის.</p>
        <p>• თქვენ შეგიძლიათ დაბლოკოთ ნებისმიერი მომხმარებელი.</p>
        <p>• თქვენ შეგიძლიათ წაშალოთ თქვენი ანგარიში ნებისმიერ დროს.</p>
        <p>• ჩვენ არ ვყიდით თქვენს მონაცემებს მესამე პირებს.</p>
      </Section>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <Section title="მომსახურების პირობები">
        <p>პლატფორმის გამოყენებით თქვენ ეთანხმებით შემდეგ პირობებს:</p>
        <p>• თქვენ ხართ 18 წლის ან უფროსი.</p>
        <p>• თქვენ არ შექმნით ყალბ პროფილებს.</p>
        <p>• თქვენ არ გამოიყენებთ პლატფორმას უკანონო მიზნებისთვის.</p>
        <p>• პლატფორმა სრულიად უფასოა.</p>
      </Section>
    </>
  );
}

function ContactContent() {
  return (
    <Section title="კონტაქტი">
      <p>გაქვთ კითხვა? დაგვიკავშირდით:</p>
      <p>ელ-ფოსტა: support@siyvaruli.ge</p>
    </Section>
  );
}
