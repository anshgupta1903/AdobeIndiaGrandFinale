# Adobe India Grand Finale Submission

This project is a web-based PDF reading experience created for the Adobe India Grand Finale. It allows users to upload, read, and interact with PDF documents in an innovative way. The application leverages AI/LLM-powered capabilities to provide insightful information, generate audio overviews, and connect related content across a user's personal document library.

---

## Special Features ✨

This project comes with a set of powerful features designed to enhance the user's reading and research experience:

* **Personalized Document Storage**: We've implemented user authentication, which means all your uploaded PDFs and the data generated from them are stored securely and are tied to your personal account. 🔐
* **High-Speed Caching with Redis**: To ensure a fast and responsive experience, we use Redis for caching and session management. This is a crucial feature that significantly boosts performance. 🚀
* **Multilingual Insights**: You can translate the generated insights into different languages, making the content more accessible.
* **Bilingual Podcast Generation**: Listen to a summary or key points of your documents on the go! We offer a podcast feature that can generate audio in both **Hindi and English**. 🎧
* **Instant Section Navigation**: Jump directly to the relevant section of the PDF from an extracted insight with a **single click**. This allows you to navigate to the exact source of information within the document in the blink of an eye. ⚡️
* **Responsive**: works on both laptop and mobile


---
### REACT_APP_ADOBE_CLIENT_ID=567c5c63bf92461db01e4c378384df9d
### Place this api key in .env in forntend

## How to Run This Project

### With Docker (Recommended)

Here are two approaches to build and run this project using Docker.

### Approach 1 (Based on the official document)

This approach uses the instructions provided in the `Adobe_Finale Document.pdf`.

##### 1. Build the Docker Image

First, build the Docker image using the following command. This command will build the solution with the platform specified as `linux/amd64` and tag it with your chosen image identifier.

#### docker build --platform linux/amd64 -t yourimageidentifier .
2. Run the Docker Container
Next, run the Docker container with the following command. This will start the application and make it accessible on http://localhost:8080.

This command sets up the necessary environment variables for the application to connect to various services like Adobe PDF Embed API, Google's Gemini LLM, and Azure's Text-to-Speech service. It also mounts a volume for credentials.



#### docker run -v /path/to/credentials:/credentials \
#### -e ADOBE_EMBED_API_KEY=<ADOBE_EMBED_API_KEY> \
#### -e LLM_PROVIDER=gemini \
#### -e GOOGLE_APPLICATION_CREDENTIALS=/credentials/adbe-gcp.json \
#### -e GEMINI_MODEL=gemini-2.5-flash \
#### -e TTS_PROVIDER=azure \
#### -e AZURE_TTS_KEY=<TTS_KEY> \
#### -e AZURE_TTS_ENDPOINT=<TTS_ENDPOINT> \
#### -p 8080:8080 yourimageidentifier

Of course. I've updated the docker run command in your readme.md file to use placeholders for the secret keys, making it safe to commit to version control.

Here is the updated section for your readme.md:

### Approach 2 USE google_api_key (Alternative Docker Run Command)
If the first approach does not work, you can use this simplified Docker run command. This command embeds the necessary API keys and endpoints directly as environment variables.

docker run \
  -e ADOBE_EMBED_API_KEY="your_adobe_key_here" \
  -e LLM_PROVIDER="gemini" \
  -e GOOGLE_API_KEY="your_google_api_key_here" \
  -e GEMINI_MODEL="gemini-1.5-flash" \
  -e TTS_PROVIDER="azure" \
  -e AZURE_TTS_KEY="your_azure_tts_key_here" \
  -e AZURE_TTS_ENDPOINT="your_azure_tts_endpoint_here" \
  -p 8080:8080 \
  yourimagename

Without Docker
If you prefer to run the project without Docker, you can follow these steps to set up the frontend and backend separately.

Backend Setup
Navigate to the Backend Directory:

* Start the redis server on your wsl
wsl --start redis
redis-cli ping

* Backend Setup
Navigate to the Backend Directory:
cd Backend
Install Dependencies:
It's recommended to use a virtual environment.


python -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
pip install -r requirements.txt
Set Environment Variables:
You need to set the same environment variables as in the Docker command. You can do this by exporting them in your terminal session or by using a .env file and a library like python-dotenv.


* in frontend/.env
export ADOBE_EMBED_API_KEY=your_adobe_api_key 

* in backend/.env
export LLM_PROVIDER=gemini
export GOOGLE_API_KEY=your_google_api_key
export GEMINI_MODEL=gemini-2.5-flash
export TTS_PROVIDER=azure
export AZURE_TTS_KEY=your_azure_tts_key
export AZURE_TTS_ENDPOINT=your_azure_tts_endpoint
Run the Backend Server:


uvicorn main:app --reload
The backend will now be running, typically on a port like 8000.

Frontend Setup
Navigate to the Frontend Directory:



cd Frontend
Install Dependencies:



npm install
Start the Frontend Development Server:


npm start
This will start the frontend application, and it should automatically open in your browser at http://localhost:3000. The frontend will connect to the backend service running on its specified port.



# Video Link
https://drive.google.com/file/d/1Y2YSUC6YJcj4YzXqSmBI_2V3LRWqdmI4/view?usp=sharing



