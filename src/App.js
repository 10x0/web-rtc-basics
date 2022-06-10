import { useEffect, useRef, useState } from 'react';
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
	const [call, setCall] = useState(true);
	const [answer, setAnswer] = useState(false);
	const [status, setStatus] = useState('Make a call.');
	const pc = useRef(new RTCPeerConnection(null));

	useEffect(() => {
		socket.on('connection-success', (success) => {
			console.log(success);
		});

		socket.on('sdp', (data) => {
			pc.current.setRemoteDescription(new RTCSessionDescription(data.sdp));

			if (data.sdp.type === 'offer') {
				setCall(false);
				setAnswer(true);
				setStatus('Incoming call...');
			} else {
				setStatus('Ongoing call.');
			}
		});

		socket.on('candidate', (candidate) => {
			pc.current.addIceCandidate(new RTCIceCandidate(candidate));
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

	const sendToPeer = (eventType, payload) => {
		socket.emit(eventType, payload);
	};

	const processSDP = (sdp) => {
		pc.current.setLocalDescription(sdp);

		sendToPeer('sdp', { sdp });
	};

	const createOffer = () => {
		pc.current
			.createOffer({
				offerToReceiveAudio: 1,
				offerToReceiveVideo: 1,
			})
			.then((sdp) => {
				processSDP(sdp);
				setCall(false);
				setStatus('Calling.....');
			})
			.catch((error) => console.log(error));
	};

	const createAnswer = () => {
		pc.current
			.createAnswer({
				offerToReceiveAudio: 1,
				offerToReceiveVideo: 1,
			})
			.then((sdp) => {
				processSDP(sdp);
				setAnswer(false);
				setStatus('Ongoing Call.');
			})
			.catch((error) => console.log(error));
	};

	return (
		<div className='App'>
			<section
				style={{
					margin: '2rem',
				}}>
				<section
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						flexWrap: 'wrap',
					}}>
					<video ref={localRef} autoPlay />
					<video ref={remoteRef} autoPlay />
				</section>
				<section
					style={{
						margin: '2rem',
						display: 'flex',
						justifyContent: 'space-between',
					}}>
					{call && <button onClick={createOffer}>Call now</button>}
					{answer && <button onClick={createAnswer}>Answer</button>}
				</section>
				<section>{status}</section>
			</section>
		</div>
	);
}

export default App;
