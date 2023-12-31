import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChatType, Prisma } from '@prisma/client';
// import { getUser } from 'src/player';

type ChatMessageUncheckedCreateInput = Prisma.ChatMessageUncheckedCreateInput;
type ChatWhereInput = Prisma.ChatWhereInput;


@Injectable()
export class MessagesService {
  public clients = {};

  constructor(private prisma: PrismaService) {}

  

  async identify(id: number, name: string, selectedType: string, selectedPswd: string, clientId: string) {
    let chatUSers : any = null;
    
    // console.log('password in service: ');
    // console.log(selectedPswd);
    console.log('called identify');

    let existingChat = await this.prisma.chat.findFirst({
      where: {
        name: {
          equals: name,
        },
      } as ChatWhereInput,
    });
    
    console.log('id: ' + id + ' user: ' + name + ' is trying to join the chat');
    if (existingChat.type === 'PROTECTED') {
        chatUSers = await this.prisma.chatUser.findFirst({
          where: {
            chatId: existingChat.id_chat,
            userId: id,
          },
        });
        if (selectedPswd !== existingChat.password && chatUSers === null) {
          console.log('id: ' + id + ' user: ' + name + ' cant join the chat because of wrong password');
          return false;
        }
        if (chatUSers) {
          console.log('id: ' + id + ' user: ' + name + ' already joined the chat');
          return existingChat;
        }
        else{
          chatUSers = await this.prisma.chatUser.create({
            data: {
              chatId: existingChat.id_chat,
              userId: id,
            },
          });
        }
    }
    else{
      chatUSers = await this.prisma.chatUser.findFirst({
        where: {
          chatId: existingChat.id_chat,
          userId: id,
        },
      });
      if (chatUSers) {
        console.log('id: ' + id + ' user: ' + name + ' already joined the chat');
        return existingChat;
      }
      else{
        chatUSers = await this.prisma.chatUser.create({
          data: {
            chatId: existingChat.id_chat,
            userId: id,
          },
        });
      }
    }
    console.log('id: ' + id + ' user: ' + name + ' joined the chat');
    
    console.log(existingChat);
    console.log('-------------------');
    console.log(chatUSers);
    return existingChat;
  }

  // joining a dm

  async identifyDm(id: number, name: string, username: string, clientId: string) {


    const usertojoin = await this.prisma.player.findFirst({
      where: {
        username: name,
      },
    });

    let existingChat = await this.prisma.chat.findFirst({
      where: {
        AND: [
          { type: 'PRIVATE' },
          {
            users: { some: { userId: id } }
          },
          {
            users: { some: { userId: usertojoin.id_player } }
          }
        ]
      } as ChatWhereInput,
    });
    // console.log('id: ' + id + ' user: ' + username + ' is trying to join the chat');
    if (existingChat) {
      console.log('id: ' + id + ' user: ' + username + ' already joined the chat');
      return existingChat;
    }
    else{
      const newChat = await this.prisma.chat.create(
        {
          data: {
            type: 'PRIVATE',
            // name: name,
          },
        },
      );
      const chatUSers = await this.prisma.chatUser.create({
        data: {
          chatId: newChat.id_chat,
          userId: id,
        },
      });
      const chatUSers2 = await this.prisma.chatUser.create({
        data: {
          chatId: newChat.id_chat,
          userId: usertojoin.id_player,
        },
      });
      console.log('id: ' + id + ' user: ' + username + ' joined the chat');
      console.log(newChat);
      console.log('-------------------');
      console.log(chatUSers);
      console.log('-------------------');
      console.log(chatUSers2);
      return newChat;
    }
  
  
  }

  async createChannel(id: number, name: string, roomType: ChatType, roomPassword: string,clientId: string) {
    console.log('id: ' + id + ' user: ' + name + ' been created');


    type roomType = 'PUBLIC' | 'PRIVATE' | 'PROTECTED';
    const roomType1: roomType = roomType as roomType;
    console.log('room type: ');
    console.log(roomType1);
    const existingChat = await this.prisma.chat.findFirst({
      where: {
        name: {
          equals: name,
        },
      } as ChatWhereInput,
    });

    if (existingChat) {
      return false;
    }
    let newChat : any = null;
    if (roomType1 === 'PRIVATE' || roomType1 === 'PROTECTED') {
    newChat = await this.prisma.chat.create({
      data: {
        name: name,
        type: ChatType[roomType1],
        password: roomPassword,
      },
    });
    }
    else{
        newChat = await this.prisma.chat.create({
        data: {
          name: name,
        },
      });
    }

    const chatUSers = await this.prisma.chatUser.create({
      data: {
        chatId: newChat.id_chat,
        userId: id,
        role: 'ADMIN',
      },
    });

    console.log(newChat);
    console.log('-------------------');
    console.log(chatUSers);
    // return Object.values(this.clients);
    

  
  
  }

  getClientName(clientId: string) {
    return this.clients[clientId];
  }
  async create(createMessageDto: CreateMessageDto, clientId: string, id: number, username: string | null) {
    
    // console.log(createMessageDto.);

    const message = {
      name: createMessageDto.name,
      text: createMessageDto.text,
    };
    let createdChatMessage = null;
    if (username === null) {
      console.log('username is null so its a channel');
      const chat = await this.prisma.chat.findFirst({
        where: {
          name: message.name,
        },
      });
      // console.log('chat that user want to send msg in : ');
      // console.log(chat);

      createdChatMessage = await this.prisma.chatMessage.create({
        data: {
          message: message.text,
          chatId: chat.id_chat as number,
          userId: id as number,
        },
        include: {
          user: {
            select: {
              username: true,
              avatar: true,
            },
          },
          chat: {
            select: {
              name: true,
            },
          },
        },
      });
      console.log('message that just got created : ');
      console.log(createdChatMessage);
    }
    else {
      console.log('username ' + username + ' want to send msg to ' + message.name + '')
      
      const user = await this.prisma.player.findFirst({
        where: {
          username: message.name,
        },
      });
      const chat = await this.prisma.chat.findFirst({
        where: {
          AND: [
            { type: 'PRIVATE' },
            {
              users: { some: { userId: id } }
            },
            {
              users: { some: { userId: user.id_player } }
            }
          ]
        } as ChatWhereInput
      });

      createdChatMessage = await this.prisma.chatMessage.create({
        data: {
          message: message.text,
          chatId: chat.id_chat as number,
          userId: id as number,
        },
        include: {
          user: {
            select: {
              username: true,
              avatar: true,
            },
          },
          chat: {
            select: {
              name: true,
            },
          },
        },
      }) as { user: { username: string }, id3_chat_message: number, message: string, userId: number, chatId: number, sentAt: Date };
        
      console.log('message that just got created : ');
      console.log(createdChatMessage);
    }
      



    return createdChatMessage;
  }
  async findAll(name: string, id: number, username: string) {
    // console.log('name: ');
    // console.log(name);
    let messages = null;
    if (username === null && id === 0) {

      messages = await this.prisma.chatMessage.findMany({

        where: {
          chat: {
            name: name,
          },
        },
        include: {
          user: {
            select: {
              username: true,
              avatar: true,
            },
          },
          chat: {
            select: {
              name: true,
            },
          },
        },
      });
    }
    else {
      const user = await this.prisma.player.findFirst({
        where: {
          username: name,
        },
      });
      const chat = await this.prisma.chat.findFirst({
        where: {
          AND: [
            { type: 'PRIVATE' },
            {
              users: { some: { userId: id } }
            },
            {
              users: { some: { userId: user.id_player } }
            }
          ]
        } as ChatWhereInput,
      });
      if (chat)
      {
        messages = await this.prisma.chatMessage.findMany({
          where: {
            chatId: chat.id_chat,
          },
          include: {
            user: {
              select: {
                username: true,
                avatar: true,
              },
            },
          },
          
        });
      }
      
  }
  return messages;
}
  async findRoom(name: string) {
   
    const chat = await this.prisma.chat.findFirst({
      where: {
        name: name,
      },
    });

    return chat;
  }

  async getUsers(id: number) {
    const users = await this.prisma.player.findMany({
      where: {
        NOT: {
          id_player: id,
        },
      },
    });
    return users;
  }

  async getRooms(id: number) {
    const rooms = await this.prisma.chat.findMany({
      where: {
        OR: [
          { type: { not: 'PRIVATE' } },
          {
            type: 'PRIVATE',
            users: { some: { userId: id } },
            name: { not: null },
          }
        ]
      },
    });

    const chatUsers = await this.prisma.chatUser.findMany({
      where: {
        chatId: { in: rooms.map(room => room.id_chat) }
      }
    });
    return rooms.map(room => {
      const chatUser = chatUsers.find(chatUser => chatUser.chatId === room.id_chat && chatUser.userId === id);
      return {
        ...room,
        chatUser: chatUser
      }
    });
}
}
