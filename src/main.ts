import './styles.css';
import { HomeScreen }       from './screens/HomeScreen';
import { ProcessingScreen } from './screens/ProcessingScreen';
import { ViewerScreen }     from './screens/ViewerScreen';
import type { PointCloud }  from './services/pointCloudGenerator';

const app = document.getElementById('app')!;
let currentScreen: { destroy(): void } | null = null;

function show(screen: { destroy(): void }) {
  currentScreen?.destroy();
  currentScreen = screen;
}

function goHome() {
  show(new HomeScreen(app, (file) => {
    show(new ProcessingScreen(app, file,
      (cloud: PointCloud) => show(new ViewerScreen(app, cloud, goHome)),
      goHome
    ));
  }));
}

goHome();
