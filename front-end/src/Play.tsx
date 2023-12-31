import { useContext, useEffect, useRef } from 'react';
// import Navbar from './Components/Navbar.tsx';
import Sbox from './Components/Sbox.tsx';
import  './styles/css/main.css'
import { useState } from 'react';
import { G } from '@svgdotjs/svg.js';
import { useDocumentVisible } from './useDocumentVisible'; // adjust the path according to your project structure
import { Players, Ball } from './Components/types';
import game from './Components/gameLogic';
import axios from 'axios';
import { UserContext } from './UserProvider.tsx';


export function Play({ setInPlay, inviter, setboardWidth }: { setInPlay: any, inviter: any, setboardWidth: React.Dispatch<React.SetStateAction<number | null>> }){
  const { user, socket } = useContext(UserContext);
  // const {setInPlay, inviter} = props;
    const isDocumentVisible = useDocumentVisible();
    const isMounted = useRef<boolean>(false);; // useRef to track whether the component is mounted
    const [showSbox, setShowSbox] = useState(true);
    const [showGame, setshowGame] = useState(false);    
    const [inGame, setInGame] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // Add a new state variable for loading
    const [players, setPlayers] = useState<Players>({});
    const [error, setError] = useState(false);
    const [currentPad, setCurrentPad] = useState(1);
    const [currentBoard, setCurrentBoard] = useState(1);
    const bballRef = useRef<Ball>({
      cercle: new G(),
      vx: 0,
      vy: 0,
      cx: 0,
      cy: 0,
    });
    
    const handleFriendClick = async (player_id: number) => {
      if (socket && componentRef.current?.offsetWidth)
      {
        socket.emit('invite', 
        {
          adv_id: player_id.toString(),
          userId: user?.id_player.toString(),
          username: user?.username,
          width: componentRef.current?.offsetWidth,
          difficulty: 3,
        }, async (response: any) => {
          console.log('Received acknowledgement from server:', response);
          if (!response) {
            setError(true);
            console.log('error');
            return;
          }
          const gameResponse = await axios.get('http://localhost:3000/game/creategame',  { withCredentials: true });
          const gameId = gameResponse.data.id_game;
          await axios.post(`http://localhost:3000/game/${gameId}/joinGame`, {userId: user?.id_player},  { withCredentials: true });
          setIsLoading(true);
        });
      }
    };
    
    // const inviteResp = async (resp: Boolean, inviter: any) => {
    //   if (socket)
    //   {
    //     socket.emit('inviteResp', {
    //       accepted: resp,
    //       userId: inviter.id_player.toString(),
    //       adv_id: user?.id_player.toString(),
    //       username: user?.username,
    //     }, async (response: any) => {
    //       console.log('Received acknowledgement from server:', response);
    //       if (!response) {
    //         console.log('error');
    //         // setInvite(inviteStatus.ABORTED);
    //         // setInviter(null);
    //         return;
    //       }
    //       // setInvite(inviteStatus.ACCEPTED);
    //       let gameId = await axios.get(`http://localhost:3000/game/${inviter.id_player}/getgame/SEARCHING`, { withCredentials: true });
    //       console.log('gameId: ', gameId);
    //       gameId = gameId.data.id_game;
    //       console.log('gameId: ', gameId);
    //       await axios.post(`http://localhost:3000/game/${gameId}/joinGame`, {userId: user?.id_player},  { withCredentials: true });
    //       await axios.post(`http://localhost:3000/game/${gameId}/updateGame`, {status: 'PLAYING'},  { withCredentials: true });
    //     });
    //   }
    // };

    // useEffect(() => {
    //   console.log('effect invite: ', invite);
      
    //   if (invite === inviteStatus.ACCEPTED) {
    //     inviteResp(true, inviter);
    //   }
    //   if (invite === inviteStatus.DECLINED) {
    //     inviteResp(false, inviter);
    //   }
    // }, [invite]);


    const handleMatchClick = async () => {
      let resp: {id: string | null} = {id: null};
      let userId: string | null = null;
      console.log('user in play : ', user);
      if (user) {
        userId = user.id_player;
      }
      console.log('currentPad: ', currentPad);
      if (socket && componentRef.current)
      socket.emit('matchmaking', { id: socket.id, width: componentRef.current?.offsetWidth, difficulty: 3, padl: currentPad }, async (response: any) => {
        console.log('Received acknowledgement from server:', response);
        resp = response;
        if (!resp) {
          console.log('error');
        }
        else if (!resp.id) {
          const gameResponse = await axios.get('http://localhost:3000/game/creategame',  { withCredentials: true });
          const gameId = gameResponse.data.id_game;
          await axios.post(`http://localhost:3000/game/${gameId}/joinGame`, {userId: userId},  { withCredentials: true });
          setIsLoading(true);
        }
        else {
          // got the players ratio
          let gameId = await axios.get(`http://localhost:3000/game/${resp.id}/getgame/SEARCHING`, { withCredentials: true });
          console.log('gameId: ', gameId);
          gameId = gameId.data.id_game;
          console.log('gameId: ', gameId);
          await axios.post(`http://localhost:3000/game/${gameId}/joinGame`, {userId: userId},  { withCredentials: true });
          await axios.post(`http://localhost:3000/game/${gameId}/updateGame`, {status: 'PLAYING'},  { withCredentials: true });
        }
      });
    };
    
    useEffect(() => {
      if (!socket || !isMounted.current || !user)
        return;
      axios.get(`http://localhost:3000/game/${user.id_player}/getgame/PLAYING`, { withCredentials: true }).then
      ((res) => {
        if (res.data.id_game) {
          setInGame(true);
          console.log('res: ', res);
        }
      }).catch((err) => {
        console.log('err: ', err);
      });
      axios.get(`http://localhost:3000/game/${user.id_player}/getgame/SEARCHING`, { withCredentials: true }).then
      ((res) => {
        if (res.data.id_game) {
          setInGame(true);
          console.log('res: ', res);
        }
      }).catch((err) => {
        console.log('err: ', err);
      });
      socket.on('startGame', ({players, bball}) => {
        setIsLoading(false); // Set loading to false when the game starts
        setShowSbox(false);
        setPlayers(players);
        setshowGame(true);
        console.log("game started");
        bballRef.current = bball;
      });
      socket.on('alreadyInQueue', () => {
        setIsLoading(true); // Set loading to false when the game starts
        console.log("game alreadyInQueue");
        return {inGame: true};
        // axios.delete(`http://localhost:3000/game/${user?.id_player}/deletegame/SEARCHING`, { withCredentials: true }).then
      });

      // socket.on('invited', (data: any) => {
      //   axios.get(`http://localhost:3000/profile/${data}`, { withCredentials: true }).then
      //   ((res) => {
      //     console.log("invited by ", data);
      //     setInviter(res.data);
      //     setInvite(inviteStatus.INVITED);
      //   }).catch((err) => {
      //     console.log('err: ', err);
      //   });
      // });

      socket.on('rejected', () => {
        console.log("rejected");
        // setInvite(inviteStatus.DECLINED);
        inita();
      });

      socket.on('InitializeGame', () => {
        setIsLoading(false); // Set loading to false when the game starts
        setShowSbox(true);
        setshowGame(false);
        console.log("game aborted");
      });
      socket.on('disconnectGame', () => {
        console.log('disconnectGame');
      } );
      console.log('walla');
      setInPlay(true);
      return () => {
        setInPlay(false);
        // socket.off('startGame');
        // isMounted.current = false; // Set to false when the component is unmounted
      };
    }, [isMounted, socket, user]);

    // useEffect(() => {
    //   // creating the game on database, and getting the players
    // }, [players]);

    useEffect(() => {
      if (!isMounted.current || !socket)
        return;
      if (isDocumentVisible) {
        console.log('isDocumentVisible: ', isDocumentVisible);
        socket.emit('documentVisible', { id: socket.id, userId: user?.id_player });
      }
      // else {
      //   socket.emit('playClose', { id: socket.id });
      // }
    }, [isDocumentVisible]);
    const componentRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      if (!isMounted.current || !socket)
      {
        return;
      }
      if (componentRef.current) {
        const width = componentRef.current.offsetWidth;
        setboardWidth(width);
      }
    }, []);
    
    const inita = async () => {
      setIsLoading(false); // Set loading to false when the game starts
      setShowSbox(true);
      setshowGame(false);
      console.log("game aborted");
    };

    useEffect(() => {
      if (!isMounted.current || !socket)
      {
        return;
      }
      
      if (showGame && componentRef.current) {
        const width = componentRef.current.offsetWidth;
        console.log('ball: ', bballRef.current);
        if (user){
          const cleanup = game(socket, 3, currentBoard, players, bballRef.current, width, user, players[user.id_player].ratio, players[user.id_player].vxratio, inita);
          return () => {
            cleanup();
          };
        }
      }
    } , [showGame]);

    useEffect(() => {
      return () => {
        isMounted.current = true;
      };
    } , []);

    return (
      <>
        <div ref={componentRef}
        className="game_container" id="game_container">
          {showSbox && (
              <Sbox
                  btitle="Play"
                  stitle="Goat pong"
                  lb="Play with friend"
                  rb="Matchmaking"
                  isLoading = {isLoading} // Pass the loading state to the loading component
                  inGame = {inGame}
                  // invite = {invite}
                  error = {error}
                  inviter = {inviter}
                  handleMatchClick={handleMatchClick}
                  handleFriendClick={handleFriendClick}
                  setCurrentPad={setCurrentPad}
                  setCurrentBoard={setCurrentBoard}
                  currentPad={currentPad}
                  currentBoard={currentBoard}
                  // inviteResp={inviteResp}
              >
              </Sbox>
          )}
          {showGame &&
                  <div className="pong" id="pong">
                  </div>
          }
        </div>
      </>
    );
};

