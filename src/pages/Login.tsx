import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Globe, Monitor } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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

export default function Login() {
  const { bypassLogin, apiHealthy } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1e1e1e' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)' }} />
      <Card className="w-full max-w-sm border-0" style={{ backgroundColor: 'rgba(45,45,45,0.95)', border: '1px solid rgba(255,255,255,0.08)', zIndex: 10 }}>
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Lock size={16} color="#dcb862" />
            <CardTitle className="text-[16px] font-medium" style={{ color: '#d4d4d4' }}>私密虚拟桌面</CardTitle>
          </div>
          <p className="text-[11px]" style={{ color: '#858585' }}>跨平台 · 私密 · 数据同步</p>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {/* Cloud sync info */}
          <div className="rounded-md p-2.5 space-y-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-1.5">
              <Globe size={10} color="#569cd6" />
              <span className="text-[10px]" style={{ color: '#aaa' }}>云端同步模式</span>
            </div>
            <p className="text-[10px]" style={{ color: '#858585' }}>登录后可在任何设备上访问你的笔记、菜谱和桌面数据</p>
          </div>

          {/* Kimi OAuth Login */}
          <Button
            className="w-full text-[13px] font-medium"
            size="lg"
            style={{ backgroundColor: '#dcb862', color: '#1e1e1e' }}
            onClick={() => {
              window.location.href = getOAuthUrl();
            }}
          >
            使用 Kimi 账号登录
          </Button>

          {/* Local mode fallback */}
          <div className="relative flex items-center gap-2 py-1">
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <span className="text-[9px]" style={{ color: '#858585' }}>或</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
          </div>

          <button
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded text-[11px] transition-colors"
            style={{ color: '#aaa', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
            onClick={bypassLogin}
          >
            <Monitor size={11} />
            本地模式（数据仅存在当前设备）
          </button>

          {apiHealthy === false && (
            <p className="text-[9px] text-center" style={{ color: '#858585' }}>
              当前为静态部署，云端同步功能需部署后端服务器
            </p>
          )}

          <p className="text-[9px] text-center" style={{ color: '#858585' }}>
            登录即表示同意数据存储在服务端以支持跨设备同步
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
