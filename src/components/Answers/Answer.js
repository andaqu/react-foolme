import React, { useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import firebase from 'firebase/compat/app';
import { useFirestoreQuery } from '../../hooks';

const Answer = ({ answer, votes, uid, handleOnClick, canVote}) => {
 
    return (
        <div>
            <p> {answer} </p>
            <div>
                <button disabled = {!canVote} onClick={() => handleOnClick(uid)}>Vote</button>
                <p>Votes: {votes}</p>
            </div>
        </div>
    );
};


export default Answer;
