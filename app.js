import { initNavigation, initSidebarToggle } from './js/navigation.js';
import { APP_VERSION, APP_BUILD } from './js/versioned-loader.js';

initNavigation();
initSidebarToggle();

console.info(`ShootnLook ${APP_VERSION} (${APP_BUILD})`);
