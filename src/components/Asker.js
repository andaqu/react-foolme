import React, { useEffect, useState, useRef } from 'react';
import firebase from 'firebase/compat/app';
import { useFirestoreQuery, generateAIAnswer, isAppropriate } from '../hooks';
import Answerer from './Answerer';
import Filter from 'bad-words';

const Asker = ({gameId = null, round=null, users, leaveGame, answers}) => {

    const [newQuestion, setNewQuestion] = useState('');
    const [asked, setAsked] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState('');

    const db = firebase.firestore();
    const filter = new Filter();    
    
    const gameRef = db.collection('games').doc(gameId);
    const roundsRef = gameRef.collection('rounds');
    const roundRef = roundsRef.doc(round.id);

    const [timeLeft, setTimeLeft] = useState(30);
    const [inActive, setInActive] = useState(false);


    useEffect(() => {
        if (!asked && round.status === "ASKING" && !inActive) {
            if (timeLeft > 0) {
                setTimeout(() => {
                    setTimeLeft(timeLeft - 1);
                }, 1000);
            } else if (timeLeft === 0) {
            
                leaveGame();

            }
        }
    }, [timeLeft, asked]);

    useEffect(() => {

        if (round) {
            setCurrentQuestion(round.question);
        }

    }, [round]);

    const handleOnSubmit = async (e) => {
        e.preventDefault();


        // Check if question is already in game's aiAnswers dictionary
        // If it is, it means that it has already been asked

        const game = await gameRef.get().then((doc) => {
            return doc.data();
        });
        const previousAIAnswers = game.aiAnswers;

        if (previousAIAnswers[newQuestion]) {
            alert("This question has already been asked!");
            return;
        }

        const appropriate = await isAppropriate(newQuestion);

        // Check if question is appropriate
        if (!appropriate) {
            alert("This question is not appropriate!");
            return;
        }
 
        setAsked(true);

        const filteredNewQuestion = filter.clean(newQuestion);

        const aiAnswer = await generateAIAnswer(filteredNewQuestion, previousAIAnswers);

        // Add question to round
        roundRef.update({
            question: filteredNewQuestion,
            status: 'ANSWERING'
        });

        // Add AI answer to round's answers dictionary in the form of {"ai": {text: answer, votes: 0}}
        roundRef.update({
            answers: {
                "ai": {
                    text: aiAnswer,
                    votes: 0
                },
                ...answers
            }
        });

        // Add question:answer pair to game's aiAnswers dictionary
        gameRef.update({
            aiAnswers: {
                [newQuestion]: aiAnswer, 
                ...previousAIAnswers
            }
        });

        setCurrentQuestion(filteredNewQuestion)

    }

    const handleOnChange = e => {
        setNewQuestion(e.target.value);
      };
    
    return (
        <div>
        
            {asked ? (
                <Answerer gameId={gameId} round={round} users={users} leaveGame={leaveGame} answers={answers}/>
            ) : (
                <div>
                <p>It's your turn to ask a question!</p>
                <p>Time left to ask: {timeLeft}</p>
                <form onSubmit={handleOnSubmit}>
                    <input
                    type="text"
                    value={newQuestion}
                    onChange={handleOnChange}
                    placeholder="Type your question here..."
                    />
                    <button type="submit" disabled={!newQuestion}>
                    Send
                    </button>
                </form>
                </div>
            )}
                
        </div>

    );


}

export default Asker;