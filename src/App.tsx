import { AuthProvider, useAuth } from '@/lib/auth-context';
import { LanguageProvider } from '@/lib/language-context';
import { ThemeProvider } from '@/lib/theme-context';
import { ToastProvider } from '@/lib/toast-context';
import { RouterProvider, useRouter } from '@/lib/router';
import { AppLayout } from '@/components/AppLayout';
import { LandingPage } from '@/pages/LandingPage';
import { AuthPage } from '@/pages/AuthPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { DiscoverPage } from '@/pages/DiscoverPage';
import { MatchesPage, LikesPage } from '@/pages/MatchesPage';
import { MessagesListPage } from '@/pages/MessagesListPage';
import { ChatPage } from '@/pages/ChatPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { VerificationPage } from '@/pages/VerificationPage';
import { PublicPage } from '@/pages/PublicPages';
import { LoadingScreen } from '@/components/ui/Feedback';

function AppRoutes() {
  const { path, navigate } = useRouter();
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  const publicRoutes = ['/', '/login', '/signup', '/reset', '/about', '/safety', '/guidelines', '/privacy', '/terms', '/contact'];
  const isPublic = publicRoutes.includes(path) || publicRoutes.some((r) => path.startsWith(r + '/'));

  // Not logged in
  if (!session) {
    if (path === '/login') return <AuthPage mode="login" />;
    if (path === '/signup') return <AuthPage mode="signup" />;
    if (path === '/reset') return <AuthPage mode="reset" />;
    if (path.startsWith('/about') || path.startsWith('/safety') || path.startsWith('/guidelines') || path.startsWith('/privacy') || path.startsWith('/terms') || path.startsWith('/contact')) {
      const page = path.split('/')[1] as 'about' | 'safety' | 'guidelines' | 'privacy' | 'terms' | 'contact';
      return <PublicPage page={page} />;
    }
    return <LandingPage />;
  }

  // Logged in but profile not completed -> onboarding
  if (profile && !profile.profile_completed && path !== '/onboarding') {
    navigate('/onboarding');
    return <OnboardingPage />;
  }

  if (path === '/onboarding') return <OnboardingPage />;

  // Logged in app routes
  const appRoutes: Record<string, React.ReactNode> = {
    '/discover': <DiscoverPage />,
    '/matches': <MatchesPage />,
    '/likes': <LikesPage />,
    '/messages': <MessagesListPage />,
    '/profile': <ProfilePage />,
    '/settings': <SettingsPage />,
    '/notifications': <NotificationsPage />,
    '/verification': <VerificationPage />,
    '/admin': <AdminPage />,
  };

  // Chat route with matchId
  if (path.startsWith('/chat/')) {
    const matchId = path.split('/')[2];
    return <AppLayout><ChatPage matchId={matchId} /></AppLayout>;
  }

  // Public pages accessible while logged in
  if (path.startsWith('/about')) return <PublicPage page="about" />;
  if (path.startsWith('/safety')) return <PublicPage page="safety" />;
  if (path.startsWith('/guidelines')) return <PublicPage page="guidelines" />;
  if (path.startsWith('/privacy')) return <PublicPage page="privacy" />;
  if (path.startsWith('/terms')) return <PublicPage page="terms" />;
  if (path.startsWith('/contact')) return <PublicPage page="contact" />;

  const route = appRoutes[path];
  if (route) return <AppLayout>{route}</AppLayout>;

  // Default to discover
  if (path === '/' || !appRoutes[path]) {
    navigate('/discover');
    return <AppLayout><DiscoverPage /></AppLayout>;
  }

  return <AppLayout><DiscoverPage /></AppLayout>;
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <RouterProvider>
              <AppRoutes />
            </RouterProvider>
          </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
