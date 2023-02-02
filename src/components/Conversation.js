import React, { useEffect, useState, useRef } from 'react';
import firebase from 'firebase/compat/app';
import PropTypes from 'prop-types';
import { useFirestoreQuery } from '../hooks';
import Message from './Message';

const Conversation = ({ user, conversationId = null} ) => {

    const db = firebase.firestore();
    
    const conversationsRef = db.collection('conversations').doc(conversationId);
    const messagesRef = conversationsRef.collection('messages');

    const messages = useFirestoreQuery(
        messagesRef.orderBy('createdAt', 'asc').limit(100)
      );

    const [newMessage, setNewMessage] = useState('');

    const inputRef = useRef();
    const bottomListRef = useRef();

    useEffect(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, [inputRef]);

    const handleOnChange = e => {
        setNewMessage(e.target.value);
      };
    
    const handleOnSubmit = e => {
        e.preventDefault();

        const trimmedMessage = newMessage.trim();
        if (trimmedMessage) {
          // Add new message in Firestore
          messagesRef.add({
            text: trimmedMessage,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            uid: user.uid,
          });
          // Clear input field
          setNewMessage('');
          // Scroll down to the bottom of the list
          bottomListRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        
    };
    

    return (
        <div>
            <div>
                <ul>
                    {messages.map(message => (
                       <li key={message.id}>
                        <Message 
                            createdAt={message.createdAt}
                            text={message.text} 
                            uid={message.uid}
                        />
                     </li>
                    ))}
                </ul>
                <div ref={bottomListRef} />
            </div>
            <form
            onSubmit={handleOnSubmit}
            >
            <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={handleOnChange}
                placeholder="Type your message here..."
            />
            <button
                type="submit"
                disabled={!newMessage}
            >
                Send
            </button>
            </form>
        </div>
    );

};

Conversation.propTypes = {
    user: PropTypes.shape({
    uid: PropTypes.string,
    displayName: PropTypes.string,
    photoURL: PropTypes.string,
    }),
};
  

export default Conversation;