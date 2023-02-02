import React from 'react';

// Components
import MainMenu from './components/MainMenu';

// Hooks
import { useAuthState } from './hooks';

// Firebase deps
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

firebase.initializeApp({
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
});

const db = firebase.firestore();

function App() {

  const { user, initialising} = useAuthState(firebase.auth())

  const signInWithGoogle = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // Set language
    firebase.auth().useDeviceLanguage();

    // Start sign in process
    try {
      await firebase.auth().signInWithPopup(provider);
    } catch (error) {
      console.log(error);
    }
  };

  const signOut = async () => {
    try {
      await firebase.auth().signOut();
    } catch (error) {
      console.log(error.message);
    }
  };

  const renderContent = () => {
    if (initialising) {
      return (
        <div>
          Loading...
        </div>
      );
    }

    if (user)
      return <MainMenu user={user}/>;
    

    return (
      <div>
        <button onClick={signInWithGoogle}>Sign in with Google</button>
      </div>
    );
  };


  return (
    <div className="App">
      <header className="App-header">
        <h1>React Firebase Chat</h1>
        {user && <button onClick={signOut}>Sign out</button>}
      </header>
      <main>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
