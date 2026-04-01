"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toHouseRoomResponse = toHouseRoomResponse;
exports.toHouseRoomResponseList = toHouseRoomResponseList;
const formatDate = (d) => new Date(d).toISOString().replace('T', ' ').slice(0, 19);
function toHouseRoomResponse(r) {
    return {
        id: r.id,
        name: r.name ?? '',
        houseId: r.house.id,
        houseName: r.house.name,
        createdAt: formatDate(r.createdAt),
    };
}
function toHouseRoomResponseList(list) {
    return list.map(toHouseRoomResponse);
}
