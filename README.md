# Audio Recorder App

A powerful, browser-based audio recorder app designed to capture and save audio directly to Azure Blob Storage.

## Description

The Audio Recorder App allows users to record audio, pause/resume recordings, and save audio data in real-time to Azure Blob Storage. It is designed for flexibility and extensibility, making it easy to adapt for web and native platforms like Android and iOS.

## Features

- Record audio directly from the browser or Android device
- Pause and resume recordings seamlessly
- Real-time upload of audio chunks to Azure Blob Storage
- Retry logic for resilient uploads
- Cross-platform support (web, Android and iOS)
- Supports `.webm` and `.mp4` formats
- Designed for integration into larger systems or standalone use

## Getting Started

### Prerequisites

1.  Node.js (v16 or higher) and npm installed.
2.  Android Studio (for Android builds).
3.  Azure Storage account with configured CORS rules.
4.  Capacitor CLI installed globally:

    `npm install -g @capacitor/cli`

### Installation

1.  Clone the repository:|

    `git clone https://github.com/your-username/audio-recorder-app.git`
    `cd audio-recorder-app`

2.  Install dependencies:

    `npm install`

3.  Configure environment variables:

- Create a `.env` file in the project root.
- Add the following: `VITE_AZURE_BLOB_SAS_URL=<Your Azure Blob SAS URL>`

### Development

1.  Start the development server:

    `npm run dev`

2.  Open the app in your browser:

    `http://localhost:5173`

### Building

#### Web App

1.  Build the production version:

    `npm run build`

2.  The built assets will be in the `dist` folder.

#### **Android App**

1.  Add the Android platform (if not already added):

    `npx cap add android`

2.  Sync the project:

    `npm run build`
    `npx cap copy`
    `npx cap sync android`

3.  Open the Android project in Android Studio:

    `npx cap open android`

4.  Build the APK:

    - In Android Studio, go to **Build > Build Bundle(s)/APK(s) > Build APK(s)**.
    - Locate the APK in `android/app/build/outputs/apk/debug/`

5.  Share and install the APK on your Android device.

## Contributing

Contributions are welcome! To contribute:

1.  Fork the repository.
2.  Create a new branch for your feature/bugfix:

    `git checkout -b feature/your-feature-name`

3.  Commit your changes and push to your forked repository.
4.  Open a pull request to the main repository.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
