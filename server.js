const express = require('express');

const io = require('socket.io')({ path: '/webrtc' });

const app = express();
const PORT = 8080;

app.get('/',(req,res)=>res.send('Healthy');

const server = app.listen(PORT, () =>
	console.log(`WebRTC signal server running on ${PORT}`)
);

io.listen(server);

const webRTCNamespace = io.of('/webRTCPeers');

webRTCNamespace.on('connection', (socket) => {
	console.log(`${socket.id} connected.`);

	socket.emit('connection-success', {
		status: 'connection-success',
		socketId: socket.id,
	});

	socket.on('disconnect', () => {
		console.log(`${socket.id} disconnected.`);
	});

	socket.on('sdp', (data) => {
		socket.broadcast.emit('sdp', data);
	});

	socket.on('candidate', (data) => {
		socket.broadcast.emit('candidate', data);
	});
});
