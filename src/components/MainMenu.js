import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import Game from './Game';
import { useFirestoreQuery } from '../hooks';

const MainMenu = ({ user }) => {

  const NUMBER_OF_USERS = 2;

  const [gameId, setGameId] = useState(false);

  const [userInQueue, setUserInQueue] = useState(false);
  const [myRole, setMyRole] = useState(false);

  const db = firebase.firestore();

  const queueRef = db.collection('queue');
  const usersRef = db.collection('users');

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState({});

  // Query gets oldest 3 users in the queue except yourself
  const oldestQuery = queueRef
    .where(firebase.firestore.FieldPath.documentId(), '!=', user.uid)
    .limit(3);

  // Query that gets you in the queue
  var userInQueueQuery = useFirestoreQuery(queueRef
    .where(firebase.firestore.FieldPath.documentId(), '==', user.uid))[0];

  // This only runs once as the component loads
  useEffect(()=>{

        // Check if there exists an entry for the user in the database where the uid matches
        // with the document id, if not, create a new user entry.
        usersRef.doc(user.uid).get().then(doc => {
          if (!doc.exists) {
            usersRef.doc(user.uid).set({
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
              uid: user.uid
            });
          }
        });
  }, []) 

  useEffect(() => {

    // If you are in the queue, check if you have been matched
    if (userInQueue){

      if (userInQueueQuery) {

        // If you have been matched, get the gameId
        if (userInQueueQuery.gameId) {

          setGameId(userInQueueQuery.gameId);
          setUserInQueue(false);

          // Get the role of the user by looking at the roles dictionary in the games collection
          const gameRef = db.collection('games').doc(userInQueueQuery.gameId);
          gameRef.get().then(async doc => {
            if (doc.exists) {
              const game = doc.data();
              setMyRole(game.roles[user.uid]);
              const userIds = Object.keys(game.roles);
              userIds.push("ai");
              const users = await getUserProfilesFromIds(userIds)
              setUsers(users);
              setRoles(game.roles);
            }
          });
        
          console.log('Removing yourself from the queue...');
          queueRef.doc(userInQueueQuery.id).delete();
        }
      } else {
        console.log('You have not been matched yet');
      }
    }

  }, [userInQueueQuery]);

  const getUserProfilesFromIds = (userIds) => {
    // return as a dict of {uid: user}
    return new Promise((resolve, reject) => {
      const users = {};
      const promises = [];
      userIds.forEach(uid => {
        const promise = usersRef.doc(uid).get().then(doc => {
          if (doc.exists) {
            users[uid] = doc.data();
          }
        });
        promises.push(promise);
      });
      Promise.all(promises).then(() => resolve(users));
    });
  }


  const handleOnClick = () => {

    oldestQuery.get().then(async querySnapshot => {

      // If there are less than NUMBER_OF_USERS with had you join the queue, add yourself to the queue
      
      if (querySnapshot.size < NUMBER_OF_USERS - 1) {
        queueRef.doc(user.uid).set({
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          gameId: null,
        });
        setUserInQueue(true);

      } else {

        // If there are NUMBER_OF_USERS - 1 users in the queue, match with them
        const matchedUsers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Create a new game
        const gameRef = db.collection('games').doc();

        const usersInGame = [user.uid, ...matchedUsers.map(user => user.id)];

        // Set the roles to be the same for testing purposes, i.e. the first user is always the impostor and the rest are always the human, iterating for NUMBER_OF_USERS
        const roles = {};
        for (let i = 0; i < NUMBER_OF_USERS; i++) {
          roles[usersInGame[i]] = i === 0 ? "impostor" : "human";
        }

        // Make a list named "askOrder" that contains an arrangement of user ids that dictate the order of who gets to ask a question
        const askOrder = [];
        for (let i = 0; i < NUMBER_OF_USERS; i++) {
          // If user is a human, add them to the askOrder
          if (roles[usersInGame[i]] === "human"){
            askOrder.push(usersInGame[i]);
          }
        }
        
        // Shuffle askOrder
        for (let i = askOrder.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [askOrder[i], askOrder[j]] = [askOrder[j], askOrder[i]];
        }

        // Initialise votes to have all users vote for themselves
        const votes = {};
        for (let i = 0; i < NUMBER_OF_USERS; i++) {
          votes[usersInGame[i]] = 0;
        }
        votes["ai"] = 0;

        // Initialise abandonded dictionary with all users as false
        const abandonedAt = {};
        for (let i = 0; i < NUMBER_OF_USERS; i++) {
          abandonedAt[usersInGame[i]] = false;
        }

        // Add the game to the database
        gameRef.set({
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          endedAt: null,
          active: true,
          abandonedAt: abandonedAt,
          roles: roles,
          askOrder: askOrder,
          votes: votes,
          aiAnswers: {},
        });

        // Initialise first round to round collection in gameRef
        gameRef.collection('rounds').doc().set({
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          status: 'ASKING',
          asker: askOrder[0],
          question: ''
        })
    
        // Get game id
        const gameId = gameRef.id;

        // Update the matched users in the queue by giving them the game id
        matchedUsers.forEach(matchedUser => {
          queueRef.doc(matchedUser.id).update({
            gameId: gameId,
          });
        });

        setMyRole(roles[user.uid]);
        setRoles(roles);

        const userIds = Object.keys(roles);
        userIds.push("ai");

        const users = await getUserProfilesFromIds(userIds)
        setUsers(users);

        // Update yourself in the queue by giving yourself the game id
        setGameId(gameId);

        
      }

    });
  };


  return (
    <div>
      <h2>Main menu</h2>
        <p>Welcome, {user.displayName}!</p>

      {!gameId && !userInQueue && (
        <button onClick={handleOnClick}>Join a chat room</button>
      )}
      {userInQueue && (
        <div>Waiting for users to join...</div>
      )}
      {gameId && (
        <Game user={user} role={myRole} users={users} roles={roles} setUsers={setUsers}  gameId={gameId}/>
      )}
    </div>
  );
};

export default MainMenu;