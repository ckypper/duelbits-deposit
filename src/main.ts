import { USER_CONFIG } from './config/index';
import { initDuelbitSocket } from './duelbit';
import { timeout } from './utils';
import { loginSteam } from './utils/steam';

const main = () => {
  initUser();
};

const initUser = async () => {
  for (let i = 0; i < USER_CONFIG.length; i++) {
    await loginSteam(USER_CONFIG[i]);
    if (USER_CONFIG[i].duelbit.active) {
      initDuelbitSocket(USER_CONFIG[i]);
    }
    await timeout(10000);
  }
};

main();
