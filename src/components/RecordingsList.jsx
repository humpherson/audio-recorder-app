import React from "react";

const RecordingsList = ({ recordings }) => {
  if (recordings.length === 0) {
    return <p>No recordings available. Start recording to see them here!</p>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Your Recordings</h2>
      <ul>
        {recordings.map((recording, index) => (
          <li key={index} className="mb-4">
            <div className="mb-2">
              <strong>{recording.name}</strong>
            </div>
            <audio controls src={recording.url} className="w-full"></audio>
            <div className="mt-2">
              <a
                href={recording.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Download Recording
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecordingsList;