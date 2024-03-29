import Game from "../../utils/class/Game.js";
import gameManager from "../../utils/class/GameManager.js";
import quizModel from "../../models/server.model.js";

const hostHandle = (io, socket) => {
  const fetchQuizList = async (userId) => {
    console.log(userId);
    if (socket.host) {
      gameManager.removeGame(socket.host.room);
    }

    const list = await quizModel.getUserQuizFromDB(userId);
    io.to(socket.id).emit("fetchQuizListRes", list);
  };

  const getQuiz = async (quizId) => {
    console.log(quizId);
    const quiz = await quizModel.getGameFromDB(quizId);

    if (quiz)
      io.to(socket.id).emit("getQuizResult", { msg: "success", data: quiz });
    else {
      io.to(socket.id).emit("getQuizResult", { msg: "error", data: quiz });
    }
  };

  const updateQuiz = async (quizId, quizData) => {
    const result = await quizModel.updateQuiz(quizId, quizData);

    if (result)
      io.to(socket.id).emit("updateQuizResult", { message: "success" });
    else {
      io.to(socket.id).emit("updateQuizResult", { message: "error" });
    }
  };

  const createGame = async (data) => {
    console.log(data);
    const index = data.questions.findIndex((item) => item.imgPath);

    data.imgPath =
      index !== -1
        ? data.questions[index].imgPath
        : `${process.env.BACK_END_URL}/images/noImage.jpg`;
    const result = await quizModel.addQuizToDB(data);

    if (result)
      io.to(socket.id).emit("createGameResult", { message: "success" });
    else io.to(socket.id).emit("createGameResult", { message: "error" });
  };

  const deleteQuiz = async (quizId) => {
    const result = await quizModel.removeQuizFromDB(quizId);

    if (result)
      io.to(socket.id).emit("deleteQuizResult", { message: "success" });
    else io.to(socket.id).emit("deleteQuizResult", { message: "error" });
  };

  // Host game
  const hostGame = async (id) => {
    // Load data from database
    const data = await quizModel.getGameFromDB(id);

    if (data) {
      const room = gameManager.getNextAvailableId();
      const newGame = new Game(room, socket.id, data);

      socket.join(room);
      socket.host = { id: socket.id, room };
      gameManager.addGame(newGame);

      io.to(socket.id).emit("hostGameRes", {
        result: true,
        msg: "Host successfully",
        game: newGame,
      });
    } else {
      io.to(socket.id).emit("hostGameRes", {
        result: false,
        msg: "Host failed",
      });
    }
  };

  const sendAllPlayersInfoInRoom = () => {
    const game = gameManager.getGameWithHost(socket.id);
    if (game) {
      const playersInRoom = game.getPlayersInGame();
      io.to(socket.id).emit("receive__players", playersInRoom);
    }
  };

  // Start game
  const startGame = () => {
    const game = gameManager.getGameWithHost(socket.id);
    if (game) {
      io.to(socket.host.room).emit("hostStartingGame");
      return;
    }
    io.to(socket.id).emit("startGameRes", { result: false });
  };

  // Get question
  const getQuestion = (startTime) => {
    const game = gameManager.getGameWithHost(socket.id);

    if (game) {
      const questionData = game.getQuestion();
      if (questionData) {
        io.to(socket.id).emit("getQuestionRes", { questionData, result: true });

        setTimeout(() => {
          io.to(socket.host.room).emit("hostGetQuestionRes", {
            questionData,
            result: true,
          });
        }, startTime * 1000);
      } else {
        // Notify all player and the host if get question failed
        if (socket?.host?.room)
          io.to(socket.host.room).emit("hostGetQuestionRes", { result: false });
        io.to(socket.id).emit("getQuestionRes", { result: false });
      }
      return;
    }
    // Notify all player and the host if get question failed
    // io.to(room).emit("getQuestionRes", { result: false });
    io.to(socket.id).emit("getQuestionRes", { result: false });
    io.to(socket.host.room).emit("hostGetQuestionRes", {
      result: false,
    });
  };

  const stopQuestion = () => {
    const game = gameManager.getGameWithHost(socket.id);
    if (game) {
      io.to(socket.host.room).emit("questionTimeOut");
    }
  };

  const nextQuestion = () => {
    const game = gameManager.getGameWithHost(socket.id);

    if (game) {
      game.increaseQuestionIndex();

      if (game.currentQuestionIndex >= game.data.questions.length) {
        io.to(socket.host.room).emit("nextQuestionRes", { result: false });
        return;
      }
      io.to(socket.host.room).emit("nextQuestionRes", { result: true });
    }
  };

  const getRankList = () => {
    const game = gameManager.getGameWithHost(socket.id);

    if (game) {
      const rankList = game.getPlayersInGame().slice(0, 10);

      io.to(socket.host.room).emit("getRankListRes", {
        result: true,
        rankList,
      });
      return;
    }
    io.to(socket.host.room).emit("getRankListRes", { result: false });
    io.to(socket.id).emit("getRankListRes", { result: false });
  };

  const getSummaryRankList = (loadingTime) => {
    const game = gameManager.getGameWithHost(socket.id);

    if (game) {
      const rankList = game.getPlayersInGame();
      const gameName = game.getQuizName();
      io.to(socket.id).emit("getSummaryRankListRes", {
        rankList,
        gameName,
      });

      setTimeout(() => {
        io.to(socket.host.room).emit("playerRank", { rankList, gameName });
      }, loadingTime * 1000);
    }
  };

  const hostDisconnect = () => {
    const game = gameManager.getGameWithHost(socket.id);
    if (game) {
      gameManager.removeGame(game.room);
      io.to(socket.host.room).emit("hostDisconnect");
      // console.log(`Host of room ${room} has disconnected`);
    }
  };

  const removePlayer = (playerName) => {
    const game = gameManager.getGameWithHost(socket.id);
    if (game) {
      const removePlayerId = game.removePlayerByName(playerName);
      const playersInRoom = game.getPlayersInGame();
      io.to(socket.id).emit("receive__players", playersInRoom);
      io.to(removePlayerId).emit("playerRemoveOutOfRoom");
    }
  };

  socket.on("hostGame", hostGame);
  socket.on("createGame", createGame);
  socket.on("deleteQuiz", deleteQuiz);
  socket.on("fetchQuizList", fetchQuizList);
  socket.on("fetchPlayersInRoom", sendAllPlayersInfoInRoom);
  socket.on("startGame", startGame);
  socket.on("getQuestion", getQuestion);
  socket.on("stopQuestion", stopQuestion);
  socket.on("nextQuestion", nextQuestion);
  socket.on("getRankList", getRankList);
  socket.on("getSummaryRankList", getSummaryRankList);
  socket.on("disconnect", hostDisconnect);
  socket.on("getQuiz", getQuiz);
  socket.on("updateQuiz", updateQuiz);
  socket.on("removePlayer", removePlayer);
};

export default hostHandle;
