export interface ConfigProps {
  name: string;
  duelbit: {
    active: boolean;
    userToken: string;
  };
  steam: Steam;
  discord: {
    active: boolean;
    hook: string;
  };
}

interface Steam {
  accountName: string;
  password: string;
  sharedSecret: string;
  identitySecret: string;
}
