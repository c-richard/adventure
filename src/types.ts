export type Action = {
  name: string;
  alternativeNames: string[];
  result: string;
  roomDescription?: string;
  next_room?: string;
  end_game?: boolean;
  condition?: string;
};

export type Room = {
  key: string;
  title: string;
  description: string;
  actions: Action[];
};

export type Adventure = {
  title: string;
  intro: string;
  initialRoom: string;
  rooms: Record<string, Room>;
};
