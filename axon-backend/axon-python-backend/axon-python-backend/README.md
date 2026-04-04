# Python Embedding Service – RepoSense.AI

This Python microservice provides text/code embeddings using a transformer model served via a minimal FastAPI application. It is used by the Node.js backend for semantic embedding and search functionality.

---

## ✅ Setup Instructions

### 1. Install Python (version 3.8 or above)

Download Python from the official site:  
[https://www.python.org/downloads](https://www.python.org/downloads)

During installation, make sure to:

- ✅ Check **"Add Python to PATH"**
- ✅ Ensure **pip** is installed

Verify installation:

```bash
python --version
pip --version
```
After cloning the repository - 

### 1. Create and Activate a Virtual Environment

On Windows

```bash
python -m venv venv
venv\Scripts\activate
```

On macOS/Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```
### 3. Setup OpenAI API - Run this in terminal

Link for your own GitHub Token for OpenAI
[https://github.com/marketplace/models](https://github.com/marketplace/models)

```bash
$Env:GITHUB_TOKEN="<your-github-token>"
```

### 4. Run the Python Server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 5005
```


