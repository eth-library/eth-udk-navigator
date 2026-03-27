# ETH-UDK Navigator - Technical Documentation

## 1. Introduction
The **ETH-UDK Navigator** is a web-based application designed to explore, search, and visualize the ETH-UDK Subject Classification System. 

It provides users with:
- **Graph Explorer**: An interactive, physics-based network visualization (using `vis.js`) to explore the hierarchical structure (Broader, Narrower, Related terms) of the classification data with active filtering.
- **Search & List Explorer**: A dynamic search interface that queries a massive 55MB underlying JSON data dictionary (`data.json`) instantly.
- **Vector Search Query**: A protected endpoint that uses OpenAI (`text-embedding-3-large`) embeddings to query a Pinecone Vector Database for semantic classification searches.
- **Auto-Classification & Extraction**: API endpoints to scrape website abstracts (`BeautifulSoup`) and parse PDFs (`PyMuPDF/fitz`), sending the text payload directly to an integrated `n8n` webhook for automated metadata handling.

The app uses **Python 3.11+** with **Flask** on the backend, and is deployed entirely on Google Cloud Run via a static `Dockerfile`.

---

## 2. Setup and Installation (Windows Environment)

### Prerequisites
1. **Python 3.11+**: Download from python.org and ensure Python is added to your Windows PATH.
2. **Git Bash for Windows**: Highly recommended for running `.sh` deployment scripts natively.
3. **Google Cloud CLI (`gcloud`)**: Download the Windows installer from [Google Cloud's SDK page](https://cloud.google.com/sdk/docs/install#windows) and install it.

### Local Initialization
1. Clone or download the repository to your Windows machine and open a terminal inside the project directory:
   ```bash
   cd path/to/eth-udk-navigator
   ```

2. Create a virtual environment to isolate the Python packages:
   ```bash
   python -m venv .venv
   ```

3. Activate the virtual environment (on Windows):
   ```cmd
   .\.venv\Scripts\activate
   ```
   *(If using Git Bash, use `source .venv/Scripts/activate`)*

4. Install all production dependencies specified in the project requirements:
   ```bash
   pip install -r requirements.txt
   ```

### Google Cloud Authentication Setup
Because you will be deploying to Google Cloud Run, verify your identity locally via the Cloud CLI:
```bash
# Log in to your Google Account
gcloud auth login

# Set the active project strictly to your deployment project
gcloud config set project ethbib-lumina
```

---

## 3. Configuration Options (`.env`)

The application expects its security configuration and API keys to be provided securely as environment variables. 
Create a file named **`.env`** in the root directory (this file is ignored from git by default) and fill it with your credentials:

```ini
# --- OpenAI & Pinecone (Vector Search) ---
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PINECONE_API_KEY=pcsk_xxxxxxxxxxxxxxxxxxxxxxxxxxx

# --- Application Security ---
# Password to access the protected /vector-query route
VECTOR_QUERY_PASSWORD=your-secure-password
# Cryptographic key for securing Flask user sessions
SESSION_SECRET=your-random-generated-secret-key-==

# --- External Webhooks ---
# n8n endpoint target for auto-classification tasks
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/endpoint
# Authenticates requests arriving at your n8n target
N8N_WEBHOOK_API_KEY=your-n8n-api-key
```

> **Warning:** Never commit your `.env` file to GitHub or any public source control. Keep it local.

---

## 4. Running on the Local Server

During development, the easiest way to test changes instantly is to run the built-in Flask Werkzeug server. 
With your virtual environment activated and your `.env` file created, simply run:

```bash
python main.py
```
* **What this does:** Python will dynamically read the local `.env` keys, map to port `8080`, and start the app.
* **Accessing the App:** Open your browser and navigate to exactly: `http://localhost:8080/`
* **Stopping:** Press `CTRL + C` in the terminal to kill the local server.

---

## 5. Deploying to Google Cloud Run

To safely bridge the gap between a Windows environment and a Linux Cloud Run server without running into carriage-return (`\r\n`) bugs, the project utilizes an explicitly defined `Dockerfile`. 

Deployment is simplified through the included `deploy.sh` file, which securely dynamically parses your local `.env` file and pushes the variables to Google Cloud *during* orchestration.

### Deployment Command
Using **Git Bash for Windows**, execute the following command from the root directory:

```bash
./deploy.sh
```

### What the deploy script does behind the scenes:
1. **Dynamic Secret Loading**: Parses your local `.env` and mathematically constructs a comma-separated format without any invisible `\r` Windows line-breaks.
2. **Build Execution**: Instructs Google Cloud Build to compile a pristine Linux container strictly according to the `Dockerfile`.
3. **Execution Configuration**: Google Cloud Run provisions the container with 2048Mi memory (required to securely map the 55MB JSON dataset into memory) and 1 CPU. 
4. **Booting**: Inside the container, `gunicorn` spins up the application tightly bonded to the dynamic `$PORT` provided by Cloud Run, running exactly 1 worker and 8 threads. 

Once the terminal outputs `Done!`, it will provide the live Production URL (e.g., `https://eth-udk-navigator-...run.app`).
