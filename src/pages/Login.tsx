import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  Lock, BookOpen, GraduationCap, PenTool,
  ArrowLeft, Loader2, Eye, EyeOff,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { bypassLogin, loginLocal, register } = useAuth();
  const [mode, setMode] = useState<"choose" | "register" | "login">("choose");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setError("");
    setIsLoading(true);
    try {
      await loginLocal(username.trim(), password.trim());
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
    setError("");
    setIsLoading(true);
    try {
      await register(username.trim(), password.trim(), username.trim());
      // Auto login after register
      await loginLocal(username.trim(), password.trim());
    } catch (err: any) {
      setError(err?.message || "注册失败");
    } finally {
      setIsLoading(false);
    }
  };

  // Choose module and enter local mode
  const handleChooseModule = (module: "novel" | "academic" | "general") => {
    // Store module preference
    try { localStorage.setItem("private-desktop-default-module", module); } catch { /* ignore */ }
    bypassLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1e1e1e" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)" }} />

      <div className="w-full max-w-sm mx-4 relative" style={{ zIndex: 10 }}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "rgba(220,184,98,0.1)" }}>
            <Lock size={22} color="#dcb862" />
          </div>
          <h1 className="text-[16px] font-medium" style={{ color: "#d4d4d4" }}>私密虚拟桌面</h1>
          <p className="text-[11px] mt-1" style={{ color: "#858585" }}>跨平台 · 私密 · 数据同步</p>
        </div>

        {/* Card */}
        <div className="rounded-lg p-5 space-y-4" style={{ backgroundColor: "rgba(45,45,45,0.95)", border: "1px solid rgba(255,255,255,0.08)" }}>

          {mode === "choose" && (
            <>
              {/* Choose Module */}
              <p className="text-[12px] text-center mb-3" style={{ color: "#d4d4d4" }}>选择工作模式进入本地桌面</p>

              <div className="space-y-3">
                <button onClick={() => handleChooseModule("novel")} className="w-full flex items-center gap-3 p-4 rounded-lg border transition-all hover:scale-[1.02]" style={{ backgroundColor: "rgba(192,132,252,0.05)", borderColor: "rgba(192,132,252,0.2)" }}>
                  <BookOpen size={20} color="#c084fc" />
                  <div className="text-left">
                    <div className="text-[13px] font-medium" style={{ color: "#d4d4d4" }}>小说创作</div>
                    <div className="text-[11px]" style={{ color: "#858585" }}>文学评论家 · 叙事结构师 · 读者代表</div>
                  </div>
                </button>

                <button onClick={() => handleChooseModule("academic")} className="w-full flex items-center gap-3 p-4 rounded-lg border transition-all hover:scale-[1.02]" style={{ backgroundColor: "rgba(220,184,98,0.05)", borderColor: "rgba(220,184,98,0.2)" }}>
                  <GraduationCap size={20} color="#dcb862" />
                  <div className="text-left">
                    <div className="text-[13px] font-medium" style={{ color: "#d4d4d4" }}>学术研究</div>
                    <div className="text-[11px]" style={{ color: "#858585" }}>方法论专家 · 文献综述 · 同行评审</div>
                  </div>
                </button>

                <button onClick={() => handleChooseModule("general")} className="w-full flex items-center gap-3 p-4 rounded-lg border transition-all hover:scale-[1.02]" style={{ backgroundColor: "rgba(86,156,214,0.05)", borderColor: "rgba(86,156,214,0.2)" }}>
                  <PenTool size={20} color="#569cd6" />
                  <div className="text-left">
                    <div className="text-[13px] font-medium" style={{ color: "#d4d4d4" }}>通用写作</div>
                    <div className="text-[11px]" style={{ color: "#858585" }}>内容分析 · 写作顾问 · 知识策展</div>
                  </div>
                </button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} /></div>
                <div className="relative flex justify-center"><span className="px-3 text-[10px]" style={{ color: "#858585", backgroundColor: "#2d2d2d" }}>或</span></div>
              </div>

              {/* Local Account */}
              <div className="flex gap-2">
                <button onClick={() => { setMode("login"); setError(""); }} className="flex-1 py-2 rounded text-[12px] border transition-all" style={{ borderColor: "rgba(255,255,255,0.1)", color: "#d4d4d4" }}>
                  账号登录
                </button>
                <button onClick={() => { setMode("register"); setError(""); }} className="flex-1 py-2 rounded text-[12px] transition-all" style={{ backgroundColor: "#dcb862", color: "#1e1e1e" }}>
                  注册账号
                </button>
              </div>

              <p className="text-[10px] text-center" style={{ color: "#858585" }}>
                静态部署：数据仅保存在浏览器本地
              </p>
            </>
          )}

          {mode === "login" && (
            <form onSubmit={handleLocalLogin} className="space-y-3">
              <button type="button" onClick={() => setMode("choose")} className="flex items-center gap-1 text-[10px]" style={{ color: "#858585" }}>
                <ArrowLeft size={10} /> 返回
              </button>
              <h2 className="text-[14px] font-medium" style={{ color: "#d4d4d4" }}>账号登录</h2>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="用户名" className="w-full px-3 py-2 rounded text-[12px] outline-none" style={{ backgroundColor: "#1e1e1e", color: "#d4d4d4", border: "1px solid rgba(255,255,255,0.08)" }} autoFocus />
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密码" className="w-full px-3 py-2 pr-8 rounded text-[12px] outline-none" style={{ backgroundColor: "#1e1e1e", color: "#d4d4d4", border: "1px solid rgba(255,255,255,0.08)" }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: "#858585" }}>{showPassword ? <EyeOff size={13} /> : <Eye size={13} />}</button>
              </div>
              {error && <p className="text-[10px]" style={{ color: "#e74c3c" }}>{error}</p>}
              <button type="submit" disabled={isLoading || !username.trim() || !password.trim()} className="w-full py-2 rounded text-[12px] font-medium" style={{ backgroundColor: username.trim() && password.trim() ? "#dcb862" : "#dcb86255", color: "#1e1e1e" }}>
                {isLoading ? <span className="flex items-center justify-center gap-1"><Loader2 size={12} className="animate-spin" /> 登录中...</span> : "登录"}
              </button>
            </form>
          )}

          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-3">
              <button type="button" onClick={() => setMode("choose")} className="flex items-center gap-1 text-[10px]" style={{ color: "#858585" }}>
                <ArrowLeft size={10} /> 返回
              </button>
              <h2 className="text-[14px] font-medium" style={{ color: "#d4d4d4" }}>注册账号</h2>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="用户名（3-32位）" className="w-full px-3 py-2 rounded text-[12px] outline-none" style={{ backgroundColor: "#1e1e1e", color: "#d4d4d4", border: "1px solid rgba(255,255,255,0.08)" }} autoFocus />
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密码（至少6位）" className="w-full px-3 py-2 pr-8 rounded text-[12px] outline-none" style={{ backgroundColor: "#1e1e1e", color: "#d4d4d4", border: "1px solid rgba(255,255,255,0.08)" }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: "#858585" }}>{showPassword ? <EyeOff size={13} /> : <Eye size={13} />}</button>
              </div>
              {error && <p className="text-[10px]" style={{ color: "#e74c3c" }}>{error}</p>}
              <button type="submit" disabled={isLoading || !username.trim() || !password.trim()} className="w-full py-2 rounded text-[12px] font-medium" style={{ backgroundColor: username.trim() && password.trim() ? "#dcb862" : "#dcb86255", color: "#1e1e1e" }}>
                {isLoading ? <span className="flex items-center justify-center gap-1"><Loader2 size={12} className="animate-spin" /> 注册中...</span> : "注册"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
