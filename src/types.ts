export type Action = {
  name: string;
  result: string;
  next_room?: string;
  end_game?: boolean;
  conditions?: {
    requiredAction?: string;
  };
};

export type Room = {
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
