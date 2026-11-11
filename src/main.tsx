import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { crazyGames } from './game/crazyGamesSdk';

// Initialize CrazyGames SDK v3 for iframe / portal environments
crazyGames.init().catch(() => {});

createRoot(document.getElementById('root')!).render(<App />);
