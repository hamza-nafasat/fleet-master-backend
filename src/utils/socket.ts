import { io } from "../app.js";
import { liveSockets } from "../constants/socketState.js";

const getSocketId = (userId: string) => {
    return liveSockets.get(userId);
};

const emitEvent = async (event: string, user: string, data: any) => {
    const socketUser = await getSocketId(user);
    io.to(socketUser).emit(event, data);
};

const emitNotification = async (event: string, user: string, data: any) => {
    const socketUser = await getSocketId(user);
    io.to(socketUser).emit(event, data);
};

export { emitEvent, getSocketId, emitNotification };
