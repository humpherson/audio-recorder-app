import React from "react";

const RecordingsList = ({ recordings, onDelete }) => {
  if (recordings.length === 0) {
    return <p className="text-gray-400">No recordings available.</p>;
  }

  return (
    <div>
      <ul>
        {recordings.map((recording, index) => (
          <li key={recording.name} className="mb-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <strong className="truncate">{recording.name}</strong>
            </div>
            <audio controls src={recording.url} className="w-full"></audio>
            <div className="mt-2 flex space-x-4">
              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                onClick={() => onDelete(recording.name)}
              >
                Delete
              </button>
              <a
                href={recording.url}
                download={recording.name}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Download
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecordingsList;
