import os
import sys
import json
import shutil
import git

import google.generativeai as genai

def clone_repo(repo_url, local_dir, github_token=None):
    if github_token:
        protocol, rest = repo_url.split("://")
        repo_url = f"{protocol}://{github_token}@{rest}"
    if os.path.exists(local_dir):
        shutil.rmtree(local_dir)
    git.Repo.clone_from(repo_url, local_dir)

def is_binary_file(file_path):
    try:
        with open(file_path, 'rb') as f:
            chunk = f.read(1024)
            if b'\0' in chunk:
                return True
    except Exception:
        return True
    return False

# def read_code_files(directory):
#     code_files = {}
#     for root, dirs, files in os.walk(directory):
#         for file in files:
#             file_path = os.path.join(root, file)
#             # Skip binary files only
#             if is_binary_file(file_path):
#                 continue
#             try:
#                 with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
#                     code_files[file_path] = f.read()
#             except Exception as e:
#                 code_files[file_path] = f"[Error reading file: {e}]"
#     return code_files

def read_code_files(directory):
    code_files = {}
    for root, dirs, files in os.walk(directory):
        # Exclude .git and other hidden directories
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for file in files:
            # Exclude hidden files (optional, if you want)
            # if file.startswith('.'):
            #     continue
            file_path = os.path.join(root, file)
            if is_binary_file(file_path):
                continue
            try:
                with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                    code_files[file_path] = f.read()
            except Exception as e:
                code_files[file_path] = f"[Error reading file: {e}]"
    return code_files



def estimate_tokens(text):
    # Rough estimate: 1 token ≈ 4 characters
    return max(1, int(len(text) / 4))

def batch_code_files(code_files, max_tokens_per_batch=2000):
    batches = []
    current_batch = {}
    current_tokens = 0

    for filename, code in code_files.items():
        tokens = estimate_tokens(code)
        if tokens > max_tokens_per_batch:
            # Split large files
            chunks = [code[i:i+max_tokens_per_batch*4] for i in range(0, len(code), max_tokens_per_batch*4)]
            for idx, chunk in enumerate(chunks):
                batches.append({f"{filename} (part {idx+1})": chunk})
        else:
            if current_tokens + tokens > max_tokens_per_batch and current_batch:
                batches.append(current_batch)
                current_batch = {}
                current_tokens = 0
            current_batch[filename] = code
            current_tokens += tokens

    if current_batch:
        batches.append(current_batch)

    return batches


def send_code_to_gemini(api_key, code_batch, model_name="gemini-2.5-flash"):
    import google.generativeai as genai
    genai.configure(api_key=api_key)
    code_context = "\n\n".join([f"# File: {fname}\n{content}" for fname, content in code_batch.items()])
    prompt = (
        "You are an expert code reviewer. Analyze the following project files and suggest improvements, bugs, or optimizations. "
        "If the file is not code, summarize its purpose.\n\n"
        f"{code_context}"
    )
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)
        return {"text": response.text}
    except Exception as e:
        return {"error": str(e)}



def analyze_github_repo(repo_url, local_dir, gemini_api_key, github_token=None):
    try:
        clone_repo(repo_url, local_dir, github_token)
        code_files = read_code_files(local_dir)
        batches = batch_code_files(code_files)
        results = []
        for batch in batches:
            ai_response = send_code_to_gemini(gemini_api_key, batch)
            results.append({
                "files": list(batch.keys()),
                "ai_response": ai_response
            })
        # Clean up
        # shutil.rmtree(local_dir)
        return {"success": True, "results": results}
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    # Usage: python github_ai_assistant.py <repo_url> <local_dir> <gemini_api_key> [github_token]
    if len(sys.argv) < 4:
        print(json.dumps({"success": False, "error": "Usage: python github_ai_assistant.py <repo_url> <local_dir> <gemini_api_key> [github_token]"}))
        sys.exit(1)
    repo_url = sys.argv[1]
    local_dir = sys.argv[2]
    gemini_api_key = sys.argv[3]
    github_token = sys.argv[4] if len(sys.argv) > 4 else None

    result = analyze_github_repo(repo_url, local_dir, gemini_api_key, github_token)
    print(json.dumps(result))
