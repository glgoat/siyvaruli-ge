import { type ReactNode } from 'react';
import { Heart, MessageCircle, User, ThumbsUp, Compass, Bell, Settings, LogOut, Shield } from 'lucide-react';
import { Link, useRouter } from '@/lib/router';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import type { TranslationKey } from '@/lib/i18n';

export function AppLayout({ children }: { children: ReactNode }) {
  const { path } = useRouter();
  const { profile, signOut } = useAuth();
  const { t } = useLanguage();

  const navItems: { to: string; icon: ReactNode; label: TranslationKey; badge?: number }[] = [
    { to: '/discover', icon: <Compass size={22} />, label: 'nav.discover' },
    { to: '/likes', icon: <ThumbsUp size={22} />, label: 'nav.likes' },
    { to: '/matches', icon: <Heart size={22} />, label: 'nav.matches' },
    { to: '/messages', icon: <MessageCircle size={22} />, label: 'nav.messages' },
    { to: '/profile', icon: <User size={22} />, label: 'nav.profile' },
  ];

  const desktopNav = [
    ...navItems,
    { to: '/notifications', icon: <Bell size={22} />, label: 'nav.notifications' as TranslationKey },
    { to: '/settings', icon: <Settings size={22} />, label: 'nav.settings' as TranslationKey },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 fixed h-screen z-30">
        <div className="p-6">
          <Link to="/discover" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
              <Heart size={20} className="text-white" fill="white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">siyvaruli<span className="text-primary-500">.ge</span></span>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {desktopNav.map((item) => {
            const isActive = path === item.to || (item.to !== '/discover' && path.startsWith(item.to));
            return (
              <Link key={item.to} to={item.to} className={`nav-link ${isActive ? 'nav-link-active' : ''}`}>
                {item.icon}
                <span>{t(item.label)}</span>
              </Link>
            );
          })}
          <Link to="/admin" className="nav-link">
            <Shield size={22} />
            <span>Admin</span>
          </Link>
        </nav>
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2">
            {profile?.first_name && (
              <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-sm">
                {profile.first_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{profile?.first_name || ''}</p>
              <p className="text-xs text-gray-400 truncate">{profile?.city || ''}</p>
            </div>
          </div>
          <button onClick={signOut} className="nav-link w-full text-left text-gray-400 hover:text-error-500">
            <LogOut size={20} />
            <span>{t('auth.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <main className="flex-1 pb-20 md:pb-0">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-30 safe-area">
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.map((item) => {
              const isActive = path === item.to || (item.to !== '/discover' && path.startsWith(item.to));
              return (
                <Link key={item.to} to={item.to} className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-colors ${isActive ? 'text-primary-500' : 'text-gray-400'}`}>
                  {item.icon}
                  <span className="text-[10px] font-medium">{t(item.label)}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
