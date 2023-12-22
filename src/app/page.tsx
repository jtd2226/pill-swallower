'use client';

import { useEffect } from 'react';

function onload() {
  const controls = document.querySelector('.controls');
  const cameraOptions = document.querySelector('.video-options>select') as HTMLSelectElement;
  const video = document.querySelector('video') as HTMLVideoElement;
  const canvas = document.querySelector('canvas') as HTMLCanvasElement;
  const screenshotImage = document.querySelector('img') as HTMLImageElement;
  const buttons = Array.from(controls!.querySelectorAll('button'));
  let streamStarted = false;

  const [play, pause, screenshot] = buttons;

  const constraints = {
    video: {
      width: {
        min: 1280,
        ideal: 1920,
        max: 2560
      },
      height: {
        min: 720,
        ideal: 1080,
        max: 1440
      }
    }
  };

  cameraOptions.onchange = () => {
    const updatedConstraints = {
      ...constraints,
      deviceId: {
        exact: cameraOptions.value
      }
    };

    startStream(updatedConstraints);
  };

  play.onclick = () => {
    if (streamStarted) {
      video.play();
      play.classList.add('d-none');
      pause.classList.remove('d-none');
      return;
    }
    const updatedConstraints = {
      ...constraints,
      deviceId: {
        exact: cameraOptions.value
      }
    };
    startStream(updatedConstraints);
  };

  const pauseStream = () => {
    video.pause();
    play.classList.remove('d-none');
    pause.classList.add('d-none');
  };

  const doScreenshot = () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    screenshotImage.src = canvas.toDataURL('image/webp');
    screenshotImage.classList.remove('d-none');
  };

  pause.onclick = pauseStream;
  screenshot.onclick = doScreenshot;

  const startStream = async (constraints: any) => {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleStream(stream);
  };

  const handleStream = (stream: MediaStream) => {
    video.srcObject = stream;
    play.classList.add('d-none');
    pause.classList.remove('d-none');
    screenshot.classList.remove('d-none');
  };

  const getCameraSelection = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    const options = videoDevices.map(videoDevice => {
      return `<option value="${videoDevice.deviceId}">${videoDevice.label}</option>`;
    });
    cameraOptions.innerHTML = options.join('');
  };

  getCameraSelection();
}

export default function Home() {
  useEffect(() => {
    onload();
  }, []);
  return (
    <main>
      <div className="display-cover">
        <video autoPlay></video>
        <canvas className="d-none"></canvas>

        <div className="video-options">
          <select name="" id="" className="custom-select">
            <option value="">Select camera</option>
          </select>
        </div>

        <img className="screenshot-image d-none" alt="" />

        <div className="controls">
          <button className="btn btn-danger play" title="Play">
            <i data-feather="play-circle"></i>
          </button>
          <button className="btn btn-info pause d-none" title="Pause">
            <i data-feather="pause"></i>
          </button>
          <button className="btn btn-outline-success screenshot d-none" title="ScreenShot">
            <i data-feather="image"></i>
          </button>
        </div>
      </div>
    </main>
  );
}
