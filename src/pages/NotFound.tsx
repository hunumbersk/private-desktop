export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ backgroundColor: '#1e1e1e' }}>
      <h1 className="text-[48px] font-bold mb-2" style={{ color: '#858585' }}>404</h1>
      <p className="text-[13px] mb-4" style={{ color: '#858585' }}>页面不存在</p>
      <a href="/" className="text-[12px] hover:underline" style={{ color: '#569cd6' }}>返回桌面</a>
    </div>
  );
}
