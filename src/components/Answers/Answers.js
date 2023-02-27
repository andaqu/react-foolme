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

    const [answers, setAnswers] = useState({});

    const [voted, setVoted] = useState(false);

    useEffect(() => {
        if (round.status == "VOTING") {
            setVoted(false);

            // Get all answers from round
            answersRef.get().then((querySnapshot) => {
                var answers = {};
                querySnapshot.forEach((doc) => {
                    answers[doc.id] = doc.data();
                });
                setAnswers(answers);
                

            });

        } else if (round.status == "ASKING") {
            setAnswers({});
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
 
                      {Object.keys(answers).length > 0 ? (
                        
                        <div>
                          <Answer 
                            gameId={gameId} 
                            roundId={round.id}
                            answer={answers[uid].text}
                            uid={uid}
                            handleOnClick={handleOnClick} 
                            canVote={!voted && role == "human" && uid != user.uid}/>
                          </div>
                      ) : null}
                  </div>
              )
          })}
              
        </div>
      );
}

export default Answers;