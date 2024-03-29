import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GameStatus } from '@prisma/client';

@Injectable()
export class GameService {
  constructor(private prisma: PrismaService) {}

  async createGame() {
    // Add your implementation here
    try {
      const game = await this.prisma.game.create({
        data: {
          status: 'SEARCHING',
        },
      });
      return game;
    } catch (error) {
    }
  }

  async getGameByUserId(userId: number, status: GameStatus) {
    try {
      const game = await this.prisma.game.findFirst({
        where: {
          status: status,
          users: {
            some: {
              userId: userId,
            },
          },
        },
      });
      return game;
    } catch (error) {
      return null;
    }
  }

  async deleteGameByUserId(userId: number) {
    try {
      const game = await this.prisma.game.findFirst({
        where: {
          status: "SEARCHING",
          users: {
            some: {
              userId: userId,
            },
          },
        },
      });
      if (!game || game === undefined) {
        return false;
      }
      await this.prisma.userGame.deleteMany({
        where: {
          gameId: game.id_game,
          userId: userId,
        },
      });
      Logger.log('delete User Game');
      await this.prisma.game.delete({
        where: {
          id_game: game.id_game,
        },
      });
      Logger.log('delete Game');
      return true;
    } catch (error) {
      return false;
    }
  }

  async joinGame(gameId: number, userId: number) {
    try {
      const userGame = await this.prisma.userGame.create({
        data: {
          game: {
            connect: {
              id_game: gameId,
            },
          },
          user: {
            connect: {
              id_player: userId,
            },
          },
        },
      });
      return userGame;
    } catch (error) {
      return false;
    }
  }

  async updateGame(gameId: number, status: GameStatus) {
    try {
      const Game = await this.prisma.game.update({
        where: {
          id_game: gameId,
        },
        data: {
          status: status,
        },
      });
      return Game;
    } catch (error) {
      return false;
    }
  }

  async updateUserGame(
    userId: number,
    gameId: number,
    win: number,
    score: number,
  ) {
    try {
      const userGame = await this.prisma.userGame.update({
        where: {
          userId_gameId: {
            userId: userId,
            gameId: gameId,
          },
        },
        data: {
          score: score,
          win: win,
        },
      });
      await this.prisma.player.update({
        where: {
          id_player: userId,
        },
        data: {
          wins: {
            increment: win,
          },
          loses: {
            increment: win === 0 ? 1 : 0,
          },
        },
      });
      return userGame;
    } catch (error) {
      return false;     
    }
  }

  async finishGame(
    userId: number,
    opponentId: number,
    winnerSc: number,
    loserSc: number,
    state: GameStatus,
  ) {
    try{
      const gameId = await this.getGameByUserId(userId, GameStatus.PLAYING);
      if (!gameId) {
        return false;
      }
      this.updateGame(gameId.id_game, state);
      
      this.updateUserGame(userId, gameId.id_game, 0, loserSc);
      this.updateUserGame(opponentId, gameId.id_game, 1, winnerSc);
      return gameId.id_game;
    }
    catch{
      return false;
    }
  }

  async getGame() {
    // Add your implementation here
  }
}
