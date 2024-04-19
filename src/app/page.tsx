/* eslint-disable @next/next/no-img-element */
'use client';
import { useEffect, useRef, useState } from 'react';
import Fast from '@/imageprocessing/fast';
import Brief from '@/imageprocessing/brief';
import ImageProcessor from '@/imageprocessing/image';
import MathUtil from '@/imageprocessing/math';
import { ColorTracker } from '@/imageprocessing/colors';

function drawImage({ canvas, image }: { canvas: HTMLCanvasElement; image: HTMLImageElement }) {
  const context = canvas.getContext('2d')!;
  const { width, height } = image.getBoundingClientRect();
  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  return { context, pixels, width, height };
}

type onTrack = (data: Uint8ClampedArray) => unknown;

const VideoTask = ({ video, onTrack }: { video: HTMLVideoElement; onTrack: onTrack }) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  const { width, height } = video.getBoundingClientRect();

  function handleResize() {
    const { width, height } = video.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
  }
  handleResize();
  video.addEventListener('resize', handleResize);

  const task = {
    id: 0,
    run() {
      task.id = requestAnimationFrame(function observe() {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          context.drawImage(video, 0, 0, width, height);
        }
        const imageData = context.getImageData(0, 0, width, height);
        onTrack(imageData.data);
        task.run();
      });
    },
    stop() {
      cancelAnimationFrame(task.id);
    }
  };
  return task;
};

export default function Colors() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const taskRef = useRef<{ start: () => unknown; stop: () => unknown }>();

  const [stream, setStream] = useState<MediaStream>();
  const [loading] = useState(true);
  const accessCamera = () => {
    if (stream) return;
    /* Stream it to video element */
    window.navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          facingMode: 'environment'
        }
      })
      .then(function success(stream) {
        setStream(stream);
      });
  };

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video) return;
    if (!canvas) return;
    if (!stream) return;
    videoRef.current.srcObject = stream;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    const task = {
      id: 0,
      start() {
        task.id = requestAnimationFrame(function observe() {
          const width = video.videoWidth;
          const height = video.videoWidth;
          canvas.width = width;
          canvas.height = height;
          context.drawImage(video, 0, 0, width, height);
          if (!width) return task.start();

          const frame = context.getImageData(0, 0, width, height);
          ImageProcessor.sobel(frame.data, width, height);
          context.putImageData(frame, 0, 0);
          task.start();
        });
      },
      stop() {
        cancelAnimationFrame(task.id);
      }
    };
    task.start();
    taskRef.current = task;
  }, [stream, videoRef]);

  const getImageData = () => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!image) return;
    if (!canvas) return;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    const { width, height } = image.getBoundingClientRect();
    canvas.width = width;
    canvas.height = width;
    context.drawImage(image, 0, 0, width, height);
    const frame = context.getImageData(0, 0, width, height);
    ImageProcessor.sobel(frame.data, width, height);
    context.putImageData(frame, 0, 0);
  };

  const countPillsInImage = () => {
    let test = false;
    getImageData();
    if (test) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const countElement = document.getElementById('count')!;
    const tracker = new ColorTracker();

    tracker.track({
      canvas,
      handler(rects) {
        countElement.innerText = `Pills: ${rects.length}`;
      }
    });
  };

  return (
    <>
      {loading ? (
        <img
          ref={imageRef}
          src="/pills.png"
          alt=""
          onClick={() => {
            countPillsInImage();
          }}
        />
      ) : null}
      <strong id="count" style={{ visibility: stream ? undefined : 'hidden' }}>
        Pills: 0
      </strong>
      <span
        role="button"
        style={{
          display: 'flex',
          alignContent: 'center',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          justifyItems: 'center',
          width: 'min(100vw, 500px)',
          height: 'min(50vh, 500px)'
        }}
        onClick={() => {
          accessCamera();
        }}
      >
        <video ref={videoRef} playsInline autoPlay muted></video>
        {loading || stream ? (
          <>
            <canvas
              id="canvas"
              ref={canvasRef}
              onClick={() => {
                if (videoRef.current?.paused) {
                  videoRef.current.play();
                  taskRef.current?.start();
                } else {
                  videoRef.current?.pause();
                  taskRef.current?.stop();
                  countPillsInImage();
                  // TODO: focus;
                }
              }}
              onDoubleClick={() => {
                if (videoRef.current?.paused) {
                  videoRef.current.play();
                  taskRef.current?.start();
                } else {
                  videoRef.current?.pause();
                  taskRef.current?.stop();
                  countPillsInImage();
                }
              }}
            />
          </>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 95.554 95.617">
            <path
              d="M3.927 31.1C6.486 31.1 7.853 29.67 7.853 27.11V15.546C7.853 10.514 10.566 7.906 15.443 7.906H27.265C29.825 7.905 31.244 6.485 31.244 3.977 31.244 1.42 29.824 0 27.265 0H15.318C5.138 0 0 5.086 0 15.163V27.11C0 29.67 1.42 31.1 3.927 31.1ZM91.628 31.1C94.198 31.1 95.554 29.67 95.554 27.11V15.163C95.554 5.107 90.48 0 80.236 0H68.3C65.73 0 64.31 1.42 64.31 3.978 64.31 6.486 65.73 7.905 68.3 7.905H80.112C84.946 7.905 87.712 10.515 87.712 15.546V27.11C87.711 29.67 89.12 31.1 91.627 31.1ZM15.318 95.616H27.265C29.825 95.617 31.244 94.197 31.244 91.69 31.244 89.13 29.824 87.71 27.265 87.71H15.443C10.566 87.711 7.853 85.102 7.853 80.071V68.558C7.853 65.948 6.434 64.518 3.927 64.518 1.367 64.517 0 65.947 0 68.557V80.454C0 90.531 5.138 95.617 15.318 95.617ZM68.3 95.617H80.236C90.48 95.617 95.554 90.51 95.554 80.454V68.558C95.554 65.948 94.145 64.518 91.628 64.518 89.07 64.517 87.711 65.947 87.711 68.557V80.071C87.711 85.102 84.946 87.71 80.111 87.71H68.3C65.73 87.711 64.31 89.131 64.31 91.69 64.31 94.197 65.73 95.617 68.3 95.617Z"
              fill="#007AFF"
              fillOpacity="0.5"
            ></path>
            <path
              d="M25.977 69.884H69.567C74.684 69.884 77.351 67.32 77.351 62.244V36.449C77.351 31.32 74.684 28.757 69.567 28.757H63.228C61.317 28.757 60.725 28.394 59.592 27.137L57.65 24.955C56.372 23.615 55.148 22.879 52.614 22.879H42.741C40.28 22.879 38.973 23.604 37.757 24.955L35.773 27.137C34.609 28.332 34.049 28.757 32.127 28.757H25.977C20.808 28.757 18.203 31.32 18.203 36.447V62.246C18.203 67.32 20.808 69.885 25.977 69.885ZM47.86 63.708C39.698 63.708 33.156 57.228 33.156 49.055 33.156 40.945 39.698 34.455 47.86 34.455 55.96 34.455 62.45 40.945 62.45 49.055 62.45 57.383 55.96 63.708 47.86 63.708ZM47.808 59.54C53.534 59.54 58.22 54.916 58.22 49.055 58.22 43.32 53.534 38.675 47.808 38.675 42.01 38.674 37.334 43.318 37.334 49.054 37.334 54.916 42.01 59.54 47.808 59.54ZM67.32 42.056C65.494 42.056 64.01 40.635 64.01 38.746A3.31 3.31 0 0 1 67.32 35.447C69.094 35.447 70.598 36.931 70.61 38.747A3.28 3.28 0 0 1 67.32 42.056Z"
              fill="#007AFF"
            ></path>
          </svg>
        )}
      </span>
    </>
  );
}
