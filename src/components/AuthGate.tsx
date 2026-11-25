import { useState } from 'react';
import {
  BarChart3,
  BookOpenCheck,
  ShoppingBasket,
  Wallet,
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { pickText } from '../i18n/dictionary';
import type { LanguageMode } from '../types/expense';

export function AuthGate() {
  const { signInWithGoogle, authError } = useFirebase();
  const [lang, setLang] = useState<LanguageMode>('both');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } finally {
      setSubmitting(false);
    }
  };

  const features = [
    {
      icon: Wallet,
      title: pickText(lang, {
        roman_urdu: 'Mahana Tankhwah aur Baqi Budget',
        english: 'Monthly Salary & Live Balance',
      }),
      desc: pickText(lang, {
        roman_urdu: 'Apni salary likhein aur har kharch ke baad bacha hua balance dekhein.',
        english: 'Set your monthly income and watch your remaining balance update automatically.',
      }),
    },
    {
      icon: BookOpenCheck,
      title: pickText(lang, {
        roman_urdu: 'Rozana Kharch ka Khata',
        english: 'Categorized Daily Expense Log',
      }),
      desc: pickText(lang, {
        roman_urdu: 'Har roz ka kharch category ke sath darj karein.',
        english: 'Log everyday cash, bank, or mobile wallet expenses in seconds.',
      }),
    },
    {
      icon: ShoppingBasket,
      title: pickText(lang, {
        roman_urdu: 'Poore Maheene ka Ration List',
        english: 'Month-Long Grocery Consumption',
      }),
      desc: pickText(lang, {
        roman_urdu: 'Atta, chawal, oil aur doodh ka istemaal aur bacha hua stock track karein.',
        english: 'Track planned quantities, daily consumption, and remaining kitchen stock.',
      }),
    },
    {
      icon: BarChart3,
      title: pickText(lang, {
        roman_urdu: 'Category ke Hisab se Summary',
        english: 'Monthly Category Reports',
      }),
      desc: pickText(lang, {
        roman_urdu: 'Kis mad mein kitna kharch hua, asaan report aur CSV export ke sath.',
        english: 'Clear category breakdowns, percentages, and downloadable CSV reports.',
      }),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between px-4 py-8 sm:px-8">
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between gap-4">
        <span className="font-display text-xl font-bold tracking-tight text-slate-900">
          HisaabKitab
        </span>

        <div
          className="inline-flex items-center p-1 bg-slate-200/70 rounded-xl"
          role="group"
          aria-label="Language mode"
        >
          {(
            [
              { id: 'both', label: 'Dono' },
              { id: 'roman_urdu', label: 'Roman Urdu' },
              { id: 'english', label: 'English' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setLang(opt.id)}
              className={`min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                lang === opt.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-5xl w-full mx-auto my-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-6 space-y-6">
          <p className="text-xs font-semibold tracking-wide text-emerald-700">
            {pickText(lang, {
              roman_urdu: 'Ghar aur Zaati Kharch ka Mukammal Hisab',
              english: 'Personal & Household Expense Ledger',
            })}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 leading-tight text-balance">
            {pickText(
              lang,
              {
                roman_urdu: 'Tankhwah, Rozana Kharch aur Mahana Ration — Ek Jagah.',
                english: 'Salary, Daily Expenses & Monthly Groceries — In One Place.',
              },
              ' — ',
            )}
          </h1>
          <p className="text-base text-slate-600 leading-relaxed max-w-xl">
            {pickText(
              lang,
              {
                roman_urdu:
                  'Apne har maheene ki tankhwah darj karein, rozana kharch ghatayein, aur ghar ke ration ka istemaal mehfooz cloud mein track karein.',
                english:
                  'Track your monthly budget with automatic running balances, itemized grocery consumption, and clear category summaries synced across devices.',
              },
              ' ',
            )}
          </p>

          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={handleLogin}
              disabled={submitting}
              className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-3 shadow-sm transition-all disabled:opacity-60 cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"
                />
              </svg>
              <span>
                {submitting
                  ? pickText(lang, { roman_urdu: 'Login ho raha hai...', english: 'Signing in...' })
                  : pickText(lang, {
                      roman_urdu: 'Google ke sath Shuru Karein',
                      english: 'Continue with Google',
                    })}
              </span>
            </button>

            {authError && (
              <p className="text-sm text-rose-700 font-medium" role="alert">
                {authError}
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-5">
          <h2 className="font-display text-base font-bold text-slate-900">
            {pickText(lang, {
              roman_urdu: 'Is App Mein Kya Shamil Hai',
              english: 'What You Can Track',
            })}
          </h2>
          <div className="divide-y divide-slate-100">
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="py-4 first:pt-1 last:pb-1 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-0.5 text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <footer className="max-w-5xl w-full mx-auto text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <span>HisaabKitab</span>
        <span>
          {pickText(lang, {
            roman_urdu: 'Mehfooz Cloud Sync',
            english: 'Secure Cloud Sync',
          })}
        </span>
      </footer>
    </div>
  );
}
