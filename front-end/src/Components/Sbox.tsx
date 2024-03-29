import '../styles/css/main.css'
import LoadingComponent from './LoadingComponent'; // Import the loading component
import { SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import { User, inviteStatus } from './types';
import Board1 from '../assets/game/zig-zag.svg';
import Board2 from '../assets/game/sor.svg';
import Board4 from '../assets/game/b4.svg';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Import Font Awesome styles
import { Pattern, Rect, SVG, Svg } from '@svgdotjs/svg.js';
import { padlPattern1, padlPattern2, padlPattern3, boardPattern1, boardPattern2, boardPattern3 } from './patterns';
import GamePattern from './Pattern';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../UserProvider';
import Button from './Button';


export default function Sbox(props: any) {
  const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [Players, setPlayers] = useState(false);
    const psvgRef = useRef<Svg | null>(null);
    const bsvgRef = useRef<Svg | null>(null);
    const paddleRef = useRef<Rect | null>(null);
    const boardRef = useRef<Rect | null>(null);
    const {setCurrentBoard, setCurrentPad}  = props;
    const {currentPad, currentBoard, isLoading} = props;

    
    const handlePrevClick = (slide: number) => {
      if (slide === 1)
        setCurrentPad(prevPad => (prevPad > 1 ? prevPad - 1 : 3));
      else if (slide === 2)
        setCurrentBoard(prevBoard => (prevBoard > 1 ? prevBoard - 1 : 3));
    };

    const handleNextClick = (slide: number) => {
      if (slide === 1)
        setCurrentPad(prevPad => (prevPad < 3 ? prevPad + 1 : 1));
      else if (slide === 2)
        setCurrentBoard(prevBoard => (prevBoard < 3 ? prevBoard + 1 : 1));
    };

    useEffect(() => {
      if (psvgRef.current && paddleRef.current) {
        if (currentPad === 1) {
          paddleRef.current.fill(padlPattern1(psvgRef.current));
        } else if (currentPad === 2) {
          paddleRef.current.fill(padlPattern2(psvgRef.current));
        } else if (currentPad === 3) {
          paddleRef.current.fill(padlPattern3(psvgRef.current));
        }
      }
    }, [currentPad]);

    useEffect(() => {
      if (bsvgRef.current && boardRef.current) {
        if (currentBoard === 1) {
          boardRef.current.fill(boardPattern1(bsvgRef.current));
        }
        else if (currentBoard === 2) {
          boardRef.current.fill(boardPattern2(bsvgRef.current));
        }
        else if (currentBoard === 3) {
          boardRef.current.fill(boardPattern3(bsvgRef.current));
        }
      }
    }, [currentBoard]);

    useEffect(() => {
      return () => {
        bsvgRef.current?.remove();
        psvgRef.current?.remove();
      }
    }, [isLoading]);

    return (
        <>
            <main className="wrapper">
                {isLoading && <LoadingComponent />} {/* Render the loading component when isLoading is true */}
                {!isLoading && !props.inGame && (
                    <div className="sbox">
                        {props.error && (
                            <div className="sbox__title">
                                <h1 className="btitle" style={{color: "red"}}>Error</h1>
                            </div>
                        )}
                        {Players && !props.inviter && (
                          <div className="players">
                            {users.map((user : User, index : number) => (
                                <div key={index} className="player">
                                <img src={user.avatar} alt="player" className="player__img" />
                                <h3 className="player__name">{user.username}</h3>
                                <button onClick={()=> props.handleFriendClick(user.id_player)} className="player__button" >Invite</button>
                                {/* <button onClick={()=> searchPlayer(user.id_player)} className="player__button" >Invite</button> */}
                                </div>
                            ))}
                          </div>
                        )}
                        {!Players && (
                          <div className="sbox__title">
                              <h1 className="btitle">{props.btitle}</h1>
                              <h3 className="stitle">{props.stitle}</h3>
                          </div>
                        )}
                        <div className="sbox__btn">
                          {!props.inviter ?

                            (
                            <Button link="#" msg={props.rb} onClick={()=> props.handleMatchClick()} value={props.rb} />
                            ) :
                          (
                            <Button link="#" msg={props.lb} onClick={()=> props.handleFriendClick(props.inviter)} value={props.lb} />
                            )
                          }
                        </div>
                        <div className="settings">
                          <div className="boardslider">
                            <h3 className="stitle">Choose your board</h3>
                            <div className="boards">
                              <GamePattern pad={0} board={currentBoard} width={200} height={125} cx={100} cy={62} />
                              {/* <img src={Board1} alt="board" className="board" /> */}
                            </div>
                            <button className="slide_btn" onClick={()=>handlePrevClick(2)}><i className="fas fa-chevron-left"></i></button>
                            <button className="slide_btn slide1" onClick={()=>handleNextClick(2)}><i className="fas fa-chevron-right"></i></button>
                          </div>
                          <div className="boardslider">
                            <h3 className="stitle">Choose your paddle</h3>
                            <div className="paddls boards">
                              <GamePattern pad={currentPad} board={0} width={160} height={125} cx={90} cy={62}/>
                              {/* <div id="padl" className="board"> */}
                              {/* </div> */}
                            </div>
                            <button className="slide_btn" onClick={()=>handlePrevClick(1)}><i className="fas fa-chevron-left"></i></button>
                            <button className="slide_btn slide1" onClick={()=>handleNextClick(1)}><i className="fas fa-chevron-right"></i></button>
                          </div>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}