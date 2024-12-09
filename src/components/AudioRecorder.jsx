import React, { useState, useRef } from "react";
import { BlobServiceClient } from "@azure/storage-blob";
import RecordingsList from "./RecordingsList";

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const mediaRecorderRef = useRef(null); // Reference to the MediaRecorder instance
  const blockListRef = useRef([]); // Store block IDs for the block list
  const blockBlobClientRef = useRef(null); // Reference to the Azure BlockBlobClient

  // Helper to determine the supported MIME type
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

      // Initialize Azure Blob Storage client
      const blobServiceClient = new BlobServiceClient(
        import.meta.env.VITE_AZURE_BLOB_SAS_URL
      );
      const containerClient =
        blobServiceClient.getContainerClient("audio-recordings");
      const blobName = `recording-${Date.now()}.${extension}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      blockBlobClientRef.current = blockBlobClient;

      // Reset block list for a new recording (4. Reset Block List for Each Recording)
      blockListRef.current = [];

      console.log(`Blob name: ${blobName}`);
      console.log("Starting recording...");

      // Event handlers for MediaRecorder
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          // Process non-zero-size chunks (1. Check for Zero-Size Chunks)
          const chunk = event.data;
          const blockId = btoa(`block-${Date.now()}`); // Unique block ID
          blockListRef.current.push(blockId); // Add block ID to the list for commit

          console.log(`Chunk created. Size: ${chunk.size} bytes`);
          console.log(`Uploading block with ID: ${blockId}`);

          try {
            // Retry logic for chunk upload (5. Retry Logic for Chunk Uploads)
            await retry(() =>
              blockBlobClient.stageBlock(blockId, chunk, chunk.size)
            ); // Correctly specify chunk size (2. Correctly Specify Chunk Size)
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
          // Ensure there are blocks to commit (3. Ensure Proper Blob Initialization)
          if (blockListRef.current.length === 0) {
            console.warn("No blocks to commit. Recording might be empty.");
            return;
          }

          // Retry logic for committing the block list (6. Retry Logic for Block List Commit)
          await retry(() =>
            blockBlobClientRef.current.commitBlockList(blockListRef.current)
          );
          console.log("All blocks committed successfully!");

          // Save recording URL for playback or download
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
      console.log("Recording started.");
    } catch (error) {
      console.error("Error accessing microphone or Azure Blob Storage:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      console.log("Stopping recording...");
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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
        {isRecording && (
          <button
            onClick={stopRecording}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Stop Recording
          </button>
        )}
      </div>
      <RecordingsList recordings={recordings} />
    </div>
  );
};

export default AudioRecorder;
