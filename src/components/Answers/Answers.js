import React, { useEffect, useState, useRef } from 'react';
import firebase from 'firebase/compat/app';
import Answer from './Answer';
import { useFirestoreQuery } from '../../hooks';

const Answers = ({gameId = null, round=null, voteable=false, role}) => {

    const [answers, setAnswers] = useState([]);

    const db = firebase.firestore();

    const gameRef = db.collection('games').doc(gameId);
    const roundsRef = gameRef.collection('rounds');
    const roundRef = roundsRef.doc(round.id);
    const answersRef = roundRef.collection('answers');

    const answersQuery = useFirestoreQuery(answersRef);
    const [everyoneAnswered, setEveryoneAnswered] = useState(false);

    const roundStatus = round.status || "INITIAL"

    const [voted, setVoted] = useState(false);

    // If roundId changes, reset everyoneAnswered to false
    useEffect(() => {
        setEveryoneAnswered(false);
    }, [round.id]);

    // If round status is VOTING, set everyoneAnswered to true
    useEffect(() => {

        if (roundStatus === 'VOTING') {

            console.log("Everyone answered!")
            setEveryoneAnswered(true);
            
        }
        
    }, [roundStatus]);

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
          {!everyoneAnswered ? (
            <p>No answers yet!</p>
          ) : (
            answersQuery.map((answer) => (
              <Answer
                key={answer.id}
                gameId={gameId}
                roundId={round.id}
                uid={answer.id}
                answer={answer.text}
                voteable={voteable}
                handleOnClick={handleOnClick}
                canVote={!voted && role == "human"}
              />
            ))
          )}
        </div>
      );
}

export default Answers;