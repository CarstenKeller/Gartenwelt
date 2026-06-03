import './styles.css';
import { HomeScreen }       from './screens/HomeScreen';
import { ProcessingScreen } from './screens/ProcessingScreen';
import { ViewerScreen }     from './screens/ViewerScreen';
import type { SceneData }   from './services/sceneBuilder';

const app = document.getElementById('app')!;
let current: { destroy(): void } | null = null;

function show(s: { destroy(): void }) { current?.destroy(); current = s; }

function goHome() {
  show(new HomeScreen(app, (file) => {
    show(new ProcessingScreen(app, file,
      (scene: SceneData) => show(new ViewerScreen(app, scene, goHome)),
      goHome
    ));
  }));
}

goHome();
