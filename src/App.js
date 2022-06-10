import { useEffect, useRef } from 'react';
import './App.css';

import io from 'socket.io-client';

const constraints = {
	audio: false,
	video: true,
};

const socket = io('/webRTCPeers', {
	path: '/webrtc',
});

function App() {
	const localRef = useRef();
	const remoteRef = useRef();
	const textRef = useRef();
	const candidates = useRef([]);
	const pc = useRef(new RTCPeerConnection(null));

	useEffect(() => {
		socket.on('connection-success', (success) => {
			console.log(success);
		});

		socket.on('sdp', (data) => {
			console.log('*SDP RECEIVED.');
			textRef.current.value = JSON.stringify(data.sdp);
		});

		socket.on('candidate', (candidate) => {
			candidates.current = [...candidates.current, candidate];
		});

		navigator.mediaDevices
			.getUserMedia(constraints)
			.then((stream) => {
				localRef.current.srcObject = stream;

				stream.getTracks().forEach((track) => {
					_pc.addTrack(track, stream);
				});
			})
			.catch((error) => console.log(error));

		const _pc = new RTCPeerConnection(null);
		_pc.onicecandidate = (e) => {
			if (e.candidate) {
				socket.emit('candidate', e.candidate);
			}
		};

		_pc.oniceconnectionstatechange = (e) => {
			// POSSIBLE VALUES [CONNECTED,DISCONNECTED]
			console.log(e);
		};

		_pc.ontrack = (e) => {
			// GOT REMOTE STREAM
			remoteRef.current.srcObject = e.streams[0];
		};

		pc.current = _pc;
	}, []);

	const createOffer = () => {
		console.log('OFFER CREATED.');
		pc.current
			.createOffer({
				offerToReceiveAudio: 1,
				offerToReceiveVideo: 1,
			})
			.then((sdp) => {
				pc.current.setLocalDescription(sdp);

				socket.emit('sdp', {
					sdp,
				});
			})
			.catch((error) => console.log(error));
	};

	const createAnswer = () => {
		console.log('ANSWER CREATED.');
		pc.current
			.createAnswer({
				offerToReceiveAudio: 1,
				offerToReceiveVideo: 1,
			})
			.then((sdp) => {
				pc.current.setLocalDescription(sdp);

				socket.emit('sdp', { sdp });
			})
			.catch((error) => console.log(error));
	};

	const setRemoteDescription = () => {
		// GET THE SDP VALUE
		console.log('Remote Description set.');
		const sdp = JSON.parse(textRef.current.value);

		pc.current.setRemoteDescription(new RTCSessionDescription(sdp));
	};

	const addCandidate = () => {
		// const candidate = JSON.parse(textRef.current.value);
		console.log('Adding candidate...');
		candidates.current.forEach((candidate) => {
			console.log(candidate);
			pc.current.addIceCandidate(new RTCIceCandidate(candidate));
		});
	};

	return (
		<div className='App'>
			<section
				style={{
					margin: '2rem',
				}}>
				<section style={{ display: 'flex', justifyContent: 'space-between' }}>
					<video ref={localRef} autoPlay />
					<video ref={remoteRef} autoPlay />
				</section>
				<section
					style={{
						margin: '2rem',
						display: 'flex',
						justifyContent: 'space-between',
					}}>
					<button onClick={createOffer}>Create Offer</button>
					<button onClick={createAnswer}>Create Answer</button>
					<button onClick={setRemoteDescription}>Set Remote Description</button>
					<button onClick={addCandidate}>Add candidate</button>
				</section>
				<section style={{ margin: '2rem' }}>
					<textarea ref={textRef}></textarea>
				</section>
			</section>
		</div>
	);
}

export default App;
