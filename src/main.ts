import './styles.css';
import { HomeScreen }   from './screens/HomeScreen';
import { ViewerScreen } from './screens/ViewerScreen';

const app = document.getElementById('app')!;
let current: { destroy(): void } | null = null;
function show(s: { destroy(): void }) { current?.destroy(); current = s; }

function goHome() {
  show(new HomeScreen(app, (file) => {
    show(new ViewerScreen(app, file, goHome));
  }));
}

goHome();
