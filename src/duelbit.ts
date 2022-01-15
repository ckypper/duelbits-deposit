import { io } from 'socket.io-client';
import { ConfigProps } from './interfaces';
import { getToken } from './utils/duelbit';
import { message, Status } from './utils/message';
import { PingEventMessageProps } from './interfaces/duelbit';
import { SteamOfferItemProps } from './interfaces/steam';
import { sendOffer } from './utils/steam';

const sendedOffer = [];

export const initDuelbitSocket = async (config: ConfigProps) => {
  const tokenResponse = await getToken(config);

  if (tokenResponse) {
    const socket = io('wss://ws.duelbits.com', {
      transports: ['websocket'],
      auth: tokenResponse,
      secure: true,
      reconnection: true,
      extraHeaders: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36',
      },
    });

    socket.on('connect', () => {
      message(config, 'Connect to duelbits successfully', Status.SUCCESS);
      socket.emit('pay:p2p:getMyListings');
      socket.emit('auth:authenticate', {
        access: config.duelbit.userToken,
      });
    });

    socket.on('null', (data) => {
      console.log(data);
    });

    socket.on('pay:p2p:ping', (msg: PingEventMessageProps) => {
      const { id, items, buyer } = msg;
      message(config, `${buyer.name} want to buy your ${items[0].name} for ${items[0].price} coins`, Status.SUCCESS);
      socket.emit('pay:p2p:pong', {
        id: id,
      });
    });

    socket.on('pay:p2p:expired', (msg: PingEventMessageProps) => {
      const { items, buyer } = msg;
      message(config, `${buyer.name} not accept ${items[0].name}`, Status.FAILED);
    });

    socket.on('pay:p2p:complete', (msg: PingEventMessageProps) => {
      const { items } = msg;
      message(config, `${items[0].name} has been sold for ${items[0].price} coins`, Status.SUCCESS);
    });

    socket.on('pay:p2p:continue', async (msg: PingEventMessageProps) => {
      const { buyer, items, id } = msg;

      if (sendedOffer.includes(id)) {
        return;
      }

      const normalizeItems: SteamOfferItemProps = {
        appid: items[0].appid,
        assetid: items[0].assetid,
        contextid: '2',
        market_name: items[0].name,
      };

      sendedOffer.push(id);

      await sendOffer(config, normalizeItems, buyer.tradeUrl);
    });

    socket.on('connect_error', (err) => {
      console.log(`Connect to duelbits failed due to ${err.message}`);
    });

    setInterval(() => {
      socket.emit('3');
    }, 25000);
  }
};
