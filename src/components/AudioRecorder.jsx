import React, { useState, useRef } from "react";
import { BlobServiceClient } from "@azure/storage-blob";
import RecordingsList from "./RecordingsList";

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // Track if recording is paused
  const [recordings, setRecordings] = useState([]);
  const mediaRecorderRef = useRef(null);
  const blockListRef = useRef([]); // Store block IDs
  const blockBlobClientRef = useRef(null); // Reference to the Azure BlockBlobClient

  // Helper to determine supported MIME type
  const getMediaRecorderConfig = (stream) => {
    const mimeTypes = [
      { type: "audio/webm; codecs=opus", extension: "webm" },
      { type: "audio/mp4; codecs=mp4a.40.2", extension: "mp4" },
    ];

    for (const { type, extension } of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log(`Using MIME type: ${type}`);
        return {
          mediaRecorder: new MediaRecorder(stream, { mimeType: type }),
          extension,
        };
      }
    }

    throw new Error("No supported MIME types found for MediaRecorder.");
  };

  // Helper function to retry operations with retries and delays
  const retry = async (operation, retries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation(); // Attempt the operation
      } catch (error) {
        if (attempt < retries) {
          console.warn(
            `Retry ${attempt}/${retries} failed. Retrying in ${delay}ms...`,
            error
          );
          await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
        } else {
          console.error(`All retries failed after ${retries} attempts.`, error);
          throw error; // Throw error after final retry
        }
      }
    }
  };

  const startRecording = async () => {
    try {
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone access granted. Initializing MediaRecorder...");

      // Get MediaRecorder instance and file extension based on supported MIME type
      const { mediaRecorder, extension } = getMediaRecorderConfig(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Debug env variable
      const azureBlobUrl = import.meta.env.VITE_AZURE_BLOB_SAS_URL;
      if (!azureBlobUrl) {
        console.error("Azure Blob Storage SAS URL is not defined.");
      }

      // Debug all env variables
      console.log("Environment Variables:", import.meta.env);

      // Initialize Azure Blob Storage client
      const blobServiceClient = new BlobServiceClient(
        import.meta.env.VITE_AZURE_BLOB_SAS_URL
      );
      const containerClient =
        blobServiceClient.getContainerClient("audio-recordings");
      const blobName = `recording-${Date.now()}.${extension}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      blockBlobClientRef.current = blockBlobClient;

      // Reset block list for a new recording
      blockListRef.current = [];

      console.log(`Blob name: ${blobName}`);
      console.log("Starting recording...");

      // Event handlers for MediaRecorder
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const chunk = event.data;
          const blockId = btoa(`block-${Date.now()}`);
          blockListRef.current.push(blockId);

          console.log(`Chunk created. Size: ${chunk.size} bytes`);
          console.log(`Uploading block with ID: ${blockId}`);

          try {
            // Retry logic for chunk upload
            await retry(() =>
              blockBlobClient.stageBlock(blockId, chunk, chunk.size)
            );
            console.log(`Block ${blockId} uploaded successfully`);
          } catch (error) {
            console.error(`Failed to upload block ${blockId}:`, error);
          }
        } else {
          console.warn("Skipped zero-byte chunk");
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("Recording stopped. Committing block list...");
        try {
          // Ensure proper blob initialization
          if (blockListRef.current.length === 0) {
            console.warn("No blocks to commit. Recording might be empty.");
            return;
          }

          // Retry logic for committing the block list
          await retry(() =>
            blockBlobClientRef.current.commitBlockList(blockListRef.current)
          );
          console.log("All blocks committed successfully!");

          // Save recording URL
          setRecordings((prev) => [
            ...prev,
            { name: blobName, url: blockBlobClientRef.current.url },
          ]);
        } catch (error) {
          console.error("Failed to commit block list:", error);
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Capture data every 1 second
      setIsRecording(true);
      setIsPaused(false);
      console.log("Recording started.");
    } catch (error) {
      console.error("Error accessing microphone or Azure Blob Storage:", error);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      console.log("Pausing recording...");
      mediaRecorderRef.current.pause(); // Pause recording
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      console.log("Resuming recording...");
      mediaRecorderRef.current.resume(); // Resume recording
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      console.log("Stopping recording...");
      mediaRecorderRef.current.stop(); // Stop recording
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Audio Recorder</h1>
      <div className="mb-4">
        {!isRecording && (
          <button
            onClick={startRecording}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Start Recording
          </button>
        )}
        {isRecording && !isPaused && (
          <>
            <button
              onClick={pauseRecording}
              className="bg-yellow-500 text-white px-4 py-2 rounded mr-2"
            >
              Pause Recording
            </button>
            <button
              onClick={stopRecording}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Stop Recording
            </button>
          </>
        )}
        {isRecording && isPaused && (
          <>
            <button
              onClick={resumeRecording}
              className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
            >
              Resume Recording
            </button>
            <button
              onClick={stopRecording}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Stop Recording
            </button>
          </>
        )}
      </div>
      <RecordingsList recordings={recordings} />
    </div>
  );
};

export default AudioRecorder;
