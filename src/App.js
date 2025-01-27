import React, { useState } from 'react';
import Navbar from './components/Navbar';
import { useAuth } from './contexts/authContext';
import ChatBox from './components/ChatBox';
import SignUp from './components/public/SignUp';
import SignIn from './components/public/SignIn';
import Hero from './components/public/Hero';
import About from './components/public/About';
import Contact from './components/public/Contact';
import Cookies from './components/public/Cookies';
import EmailVerification from './components/EmailVerification';

function App() {
  const [showSignUp, setShowSignUp] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const { userSignedIn, currentUser } = useAuth();
  const needsVerification = userSignedIn && 
    currentUser?.providerData[0]?.providerId === 'password' && 
    !currentUser?.emailVerified;

  return (
    <div>
      <Navbar 
        setShowSignUp={setShowSignUp} 
        setShowSignIn={setShowSignIn}
      />
      {needsVerification ? (
        <EmailVerification email={currentUser.email} />
      ) : (
        <>
          {!userSignedIn && (
            <>
              <Hero setShowSignUp={setShowSignUp} setShowSignIn={setShowSignIn} />
              <About />
              <Contact />
            </>
          )}
          {showSignUp && <SignUp setShowSignUp={setShowSignUp} setShowSignIn={setShowSignIn} />}
          {showSignIn && <SignIn setShowSignIn={setShowSignIn} setShowSignUp={setShowSignUp} />}
          {userSignedIn && (<ChatBox />)}    
        </>
      )}
      <Cookies />
    </div>
  );
}

export default App;