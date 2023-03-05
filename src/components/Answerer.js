import { isAppropriate } from '../hooks';
import React, { useEffect, useState, useRef } from 'react';
import firebase from 'firebase/compat/app';
import Filter from 'bad-words';

const Answerer = ({gameId = null, round, users, leaveGame}) => {

    const [newAnswer, setNewAnswer] = useState('');
    const [answered, setAnswered] = useState(false);

    const db = firebase.firestore();
    const filter = new Filter();
    
    const gameRef = db.collection('games').doc(gameId);
    const roundsRef = gameRef.collection('rounds');
    const roundRef = roundsRef.doc(round.id);

    const [currentQuestion, setCurrentQuestion] = useState('');
    const [timeLeft, setTimeLeft] = useState(0);


    useEffect(() => {

          if (round.status==="ANSWERING") {
              setCurrentQuestion(round.question);
          } else if (round.status==="ASKING") {
              setCurrentQuestion("")
              setAnswered(false);
              setTimeLeft(30);
          }

    }, [round]);

    useEffect(() => {
       
        if (!answered && currentQuestion) {
            
            if (timeLeft > 0) {
                setTimeout(() => {
                    setTimeLeft(timeLeft - 1);
                }, 1000);
            } else if (timeLeft === 0) {

              leaveGame();
              
            }
        }
    }, [timeLeft, answered, currentQuestion]);

    // If everyone in the users answered, set status of round to "VOTING"
    useEffect(() => {

        if (currentQuestion && round.answers && users) {
          
          // If all keys in users are all the keys in answers
            if (Object.keys(users).every((key) => Object.keys(round.answers).includes(key))) {

                roundRef.update({
                    status: "VOTING"
                });
               
            }
        }
    }, [round.answers, users, currentQuestion]);
    
      
    const handleOnSubmit = async (e) => {
        e.preventDefault();

        const appropriate = await isAppropriate(newAnswer);

        // Check if question is appropriate
        if (!appropriate) {
            alert("This answer is not appropriate!");
            return;
        }
        
        // Add answer to round's answers dictionary in the form of {uid: {text: answer, votes: 0}}
        roundRef.update({
            answers: {
                ...round.answers,
                [firebase.auth().currentUser.uid]: {
                    text: filter.clean(newAnswer),
                    votes: 0
                }
            }
        });

        setAnswered(true);

        setNewAnswer("");

    }

    const handleOnChange = e => {
        setNewAnswer(e.target.value);
      };
    
      return (
        <div>
      
              {answered ? (
                <div>
                  <h3>Question: {currentQuestion}</h3>
                  {/* <p>You have already answered the question.</p> */}
                </div>
              ) : currentQuestion ? (
                <div>
                  <h3>Question: {currentQuestion}</h3>
                  <p>Time left to answer: {timeLeft}</p>
                  <div>
                    <form onSubmit={handleOnSubmit}>
                      <input
                        type="text"
                        value={newAnswer}
                        onChange={handleOnChange}
                        placeholder="Type your answer here..."
                      />
                      <button type="submit" disabled={!newAnswer}>
                        Send
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <p>Waiting for question to be asked...</p>
              )}
           

      
        </div>

      );
      
}

export default Answerer;