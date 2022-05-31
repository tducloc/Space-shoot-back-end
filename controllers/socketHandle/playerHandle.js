import gameManager from "../../utils/class/GameManager.js";

const playerHandle = (io, socket) => {
  const joinRoom = async (payload) => {
    const room = payload.room;

    console.log(gameManager.gameList);

    const game = gameManager.getGame(room);
    if (game) {
      const player = {
        id: socket.id,
        room,
        name: payload.name,
        score: 0,
      };
      game.addPlayerToGame(player);

      socket.join(room);

      // Save player data into socket to handle disconnect
      socket.player = { ...player, host: game.getHost() };

      // Send res if player join success or not
      io.to(socket.id).emit("joinRoomRes", {
        result: true,
        msg: "Joined successfully",
        player,
      });

      sendAllPlayersInfoInRoom(room);
    } else {
      io.to(socket.id).emit("joinRoomRes", {
        result: false,
        msg: "Joined failed",
      });
    }
  };

  const sendAllPlayersInfoInRoom = (room) => {
    const game = gameManager.getGame(room);
    if (game) {
      const playersInRoom = game.getPlayersInGame();
      io.to(game.host).emit("receive__players", playersInRoom);
    }
  };

  socket.on("joinRoom", joinRoom);
};
export default playerHandle;
