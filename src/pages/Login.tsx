import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import {
  Lock, UserPlus, LogIn, Monitor, Globe, AlertCircle,
  CheckCircle, Loader2, Eye, EyeOff, ArrowLeft,
} from "lucide-react";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);
  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);
  return url.toString();
}

type AuthMode = "choose" | "login" | "register";

export default function Login() {
  const { bypassLogin, loginLocal, register, apiHealthy } = useAuth();
  const [mode, setMode] = useState<AuthMode>("choose");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check username availability for registration
  const { data: usernameCheck } = trpc.localAuth.checkUsername.useQuery(
    { username },
    { enabled: mode === "register" && username.length >= 3 }
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setError("");
    setIsLoading(true);
    try {
      await loginLocal(username.trim(), password.trim());
      // Successful login will update auth state and trigger re-render
    } catch (err: any) {
      setError(err?.message || "登录失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    if (password.length < 6) {
      setError("密码至少6位");
      return;
    }
    if (usernameCheck && !usernameCheck.available) {
      setError("用户名已被注册");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await register(username.trim(), password.trim(), name.trim() || undefined);
      setSuccess("注册成功！正在登录...");
      // Auto login after register
      await loginLocal(username.trim(), password.trim());
    } catch (err: any) {
      setError(err?.message || "注册失败");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setMode("choose");
    setUsername("");
    setPassword("");
    setName("");
    setError("");
    setSuccess("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1e1e1e' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)' }} />

      <div className="w-full max-w-sm mx-4" style={{ zIndex: 10 }}>
        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'rgba(220,184,98,0.1)' }}>
            <Lock size={22} color="#dcb862" />
          </div>
          <h1 className="text-[16px] font-medium" style={{ color: '#d4d4d4' }}>私密虚拟桌面</h1>
          <p className="text-[11px] mt-1" style={{ color: '#858585' }}>跨平台 · 私密 · 数据同步</p>
        </div>

        {/* Main Card */}
        <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'rgba(45,45,45,0.95)', border: '1px solid rgba(255,255,255,0.08)' }}>

          {/* === CHOOSE MODE === */}
          {mode === "choose" && (
            <div className="p-4 space-y-3">
              {/* Cloud sync info */}
              <div className="rounded-md p-2.5 space-y-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-1.5">
                  <Globe size={10} color="#569cd6" />
                  <span className="text-[10px]" style={{ color: '#aaa' }}>云端同步模式</span>
                </div>
                <p className="text-[10px]" style={{ color: '#858585' }}>注册账号后可在任何设备上访问你的笔记、菜谱和桌面数据</p>
              </div>

              {/* Register Button */}
              <button
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded text-[13px] font-medium transition-all"
                style={{ color: '#1e1e1e', backgroundColor: '#dcb862' }}
                onClick={() => setMode("register")}
              >
                <UserPlus size={15} />
                注册账号
              </button>

              {/* Login Button */}
              <button
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded text-[12px] transition-all"
                style={{ color: '#d4d4d4', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={() => setMode("login")}
              >
                <LogIn size={14} />
                已有账号？直接登录
              </button>

              {/* Divider */}
              <div className="relative flex items-center gap-2 py-1">
                <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
                <span className="text-[9px]" style={{ color: '#858585' }}>其他方式</span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
              </div>

              {/* Kimi OAuth */}
              <button
                className="w-full flex items-center justify-center gap-2 py-2 rounded text-[11px] transition-all"
                style={{ color: '#aaa', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                onClick={() => { window.location.href = getOAuthUrl(); }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
              >
                <Globe size={12} />
                使用 Kimi 账号登录
              </button>

              {/* Local mode */}
              <button
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded text-[11px] transition-colors"
                style={{ color: '#aaa', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.06)' }}
                onClick={bypassLogin}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <Monitor size={11} />
                本地模式（数据仅存在当前设备）
              </button>

              {apiHealthy === false && (
                <p className="text-[9px] text-center" style={{ color: '#858585' }}>
                  当前为静态部署，云端同步需部署后端服务器
                </p>
              )}
            </div>
          )}

          {/* === LOGIN MODE === */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="p-4 space-y-3">
              <button
                type="button"
                className="flex items-center gap-1 text-[10px] mb-1"
                style={{ color: '#858585' }}
                onClick={resetForm}
              >
                <ArrowLeft size={10} /> 返回
              </button>

              <h2 className="text-[14px] font-medium" style={{ color: '#d4d4d4' }}>账号登录</h2>

              {/* Username */}
              <div className="space-y-1">
                <label className="text-[10px]" style={{ color: '#aaa' }}>用户名</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="输入用户名"
                  className="w-full px-3 py-2 rounded text-[12px] outline-none"
                  style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4', border: '1px solid rgba(255,255,255,0.08)' }}
                  autoFocus
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px]" style={{ color: '#aaa' }}>密码</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入密码"
                    className="w-full px-3 py-2 pr-8 rounded text-[12px] outline-none"
                    style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    style={{ color: '#858585' }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-1.5 py-1.5 px-2 rounded" style={{ backgroundColor: 'rgba(231,76,60,0.1)' }}>
                  <AlertCircle size={11} color="#e74c3c" />
                  <span className="text-[10px]" style={{ color: '#e74c3c' }}>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !username.trim() || !password.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded text-[13px] font-medium transition-all"
                style={{
                  color: '#1e1e1e',
                  backgroundColor: (!isLoading && username.trim() && password.trim()) ? '#dcb862' : '#dcb86255',
                  cursor: (!isLoading && username.trim() && password.trim()) ? 'pointer' : 'not-allowed',
                }}
              >
                {isLoading ? <><Loader2 size={14} className="animate-spin" /> 登录中...</> : <><LogIn size={14} /> 登录</>}
              </button>

              <p className="text-[10px] text-center" style={{ color: '#858585' }}>
                还没有账号？<button type="button" className="underline" style={{ color: '#569cd6' }} onClick={() => { setMode("register"); setError(""); }}>立即注册</button>
              </p>
            </form>
          )}

          {/* === REGISTER MODE === */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="p-4 space-y-3">
              <button
                type="button"
                className="flex items-center gap-1 text-[10px] mb-1"
                style={{ color: '#858585' }}
                onClick={resetForm}
              >
                <ArrowLeft size={10} /> 返回
              </button>

              <h2 className="text-[14px] font-medium" style={{ color: '#d4d4d4' }}>注册账号</h2>

              {/* Name (optional) */}
              <div className="space-y-1">
                <label className="text-[10px]" style={{ color: '#aaa' }}>昵称（可选）</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="显示名称"
                  className="w-full px-3 py-2 rounded text-[12px] outline-none"
                  style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>

              {/* Username */}
              <div className="space-y-1">
                <label className="text-[10px]" style={{ color: '#aaa' }}>用户名 <span style={{ color: '#858585' }}>（3-32位，字母数字下划线）</span></label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="设置用户名"
                  className="w-full px-3 py-2 rounded text-[12px] outline-none"
                  style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4', border: '1px solid rgba(255,255,255,0.08)' }}
                  autoFocus
                />
                {username.length >= 3 && usernameCheck && (
                  <div className="flex items-center gap-1">
                    {usernameCheck.available ? (
                      <><CheckCircle size={10} color="#4ec9b0" /><span className="text-[9px]" style={{ color: '#4ec9b0' }}>用户名可用</span></>
                    ) : (
                      <><AlertCircle size={10} color="#e74c3c" /><span className="text-[9px]" style={{ color: '#e74c3c' }}>用户名已被占用</span></>
                    )}
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px]" style={{ color: '#aaa' }}>密码 <span style={{ color: '#858585' }}>（至少6位）</span></label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="设置密码"
                    className="w-full px-3 py-2 pr-8 rounded text-[12px] outline-none"
                    style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    style={{ color: '#858585' }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {/* Error / Success */}
              {error && (
                <div className="flex items-center gap-1.5 py-1.5 px-2 rounded" style={{ backgroundColor: 'rgba(231,76,60,0.1)' }}>
                  <AlertCircle size={11} color="#e74c3c" />
                  <span className="text-[10px]" style={{ color: '#e74c3c' }}>{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-1.5 py-1.5 px-2 rounded" style={{ backgroundColor: 'rgba(78,201,176,0.1)' }}>
                  <CheckCircle size={11} color="#4ec9b0" />
                  <span className="text-[10px]" style={{ color: '#4ec9b0' }}>{success}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !username.trim() || !password.trim() || password.length < 6 || (usernameCheck?.available === false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded text-[13px] font-medium transition-all"
                style={{
                  color: '#1e1e1e',
                  backgroundColor: (!isLoading && username.trim() && password.trim() && password.length >= 6 && usernameCheck?.available !== false) ? '#dcb862' : '#dcb86255',
                  cursor: (!isLoading && username.trim() && password.trim() && password.length >= 6 && usernameCheck?.available !== false) ? 'pointer' : 'not-allowed',
                }}
              >
                {isLoading ? <><Loader2 size={14} className="animate-spin" /> 注册中...</> : <><UserPlus size={14} /> 注册</>}
              </button>

              <p className="text-[10px] text-center" style={{ color: '#858585' }}>
                已有账号？<button type="button" className="underline" style={{ color: '#569cd6' }} onClick={() => { setMode("login"); setError(""); }}>直接登录</button>
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-[9px] text-center mt-3" style={{ color: 'rgba(133,133,133,0.5)' }}>
          数据存储在服务端以支持跨设备同步
        </p>
      </div>
    </div>
  );
}
