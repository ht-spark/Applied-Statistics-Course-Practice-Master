import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@client/src/hooks/useAuth';
import { getApiErrorMessage } from '@client/src/lib/api-error';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Input } from '@client/src/components/ui/input';
import { Button } from '@client/src/components/ui/button';
import { BookOpen, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }
    if (password.length < 6) {
      setError('密码长度至少 6 位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, password, nickname);
      navigate('/');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, '注册失败，请稍后重试'));
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
            <CardTitle className="text-2xl font-heading">创建新账号</CardTitle>
            <CardDescription>加入 432 应统刷题，开启备考之旅</CardDescription>
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
              <label htmlFor="nickname" className="text-sm font-medium text-foreground">
                昵称
              </label>
              <Input
                id="nickname"
                type="text"
                placeholder="请输入昵称"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setError('');
                }}
                autoComplete="nickname"
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
                placeholder="请输入密码（至少 6 位）"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                autoComplete="new-password"
                disabled={isSubmitting}
                className="rounded-sm"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                确认密码
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                autoComplete="new-password"
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
                  注册中...
                </>
              ) : (
                '注册'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border text-center text-sm text-muted-foreground">
            已有账号？{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              去登录
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
