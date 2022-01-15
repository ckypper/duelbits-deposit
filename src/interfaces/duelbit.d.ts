export interface ItemProps {
  appid: number;
  assetid: string;
  icon: string;
  iconHash: string;
  name: string;
  nameHash: string;
  price: number;
  quality: string;
  rarity: string;
  suggestedPrice: number;
}

export interface BuyerProps {
  id: string;
  image: string;
  joinSteam: number;
  name: string;
  tradeUrl: string;
}

export interface PingEventMessageProps {
  buyer: BuyerProps;
  id: string;
  items: ItemProps[];
}
