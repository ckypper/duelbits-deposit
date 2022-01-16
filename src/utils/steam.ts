import { ConfigProps } from '../interfaces';
import SteamCommunity from 'steamcommunity';
import TradeOfferManager from 'steam-tradeoffer-manager';
import SteamTotp from 'steam-totp';
import { message, Status } from './message';
import { timeout } from '.';
import { SteamOfferItemProps } from '../interfaces/steam';

const steamManager = {};

const sendProcess = async (config: ConfigProps, offer, item: SteamOfferItemProps, retry: number) => {
  try {
    await send(offer);
    message(config, `Create offer ${item.market_name} successfully`, Status.SUCCESS);
    return true;
  } catch (error) {
    if (retry === 10) {
      message(config, `Create offer ${item.market_name} failed in 10 times. Ignore the trade`, Status.FAILED);
    } else {
      message(config, `Create offer ${item.market_name} failed. Retry in 1 minute`, Status.FAILED);
      await loginSteam(config);
      await timeout(60000);
      return await sendProcess(config, offer, item, retry + 1);
    }
  }
};

const confirmProcess = async (config: ConfigProps, steam, offer, item: SteamOfferItemProps, retry: number) => {
  try {
    await confirm(offer, config.steam.identitySecret, steam);
    message(config, `Confirm offer ${item.market_name} successfully`, Status.SUCCESS);
  } catch (error) {
    if (retry === 10) {
      message(config, `Confirm offer ${item.market_name} failed in 10 times. Ignore the trade`, Status.FAILED);
    } else {
      message(config, `Confirm offer ${item.market_name} failed. Retry in 1 minute`, Status.FAILED);
      await loginSteam(config);
      await timeout(60000);
      return await confirmProcess(config, steam, offer, item, retry + 1);
    }
  }
};

export const sendOffer = async (config: ConfigProps, item: SteamOfferItemProps, tradeurl: string) => {
  const items = [{ assetid: item.assetid, appid: item.appid, contextid: item.contextid }];
  const manager = steamManager[config.steam.accountName].manager;
  if (manager) {
    const offer = manager.createOffer(tradeurl);
    offer.addMyItems(items);
    const success = await sendProcess(config, offer, item, 1);
    if (success) {
      await timeout(10000);
      await confirmProcess(config, steamManager[config.steam.accountName].steam, offer, item, 1);
    }
  }
};

const confirm = (offer, identitySecret, steam) => {
  return new Promise((resolve, reject) => {
    steam.acceptConfirmationForObject(identitySecret, offer.id, (err) => {
      if (err) {
        reject(err);
      }

      resolve(null);
    });
  });
};

const send = (offer) => {
  return new Promise((resolve, reject) => {
    offer.send((err, status) => {
      if (err) {
        reject(err);
        return;
      }

      if (status === 'pending') {
        resolve(null);
      }
    });
  });
};

export const loginSteam = async (config: ConfigProps) => {
  return new Promise((resolve) => {
    const steam = new SteamCommunity();
    steam.login(
      {
        accountName: config.steam.accountName,
        password: config.steam.password,
        twoFactorCode: SteamTotp.getAuthCode(config.steam.sharedSecret),
      },
      (err, sessionID, cookies, steamguard) => {
        if (err) {
          resolve(null);
          message(config, 'Steam login failed', Status.FAILED);
          return;
        }

        steamManager[config.steam.accountName] = {
          steam: steam,
          manager: new TradeOfferManager({
            domain: 'localhost',
            language: 'en',
            pollInterval: 120000,
            // cancelTime: 9 * 60 * 1000, // cancel outgoing offers after 9mins
          }),
        };

        steamManager[config.steam.accountName].manager.setCookies(cookies, (err) => {
          if (err) {
            resolve(null);
            message(config, 'Steam login failed', Status.FAILED);
            steamManager[config.steam.accountName] = null;
            return;
          }

          // auto accept steam offer
          steamManager[config.steam.accountName].manager.on('newOffer', (offer) => {
            if (offer.itemsToGive.length === 0) {
              offer.accept();
            }
          });

          message(config, 'Steam login successfully', Status.SUCCESS);
          resolve(null);
        });
      },
    );
  });
};
