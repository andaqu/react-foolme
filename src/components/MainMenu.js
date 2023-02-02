import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import Conversation from './Conversation';

const MainMenu = ({ user }) => {
  const [conversationId, setConversationId] = useState(false);
  const [userInQueue, setUserInQueue] = useState(false);

  const db = firebase.firestore();

  const queueRef = db.collection('queue');
  const usersRef = db.collection('users');

  // Query gets oldest 10 users in the queue
  const oldestQuery = queueRef.orderBy('createdAt', 'asc').limit(10);

  // Query gets the user's entry in the queue
  const userQuery = queueRef.doc(user.uid)

  // This only runs once as the component loads
  useEffect(()=>{

        // Check if there exists an entry for the user in the database where the uid matches
        // with the document id, if not, create a new user entry.
        userQuery.get().then(querySnapshot => {
          if (querySnapshot.empty) {

            console.log("Adding user to database...")

            usersRef.doc(user.uid).set({
              displayName: user.displayName,
              photoURL: user.photoURL,
              email: user.email,
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
          }
        });
  }, []) 

  useEffect(() => {
    const unsubscribe = userQuery.onSnapshot(snapshot => {

      // If you are in the queue, check if you have been matched
      if (userInQueue){

        // If you have been matched, get the conversationId
        if (snapshot.data().conversationId) {

          setConversationId(snapshot.data().conversationId);
          setUserInQueue(false);

          console.log('Removing yourself from the queue...');
          queueRef.doc(snapshot.id).delete();
        }
      }
    
    });
    return unsubscribe;
  }, [userQuery]);


  const handleOnClick = () => {
    oldestQuery.get().then(querySnapshot => {

      // If there are no users in the queue, add yourself
      if (querySnapshot.empty) {
        queueRef.doc(user.uid).set({
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          conversationId: null,
        });
        setUserInQueue(true);

      } else {

        // If there is one user in the queue, match with them
        // TODO: Improve logic here!
        const matchedUser = querySnapshot.docs[0];
        console.log(matchedUser.data())

        // Create a new conversation
        const conversationRef = db.collection('conversations').doc();
        conversationRef.set({
          users: [user.uid, matchedUser.id],
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        const messagesRef = conversationRef.collection('messages');

        // Add a welcome message to the conversation
        // messagesRef.add({
        //   text: 'Welcome to the chat room!',
        //   createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        //   uid: 'admin',
        //   displayName: 'Admin'
        // });

        // Get conversation id
        const conversationId = conversationRef.id;

        // Update the matched user in the queue by giving them the conversation id
        queueRef.doc(matchedUser.id).update({
          conversationId: conversationId,
        });

        // Update yourself in the queue by giving yourself the conversation id
        setConversationId(conversationId);
      }

    });
  };


  return (
    <div>
      <h2>Main menu</h2>
        <p>Welcome, {user.displayName}!</p>

      {!conversationId && !userInQueue && (
        <button onClick={handleOnClick}>Join a chat room</button>
      )}
      {userInQueue && (
        <div>Waiting for another user to join...</div>
      )}
      {conversationId && (
        <Conversation user={user} conversationId={conversationId}/>
      )}
    </div>
  );
};

export default MainMenu;