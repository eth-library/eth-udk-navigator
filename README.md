# ETH-UDK Navigator

**ETH-UDK Navigator** is an AI-powered web application developed by the [ETH Library](https://library.ethz.ch) to support subject indexing and discovery using the ETH Zurich adaptation of the Universal Decimal Classification (UDC).

The application combines classical classification data with modern AI tools, allowing users to explore subject hierarchies, interactively visualize semantic relationships, and search classification terms using natural language via semantic vector search.

---

## 📚 What You Can Do with ETH-UDK Navigator

### 1. **Explore the Classification**
Use the **Explorer** view to browse top-level classification terms and drill down into narrower or related concepts.

### 2. **Visualize Relationships**
Use the **Graph** view to display an interactive graph of broader, narrower, and related terms. This helps understand the semantic structure of a concept within ETH-UDK.

### 3. **Semantic Search with Vector Query**
Use the **Vector Query** tool (requires login) to:
- Paste in a **title**, **abstract**, or **table of contents** from a document
- Select a classification **namespace** and **level range**
- Submit the form to see the **most semantically relevant ETH-UDK terms**

This tool uses OpenAI embeddings and Pinecone vector search to find terms that best match the meaning of your input.

> ⚠️ The vector query functionality is experimental and will serve as a foundation for future AI-based workflows for subject indexing.

---

## 🤖 Getting Started (for Developers)

> 🧪 This project is also Replit-compatible. You can run it directly in Replit by forking this repo.


### ♻️ Prerequisites
- Python 3.11+
- `pip`
- Git

### ⬆️ Clone the Repository
```bash
git clone https://github.com/your-username/eth-udk-navigator.git
cd eth-udk-navigator
```

### 👤 Create Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### ⚙️ Install Dependencies
```bash
pip install -r requirements.txt
```

### ⚡ Set up Environment Variables
1. Copy the template:
```bash
cp .env.example .env
```
2. Fill in your `.env` file with the correct secrets:
```
FLASK_SECRET_KEY=your-generated-secret-key
VECTOR_QUERY_PASSWORD=your-password
PINECONE_API_KEY=your-pinecone-key
OPENAI_API_KEY=your-openai-key
```

> To generate a secure `FLASK_SECRET_KEY`:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 🚀 Run the Application
```bash
python main.py
```
The app will be accessible at: [http://localhost:5000](http://localhost:5000)

---

## 💡 Project Structure
```
eth-udk-navigator/
├── templates/              # HTML templates (Jinja2)
│   ├── home.html
│   ├── index.html
│   ├── graph.html
│   ├── vector_query.html
│   ├── login.html
│   ├── _footer.html
│   └── _navbar.html
├── static/                 # Static files (CSS, JS)
│   ├── styles.css
│   ├── nav.css
├── data.json               # ETH-UDK classification data
├── main.py                 # Flask app
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variable template
└── README.md               # This file
```

---

## 🚪 Authentication for Vector Query
The Vector Query page is protected via password login. Users must enter a password defined in the environment variable `VECTOR_QUERY_PASSWORD`. Sessions are managed securely via Flask sessions.

---

## 🚀 Modifying the Project
- Update the `data.json` file if you want to load a different classification structure.
- To change the model or vector search logic, look into the `vector_query` route in `main.py`.
- Semantic embeddings are created using OpenAI's `text-embedding-3-large` model. You may adapt this if you use a different provider or model.
- The app uses Pinecone for vector search. You can swap this out for another provider or a local vector DB (e.g. `faiss`) with some adjustments.

---

## 📄 License
This project is licensed under the **Apache License 2.0**. See the [`LICENSE`](LICENSE) file for details.

---

## 🤝 Credits
Created and maintained by the ETH Library team, part of the **AI Library Automation** initiative.

Questions? Feedback? Contact us at: [api@library.ethz.ch](mailto:api@library.ethz.ch)

---

Happy hacking ✨
