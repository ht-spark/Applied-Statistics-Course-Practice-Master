import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@client/src/hooks/useAuth';
import { getApiErrorMessage } from '@client/src/lib/api-error';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Input } from '@client/src/components/ui/input';
import { Button } from '@client/src/components/ui/button';
import { BookOpen, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!emailValid) {
      setError('请输入有效的邮箱地址');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, '登录失败，请检查邮箱和密码'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="text-center space-y-5 pb-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm bg-primary">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-heading">欢迎回来</CardTitle>
            <CardDescription>登录你的 432 应统刷题账号</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                邮箱
              </label>
              <Input
                id="email"
                type="email"
                placeholder="请输入邮箱"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                autoComplete="email"
                disabled={isSubmitting}
                className="rounded-sm"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                密码
              </label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                autoComplete="current-password"
                disabled={isSubmitting}
                className="rounded-sm"
              />
            </div>

            {error && (
              <div className="text-sm text-primary border border-border rounded-sm px-3 py-2 bg-secondary">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full rounded-sm" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border text-center text-sm text-muted-foreground">
            还没有账号？{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              去注册
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
