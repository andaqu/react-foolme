import { useEffect, useState, useRef } from 'react';
import axios from "axios";

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  organization: process.env.REACT_APP_OPENAI_ORGANIZATION,
  apiKey: process.env.REACT_APP_OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

export function useFirestoreQuery(query) {
  const [docs, setDocs] = useState([]);

  // Store current query in ref
  const queryRef = useRef(query);

  // Compare current query with the previous one
  useEffect(() => {
    // Use Firestore built-in 'isEqual' method
    // to compare queries
    if (!queryRef?.curent?.isEqual(query)) {
      queryRef.current = query;
    }
  });

  // Re-run data listener only if query has changed
  useEffect(() => {
    if (!queryRef.current) {
      return null;
    }

    // Subscribe to query with onSnapshot
    const unsubscribe = queryRef.current.onSnapshot(querySnapshot => {

      // Get all documents from collection - with IDs
      const data = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }));
      // Update state
      setDocs(data);
    });

    // Detach listener
    return unsubscribe;
  }, [queryRef]);

  return docs;
}

export function useAuthState(auth) {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(() => auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setUser(user);
      } else {
        setUser(false);
      }
      if (initializing) {
        setInitializing(false);
      }
    });

    // Cleanup subscription
    return unsubscribe;
  }, [auth, initializing]);

  return { user, initializing };
}

export async function isAppropriate(input){
  // send a request using axios
  
  var response = "";

  console.log(`Sending prompt to OpenAI...`);

  try {
    response = await openai.createModeration({
      input: input
    });
  } catch (error) {
    console.log(error);
    console.log("There was an error... trying again...")
  }

  console.log(`Response from OpenAI: ${JSON.stringify(response.data)}`);

  return !response.data.results[0].flagged;

}

export async function generateAIAnswer(question, previousAnswers) {

  return "This is a placeholder answer."
  
  // previousAnswers is a dictionary of {question: answer}. Build a string of previous answers in this format: "Q: What is your name? A: My name is John. Q: What is your favorite color? A: My favorite color is blue."
  var previousAnswersString = "";
  for (var key in previousAnswers) {
    previousAnswersString += `[Q: ${key} A: ${previousAnswers[key]}.] `;
  }

  var prompt = ""

  if (previousAnswersString == "") {
    prompt = `You are trying to fool others thinking you are a human. Write a very short answer (in 5 words) using lowercase, casual English to answer the next question: ${question}`;
  } else {
    prompt = `You are trying to fool others thinking you are a human. These were your previous answers: ${previousAnswersString}. Write a very short answer (in 5 words) using lowercase, casual English to answer the next question. Q: ${question} A:`;
  }

 
  var response = "";

  console.log(`Sending prompt to OpenAI...`);

  while (response == "") {
    try {
      response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        n: 1,
        max_tokens: 20,
        temperature: 1
      });
    } catch (error) {
      console.log(error);
      console.log("There was an error... trying again...")
    }
  }

  var answer = response.data.choices[0].text;

  // Remove newlines from the answer
  answer = answer.replace(/(\r\n|\n|\r)/gm, "");

  // If the answer starts or ends with quotes (" or '), remove them
  if (answer.startsWith('"') || answer.startsWith("'")) {
    answer = answer.substring(1);
  }

  if (answer.endsWith('"') || answer.endsWith("'")) {
    answer = answer.substring(0, answer.length - 1);
  }
  
  return answer;

}





