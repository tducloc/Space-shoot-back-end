class Game {
  constructor(room, hostID, data) {
    this.room = room || "";
    this.playerList = [];
    this.host = hostID || "";
    this.start = false;
    this.data = data;
    this.currentQuestionIndex = 0;
    this.answers = this.data.questions.map((ques) => {
      const id = ques.id;
      return { id, playerAnswers: [] };
    });
  }

  removePlayerByName(name) {
    const removePlayer = this.playerList.find((player) => player.name === name);
    this.playerList = this.playerList.filter((player) => player.name !== name);

    return removePlayer.id;
  }

  increaseQuestionIndex() {
    ++this.currentQuestionIndex;
  }

  getPlayer(playerId) {
    return this.playerList.find((player) => player.id === playerId);
  }

  getQuestion() {
    return {
      questionData: this.data.questions[this.currentQuestionIndex],
      questionIndex: this.currentQuestionIndex,
      questionLength: this.data.questions.length,
      quizName: this.getQuizName(),
    };
  }

  getAnswer() {
    return this.answers[this.currentQuestionIndex];
  }

  addPlayerToGame(player) {
    this.playerList.push(player);
  }

  getPlayersInGame() {
    return this.playerList;
  }

  removePlayer(id) {
    this.playerList = this.playerList.filter((player) => player.id !== id);
  }

  havePlayer(id) {
    return this.playerList.find((player) => player.id === id);
  }

  havePlayerName(name) {
    return this.playerList.find((player) => player.name === name);
  }

  getHost() {
    return this.host;
  }

  startGame() {
    this.start = true;
    return this.start;
  }

  getQuizName() {
    return this.data.name;
  }

  updatePlayerAnswer(playerId, questionId, answer, index) {
    const question = this.data.questions.find((ques) => {
      return ques.id === questionId;
    });
    console.log(questionId);
    if (question) {
      const questionAnswer = this.answers.find((ans) => ans.id === questionId);
      console.log("player:", answer);
      console.log("correct:", question.correctAnswer);
      //  Update number of player has answer the question
      this.answers.forEach((ans) => {
        if (ans.id === questionId)
          ans.playerAnswers.push({ player: playerId, answer, index });
      });

      // Check if player answer right
      if (question.correctAnswer === answer) {
        const index = questionAnswer.playerAnswers.length;
        const newScore = 1000 - (index - 1) * 20;

        //  Update player score
        this.playerList.forEach((player) => {
          if (player.id === playerId) {
            player.score += newScore;
          }
        });

        // Sort
        this.playerList.sort((a, b) => b.score - a.score);
      }
    }

    return this.getAnswer();
  }
}

export default Game;
