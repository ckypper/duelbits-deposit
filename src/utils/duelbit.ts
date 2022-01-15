import axios from 'axios';
import { message, Status } from './message';
import { ConfigProps } from '../interfaces';

export const getToken = async (config: ConfigProps) => {
  try {
    const { data } = await axios.get<{ token: string }>('https://auth.duelbits.com/token', {
      headers: {
        'accept-language': 'en-US,en;q=0.9',
        origin: 'https://duelbits.com',
        referer: 'https://duelbits.com/',
      },
    });
    return data;
  } catch (error) {
    message(config, 'Connect to duelbit failed due to no access token', Status.FAILED);
    return null;
  }
};
