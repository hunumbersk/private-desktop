import { createRoot } from 'react-dom/client'

function TestApp() {
  return <div style={{ color: 'red', padding: 20 }}>If you see this, JS works!</div>;
}

createRoot(document.getElementById('root')!).render(<TestApp />);
