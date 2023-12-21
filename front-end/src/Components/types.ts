import { Rect, Circle, Image } from '@svgdotjs/svg.js';
export type user_stats = {
  winsRat: number;
  wins: number;
  achievement: number;
  total_matches: number;
};

export type achievement = {
  name: string;
  description: string;
  progress: number;
  max: number;
};

export type user = {
  id: string;
  username: string;
  rank: number;
  avatar: string;
  achievement: achievement[];
  user_stats: user_stats;
  // Add other properties as needed
};

export type cercle = {
  x: number,
  y: number,
  r:  number,
}
export interface User {
  id_player: string;
  email: string;
  username: string;
  avatar: string;
  isAuthenticated: boolean;
}

  // define a type of one plaer
export interface Player {
  s_id: string;
  user_id: string,
  host: boolean;
  x: number;
  y: number;
  paddleDirection: number;
  paddle? : Rect;
  paddleSpeed : number;
}

// define a type of all players
export interface Players {
    [key: string]: Player;
}

// define a type of ball
export interface Ball {
  cx: number;
  cy: number;
  cercle : Circle;
  vx: number;
  vy: number;
}

export enum inviteStatus {
  NONE,
  INVITED,
  ACCEPTED,
  DECLINED,
  ABORTED,
}