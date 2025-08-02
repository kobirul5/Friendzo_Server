import { Server } from "http";
import WebSocket, { WebSocketServer } from "ws";
import prisma from "../shared/prisma";
import { jwtHelpers } from "./jwtHelpers";

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
}

const onlineUsers = new Set<string>();
const userSockets = new Map<string, ExtendedWebSocket>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });
  console.log("✅ WebSocket server running");

  wss.on("connection", (ws: ExtendedWebSocket) => {
    ws.on("message", async (data) => {
      try {
        const parsed = JSON.parse(data.toString());

        switch (parsed.event) {
          case "authenticate": {
            const token = parsed.token;
            const user = jwtHelpers.verifyToken(token, process.env.JWT_SECRET as string);
            if (!user || !user.id) {
              console.log("Authentication failed, closing ws"); // <-- Added log for auth fail
              return ws.close(); // <-- unchanged
            }

            ws.userId = user.id;
            onlineUsers.add(ws.userId as string);
            userSockets.set(ws.userId as string, ws);

            console.log("User authenticated:", ws.userId); // <-- Added log for success auth

            ws.send(JSON.stringify({ event: "authenticated", userId: ws.userId })); // <-- Added: notify client auth success

            broadcast(wss, {
              event: "userStatus",
              data: { userId: ws.userId, isOnline: true },
            });
            break;
          }

          case "message": {
            const { receiverId, message, images } = parsed;
            if (!ws.userId || !receiverId || !message) return;

            let room = await prisma.room.findFirst({
              where: {
                OR: [
                  { senderId: ws.userId, receiverId },
                  { senderId: receiverId, receiverId: ws.userId },
                ],
              },
            });

            if (!room) {
              room = await prisma.room.create({
                data: { senderId: ws.userId, receiverId },
              });
            }

            const chat = await prisma.chat.create({
              data: {
                senderId: ws.userId,
                receiverId,
                roomId: room.id,
                message,
                images: { set: images || [] },
              },
            });

            const recvSocket = userSockets.get(receiverId);
            if (recvSocket) {
              recvSocket.send(JSON.stringify({ event: "message", data: chat }));
            }

            ws.send(JSON.stringify({ event: "message", data: chat }));
            break;
          }

          case "fetchChats": {
            const { receiverId } = parsed;
            if (!ws.userId || !receiverId) return;

            const room = await prisma.room.findFirst({
              where: {
                OR: [
                  { senderId: ws.userId, receiverId },
                  { senderId: receiverId, receiverId: ws.userId },
                ],
              },
            });

            if (!room) {
              return ws.send(JSON.stringify({ event: "noRoomFound" }));
            }

            const chats = await prisma.chat.findMany({
              where: { roomId: room.id },
              orderBy: { createdAt: "asc" },
            });

            await prisma.chat.updateMany({
              where: { roomId: room.id, receiverId: ws.userId, isRead: false },
              data: { isRead: true },
            });

            ws.send(JSON.stringify({ event: "fetchChats", data: chats }));
            break;
          }

          case "messageList": {
            console.log("messageList requested by user:", ws.userId); // <-- Added log to track messageList requests

            if (!ws.userId) {
              ws.send(JSON.stringify({ event: "error", message: "Not authenticated" }));
              return;
            }

            try {
              // Fetch all rooms where the user is involved
              const rooms = await prisma.room.findMany({
                where: {
                  OR: [{ senderId: ws.userId }, { receiverId: ws.userId }],
                },
                include: {
                  chats: {
                    orderBy: {
                      createdAt: "desc",
                    },
                    take: 1, // Only latest message per room
                  },
                },
              });

              // Get the other user's IDs from rooms
              const userIds = rooms.map((room) =>
                room.senderId === ws.userId ? room.receiverId : room.senderId
              );

              // Fetch user profiles
              const userInfos = await prisma.user.findMany({
                where: {
                  id: {
                    in: userIds,
                  },
                },
                select: {
                  profileImage: true,
                  firstName: true,
                  lastName: true,
                  id: true,
                },
              });

              // Merge user info with last message per room
              const userWithLastMessages = rooms.map((room) => {
                const otherUserId =
                  room.senderId === ws.userId ? room.receiverId : room.senderId;
                const userInfo: any = userInfos.find(
                  (userInfo) => userInfo.id === otherUserId
                );

                // Safely handle profileImage if undefined
                userInfo.profileImage = userInfo?.profileImage || null;

                return {
                  user: userInfo || null,
                  lastMessage: room.chats[0] || null,
                };
              });

              console.log("Sending messageList data for user:", ws.userId); // <-- Added log before sending response

              ws.send(
                JSON.stringify({
                  event: "messageList",
                  data: userWithLastMessages,
                })
              );
            } catch (error) {
              console.error("Error fetching user list with last messages:", error);
              ws.send(
                JSON.stringify({
                  event: "error",
                  message: "Failed to fetch users with last messages",
                })
              );
            }
            break;
          }

          case "unReadMessages": {
            const { receiverId } = parsed;
            if (!ws.userId || !receiverId) return;

            const room = await prisma.room.findFirst({
              where: {
                OR: [
                  { senderId: ws.userId, receiverId },
                  { senderId: receiverId, receiverId: ws.userId },
                ],
              },
            });

            if (!room) {
              return ws.send(
                JSON.stringify({
                  event: "noUnreadMessages",
                  data: [],
                })
              );
            }

            const unRead = await prisma.chat.findMany({
              where: {
                roomId: room.id,
                isRead: false,
                receiverId: ws.userId,
              },
            });

            ws.send(
              JSON.stringify({
                event: "unReadMessages",
                data: {
                  messages: unRead,
                  count: unRead.length,
                },
              })
            );
            break;
          }

          default:
            console.log("⚠️ Unknown event:", parsed.event);
        }
      } catch (err) {
        console.error("❌ WebSocket error:", err);
      }
    });

    ws.on("close", () => {
      if (ws.userId) {
        onlineUsers.delete(ws.userId);
        userSockets.delete(ws.userId);

        broadcast(wss, {
          event: "userStatus",
          data: { userId: ws.userId, isOnline: false },
        });
      }
    });
  });
}

function broadcast(wss: WebSocketServer, message: object) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}
