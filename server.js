const express = require('express');

const io = require('socket.io')({ path: '/webrtc' });

const app = express();
const PORT = 8080;

const server = app.listen(PORT, () =>
	console.log(`WebRTC signal server running on ${PORT}`)
);

io.listen(server);

const webRTCNamespace = io.of('/webRTCPeers');

webRTCNamespace.on('connection', (socket) => {
	console.log(`${socket.id} connected.`);

	socket.on('disconnect', () => {
		console.log(`${socket.id} disconnected.`);
	});
});
