import { useState, useEffect } from 'react';
import { X, User, Lock, LogIn, UserPlus } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const login = useGameStore((s) => s.login);
  const register = useGameStore((s) => s.register);
  const loginError = useGameStore((s) => s.loginError);
  const registerError = useGameStore((s) => s.registerError);
  const clearAuthErrors = useGameStore((s) => s.clearAuthErrors);
  const auth = useGameStore((s) => s.auth);

  useEffect(() => {
    if (auth.isLoggedIn && isOpen) {
      onClose();
    }
  }, [auth.isLoggedIn, isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setPassword('');
      clearAuthErrors();
    }
  }, [isOpen, clearAuthErrors]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      const result = login(username, password);
      if (result.success) {
        onClose();
      }
    } else {
      const result = register(username, password);
      if (result.success) {
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  const error = mode === 'login' ? loginError : registerError;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
      <div className="bg-[#1a1a2e] rounded-2xl border border-[#2a2a4a] w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a4a]">
          <h2 className="text-xl font-bold text-[#f0c040]">
            {mode === 'login' ? '登录账号' : '注册账号'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#2a2a4a] text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-[#2a2a4a]">
          <button
            onClick={() => {
              setMode('login');
              clearAuthErrors();
            }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === 'login'
                ? 'text-[#f0c040] border-b-2 border-[#f0c040]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <LogIn size={16} />
              登录
            </div>
          </button>
          <button
            onClick={() => {
              setMode('register');
              clearAuthErrors();
            }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === 'register'
                ? 'text-[#f0c040] border-b-2 border-[#f0c040]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserPlus size={16} />
              注册
            </div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">用户名</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a1a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#f0c040] transition-colors"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">密码</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a1a] border border-[#2a2a4a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#f0c040] transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!username.trim() || !password.trim()}
            className="w-full py-2.5 bg-[#f0c040] text-[#1a1a2e] font-bold rounded-lg hover:bg-[#d4a830] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mode === 'login' ? '登录' : '注册'}
          </button>

          <div className="text-xs text-gray-500 text-center">
            {mode === 'login' ? (
              <span>
                还没有账号？
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    clearAuthErrors();
                  }}
                  className="text-[#f0c040] hover:underline ml-1"
                >
                  立即注册
                </button>
              </span>
            ) : (
              <span>
                已有账号？
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    clearAuthErrors();
                  }}
                  className="text-[#f0c040] hover:underline ml-1"
                >
                  立即登录
                </button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
