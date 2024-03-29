import Logo from './Components/Logo';
import ftlogo from '/ftlogo.png';
import raketa from "/raketa.png";
import Button from './Components/Button'
import './styles/css/Login.css';
import { useEffect } from 'react';

export function Login() {

  // const location = useLocation();
  // const code = 
  // const state = new URLSearchParams(location.search).get('state');

  useEffect(() => {
    return () => {
    }
  } , []);

  return (
    <>
    <section className="sidebar">
      <Logo name={''}></Logo>
      <div className="signin">
        <div className="ftlogo">
          <img src={ftlogo} alt="ftlogo" />
        </div>
        <div className="bt">
          <Button link={`${import.meta.env.VITE_REACT_APP_BACKEND_URL}/auth/42`} msg= "Sign in with intra"/>
        </div>
      </div>
    </section>
    <main className="cmain">
      <div className="raketa">
        <img src={raketa} alt="raketa" />
      </div>
    </main>
    </>
  )
}

