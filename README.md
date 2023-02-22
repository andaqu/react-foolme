### RULES

1. There are two teams: Humans and Impostors. There is also an AI player.
2. The Impostors know which players are in which team, but the Humans do not.
3. The Humans are trying to figure out who the AI is.
4. The Humans win if they can spot the AI player. The Impostors win if they can fool the Humans into thinking one of them is the AI player.

### GAMEPLAY

**Asking stage:** One human asks a question.

```
Human 1: Why is the sky blue?
Human 2:
Human 3:
Impostor 1:
Impostor 2:
AI:
```

**Answering stage:** Everyone, except Human 1, answers the question.

```
Human 1:
Human 2: Because the sky is blue.
Human 3: I don't know.
Impostor 1: I'm a human, don't vote for me!
Impostor 2: It's because of the atmosphere.
AI: The sky is blue because of the atmosphere.
```

**Voting stage:** Everyone gets one vote for who they think is the AI.

```
*Humans vote*

Human 1: [Can't be voted for since they asked the question.]
Human 2: +1
Human 3: +0
Impostor 1: +0
Impostor 2: +2
AI: +0
```

In this case, the Humans voted Impostor 2 because they think he is the AI. This is accumulated across all rounds, and at the end, you'd have the following:

```
Human 1: +1
Human 2: +2
Human 3: +0
Impostor 1: +1
Impostor 2: +3
AI: +2
```

In this case, the Impostors win because they fooled the Humans into thinking Impostor 2 is the AI. The Humans lose because they didn't figure out who the AI was.

### Q&A

How can the Humans distinguish between the AI and the Impostors?
> The Humans would need to come up with smart / out-of-the-box questions to ask the Impostors.

How can the Impostors fool the Humans?
> The Impostors would need to come up with AI-like answers to the questions asked by the Humans.
