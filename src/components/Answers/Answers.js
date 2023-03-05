import React, { useEffect, useState, useRef } from 'react';
import firebase from 'firebase/compat/app';
import Answer from './Answer';
import { useFirestoreQuery } from '../../hooks';

const Answers = ({gameId, round, role, users, user}) => {

    const db = firebase.firestore();

    const gameRef = db.collection('games').doc(gameId);
    const roundsRef = gameRef.collection('rounds');
    const roundRef = roundsRef.doc(round.id);

    const [voted, setVoted] = useState(false);

    // If answers changed, set voted to false
    useEffect(() => {
        if(round.status == "ANSWERING"){
            setVoted(false);
        }
    }, [round.status]);

    const handleOnClick = (uid) => {

      console.log("Voting for " + uid);

      // Add vote to answer (answers is a field in the round document)
        roundRef.get().then((doc) => {
            if (doc.exists) {
                var answers = doc.data().answers;
                if (answers) {
                    if (answers[uid]) {
                        answers[uid]["votes"] += 1;
                    } 

                    roundRef.update({
                        answers: answers
                    });
                }
            }
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

      console.log("voted")

      setVoted(true);
  }

    return (
        <div>
          <p>Answers:</p>

          {Object.keys(users).map((uid) => {
              return (
                  <div key={uid}>
                      {/* <p>{user.displayName}</p> */}
                      <img width="50" height="50" src={users[uid].photoURL} alt="Avatar"/>
 
                      {round.status == "VOTING" && round.answers[uid] ? (
                        
                        <Answer 
                            answer={round.answers[uid].text}
                            votes={round.answers[uid].votes}
                            uid={uid}
                            handleOnClick={handleOnClick} 
                            canVote={!voted && role == "human" && uid != user.uid}/>
                          
                      ) : null}
                  </div>
              )
          })}
              
        </div>
      );
}

export default Answers;