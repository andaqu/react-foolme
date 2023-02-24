import React, { useEffect, useState, useRef } from 'react';
import firebase from 'firebase/compat/app';
import Answer from './Answer';
import { useFirestoreQuery } from '../../hooks';

const Answers = ({gameId, round, role, users, user}) => {

    const db = firebase.firestore();

    const gameRef = db.collection('games').doc(gameId);
    const roundsRef = gameRef.collection('rounds');
    const roundRef = roundsRef.doc(round.id);
    const answersRef = roundRef.collection('answers');

    const answersQuery = useFirestoreQuery(answersRef);

    const [voted, setVoted] = useState(false);

    useEffect(() => {
        if (round.status == "VOTING") {
            setVoted(false);
        }
    }, [round.status]);

    const handleOnClick = (uid) => {

      console.log("Voting for " + uid);

      answersRef.doc(uid).update({
          votes: firebase.firestore.FieldValue.increment(1)
      });

      // Update gameRef with new vote. gameRef has a field called "votes" which is a dictionary of {uid: votes}.

      gameRef.get().then((doc) => {
          
          if (doc.exists) {

              var votes = doc.data().votes;
              if (votes) {
                  if (votes[uid]) {
                      votes[uid] += 1;
                  } else {
                      votes[uid] = 1;
                  }
              } else {
                  votes = {};
                  votes[uid] = 1;
              }
              gameRef.update({
                  votes: votes
              });
          }

      });

      setVoted(true);
  }

    return (
        <div>
          <p>Answers:</p>
         
          {users.map((u) => {
              return (
                  <div key={u.uid}>
                      {/* <p>{user.displayName}</p> */}
                      <img width="50" height="50" src={u.photoURL} alt="Avatar"/>
 
                      {round.status == "VOTING" ? (
                        <div>
                        { console.log(answersQuery)}
                          <Answer 
                            gameId={gameId} 
                            roundId={round.id}
                            answer={answersQuery.filter((answer) => answer.id == u.uid)[0].text}
                            uid={u.uid}
                            handleOnClick={handleOnClick} 
                            canVote={!voted && role == "human" && u.uid != user.uid}/>
                          </div>
                      ) : null}
                  </div>
              )
          })}
              
        </div>
      );
}

export default Answers;