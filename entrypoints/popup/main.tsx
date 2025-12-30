import React from 'react';
import ReactDOM from 'react-dom/client';
import { HeroUIProvider } from '@heroui/react';
import App from './App';
import '../../assets/main.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <HeroUIProvider>
        <div className="w-full h-full bg-background text-foreground">
            <App />
        </div>
      </HeroUIProvider>
    </React.StrictMode>
  );
} else {
    console.error("Popup: Failed to find #root element");
}