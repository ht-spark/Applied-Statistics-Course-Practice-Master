import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Home,
  Library,
  Star,
  Crown,
  User,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@client/src/hooks/useAuth';
import { cn } from '@client/src/utils/cn';

const navItems = [
  { to: '/', icon: Home, label: '首页', exact: true },
  { to: '/universities', icon: Library, label: '题库' },
  { to: '/wrong-book', icon: BookOpen, label: '错题本' },
  { to: '/favorites', icon: Star, label: '收藏' },
  { to: '/vip', icon: Crown, label: '会员中心' },
  { to: '/profile', icon: User, label: '个人中心' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur-sm md:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-foreground"
          aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <span className="font-heading text-lg font-semibold text-foreground">
          应统考研真题
        </span>
        <div className="w-9" />
      </div>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-60 border-r border-border bg-sidebar transition-transform md:static md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center gap-3 border-b border-border px-6">
            <BookOpen size={20} className="text-primary" strokeWidth={1.5} />
            <div>
              <div className="font-heading text-base font-semibold text-foreground">
                应统考研
              </div>
              <div className="text-xs text-muted-foreground">
                432 真题集
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'group relative flex items-center gap-3 px-3 py-2.5 text-sm transition-colors duration-200',
                    isActive
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 bg-primary" />
                  )}
                  <Icon
                    size={16}
                    strokeWidth={1.5}
                    className={cn(
                      'transition-colors duration-200',
                      isActive ? 'text-primary' : '',
                    )}
                  />
                  {item.label}
                </NavLink>
              );
            })}

            {user?.isAdmin && (
              <div className="mt-4 border-t border-border pt-4">
                <NavLink
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'group relative flex items-center gap-3 px-3 py-2.5 text-sm transition-colors duration-200',
                    location.pathname.startsWith('/admin')
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {location.pathname.startsWith('/admin') && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 bg-primary" />
                  )}
                  <Settings
                    size={16}
                    strokeWidth={1.5}
                    className={cn(
                      'transition-colors duration-200',
                      location.pathname.startsWith('/admin') ? 'text-primary' : '',
                    )}
                  />
                  后台管理
                </NavLink>
              </div>
            )}
          </nav>

          <div className="border-t border-border p-3">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-2 py-2">
                  <div className="flex h-9 w-9 items-center justify-center bg-secondary text-sm font-medium text-foreground">
                    {user.nickname?.[0] ?? 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">
                      {user.nickname}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <LogOut size={16} strokeWidth={1.5} />
                  退出登录
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <NavLink
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  登录
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  注册账号
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-foreground/20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <main className="flex-1 pt-14 md:pt-0">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-10 md:py-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
