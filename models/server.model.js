import { quizModel } from "../utils/db.js";

export default {
  getGameFromDB: async (id) => {
    const result = await quizModel.findById(id);
    return result;
  },

  getAllQuizFromDB: async () => {
    const result = await quizModel.find({});
    return result;
  },

  getUserQuizFromDB: async (id) => {
    console.log(id);
    const result = await quizModel.find({ userId: id });
    return result;
  },

  addQuizToDB: async (data) => {
    return await quizModel.create(data);
  },
};
