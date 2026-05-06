export const activeRooms = {};

// Getter function used by the API controller (e.g., joinRoom)
export const getActiveRoomCount = (roomId) => {
  if (!activeRooms[roomId]) return 0;
  return Object.keys(activeRooms[roomId].participants || {}).length;
};
