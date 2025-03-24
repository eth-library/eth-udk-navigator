# Copyright (c) 2025 ETH Library Zürich
# Licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0)

from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify, Response
import json
import os
from functools import wraps
from pinecone import Pinecone
import openai
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()  # Load variables from .env into environment

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "default-secret")  # Used for session encryption (set securely in Replit secrets)
CORS(app)  # Enable CORS for all routes

# --- Load ETH-UDK Data from JSON ---
DATA_FILE = "data.json"
if not os.path.exists(DATA_FILE):
    raise FileNotFoundError(f"Data file {DATA_FILE} not found!")

with open(DATA_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

# Convert list of records into dict for quick lookup by 'sys' ID
data_dict = {item["sys"]: item for item in data}

# --- Session-based Login Decorator ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get("logged_in"):
            return redirect(url_for("login", next=request.url))
        return f(*args, **kwargs)
    return decorated_function

# --- Login View ---
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        password = request.form.get("password")
        if password == os.environ.get("VECTOR_QUERY_PASSWORD"):
            session["logged_in"] = True
            flash("Login successful!", "success")
            next_page = request.args.get("next")
            return redirect(next_page or url_for("vector_query"))
        else:
            flash("Incorrect password.", "danger")
    return render_template("login.html")

# --- Logout View ---
@app.route("/logout")
def logout():
    session.clear()
    flash("You have been logged out.", "info")
    return redirect(url_for("login"))

# --- Main Page Routes ---
@app.route("/")
def index():
    return render_template("home.html")

@app.route("/explorer")
def explorer():
    return render_template("index.html")

@app.route("/graph")
def graph_page():
    return render_template("graph.html")

# --- Data API Endpoints ---
@app.route("/roots")
def get_root_objects():
    root_objects = [
        {"sys": obj["sys"], "descriptor_eng": obj["descriptor_eng"], "descriptor_ger": obj["descriptor_ger"]}
        for obj in data_dict.values() if not obj.get("broader_terms")
    ]
    root_objects = sorted(root_objects, key=lambda x: x['descriptor_eng'].lower())
    return jsonify(root_objects)

@app.route("/object/<int:sys_id>")
def get_object(sys_id):
    obj = data_dict.get(sys_id)
    if not obj:
        return jsonify({"error": "Object not found"}), 404

    response = dict(obj)

    # Resolve related concept links
    broader_terms_resolved = [
        {"sys": bt, "name": data_dict[bt]["descriptor_eng"]}
        for bt in obj.get("broader_terms", []) if bt in data_dict
    ]
    narrower_terms_resolved = [
        {"sys": nt, "name": data_dict[nt]["descriptor_eng"]}
        for nt in obj.get("narrower_terms", []) if nt in data_dict
    ]
    related_terms_raw = obj.get("related_terms", "")
    related_terms_resolved = []
    if related_terms_raw:
        related_terms_ids = [int(rt.strip()) for rt in related_terms_raw.split(",") if rt.strip().isdigit()]
        related_terms_resolved = [
            {"sys": rt, "name": data_dict[rt]["descriptor_eng"]}
            for rt in related_terms_ids if rt in data_dict
        ]

    response["broader_terms_resolved"] = sorted(broader_terms_resolved, key=lambda x: x['name'].lower())
    response["narrower_terms_resolved"] = sorted(narrower_terms_resolved, key=lambda x: x['name'].lower())
    response["related_terms_resolved"] = sorted(related_terms_resolved, key=lambda x: x['name'].lower())

    return jsonify(response)

# --- Search Endpoint (used for Explorer page) ---
@app.route("/search")
def search_objects():
    query = request.args.get('q', '').strip().lower()
    if not query:
        return jsonify({"top_picks": [], "other_results": []})

    all_results = []
    for obj in data_dict.values():
        descriptors = [
            obj.get('descriptor_eng', '').lower(),
            obj.get('descriptor_ger', '').lower(),
            obj.get('descriptor_fre', '').lower()
        ]
        if any(query in desc for desc in descriptors):
            all_results.append({
                "sys": obj["sys"],
                "descriptor_eng": obj["descriptor_eng"],
                "descriptor_ger": obj["descriptor_ger"]
            })

    all_results_sorted = sorted(all_results, key=lambda x: x['descriptor_eng'])

    # Prioritized top picks
    exact_matches = [item for item in all_results if item["descriptor_eng"].lower() == query]
    start_single_word_matches = [item for item in all_results if item not in exact_matches and item["descriptor_eng"].lower().startswith(query) and len(item["descriptor_eng"].split()) == 1]
    start_two_word_matches = [item for item in all_results if item not in exact_matches and item not in start_single_word_matches and item["descriptor_eng"].lower().startswith(query) and len(item["descriptor_eng"].split()) == 2]
    short_word_matches = [item for item in all_results if item not in exact_matches and item not in start_single_word_matches and item not in start_two_word_matches and len(item["descriptor_eng"].split()) <= 2]

    top_picks = (exact_matches + start_single_word_matches + start_two_word_matches + short_word_matches)[:5]

    return jsonify({"top_picks": top_picks, "other_results": all_results_sorted})

# --- Graph Data Endpoints ---
@app.route("/graph-roots")
def graph_roots():
    root_objects = [
        {"sys": obj["sys"], "descriptor_eng": obj["descriptor_eng"]}
        for obj in data_dict.values() if not obj.get("broader_terms")
    ]
    root_objects = sorted(root_objects, key=lambda x: x['descriptor_eng'].lower())
    return jsonify(root_objects)

@app.route("/graph-focused")
def graph_focused():
    sys_id = request.args.get("sys", type=int)
    if not sys_id or sys_id not in data_dict:
        return jsonify({"nodes": [], "edges": []})

    def create_node(obj, color):
        sys = obj["sys"]
        tooltip = (
            f"{obj['descriptor_eng']}\nGerman: {obj.get('descriptor_ger', '')}\nFrench: {obj.get('descriptor_fre', '')}\n"
            f"Level: {obj.get('level', '')}\nSYS: {sys}\nUDC: {obj.get('udc', '')}\n"
            f"Variants EN: {obj.get('variants_eng', '')}\nVariants DE: {obj.get('variants_ger', '')}\nVariants FR: {obj.get('variants_fre', '')}"
        )
        return {"id": sys, "label": obj["descriptor_eng"], "color": color, "title": tooltip}

    obj = data_dict[sys_id]
    nodes = [create_node(obj, "orange")]
    edges = []

    for bt in obj.get("broader_terms", []):
        if bt in data_dict:
            nodes.append(create_node(data_dict[bt], "green"))
            edges.append({"from": bt, "to": sys_id})

    for nt in obj.get("narrower_terms", []):
        if nt in data_dict:
            nodes.append(create_node(data_dict[nt], "blue"))
            edges.append({"from": sys_id, "to": nt})

    for rt in obj.get("related_terms", "").split(","):
        if rt.strip().isdigit():
            rt_int = int(rt.strip())
            if rt_int in data_dict:
                nodes.append(create_node(data_dict[rt_int], "red"))
                edges.append({"from": sys_id, "to": rt_int})

    return jsonify({"nodes": nodes, "edges": edges})

# --- Vector Query Page (Protected with login) ---
@app.route("/vector-query", methods=["GET", "POST"])
@login_required
def vector_query():
    results = []
    level_options = [f"{i}.0" for i in range(23)]
    form_data = {
        "title": "",
        "abstract": "",
        "toc": "",
        "namespace": "descriptor-variant",
        "level_min": "0.0",
        "level_max": "22.0",
        "language": "eng"
    }

    if request.method == "POST":
        # Read API keys from Replit secrets
        PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
        OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
        if not PINECONE_API_KEY or not OPENAI_API_KEY:
            return "Missing API keys", 500

        # Init clients
        pc = Pinecone(api_key=PINECONE_API_KEY)
        index = pc.Index("udk-oa3large3072")
        client = openai.OpenAI(api_key=OPENAI_API_KEY)

        # Get form data
        form_data["title"] = request.form.get("title", "").strip()
        form_data["abstract"] = request.form.get("abstract", "").strip()
        form_data["toc"] = request.form.get("toc", "").strip()
        form_data["namespace"] = request.form.get("namespace", "descriptor-variant")
        form_data["level_min"] = request.form.get("level_min", "0.0")
        form_data["level_max"] = request.form.get("level_max", "22.0")
        form_data["language"] = request.form.get("language", "eng")

        # Convert range to selected level strings
        try:
            min_val = int(float(form_data["level_min"]))
            max_val = int(float(form_data["level_max"]))
            selected_levels = [f"{i}.0" for i in range(min_val, max_val + 1)]
        except ValueError:
            selected_levels = level_options

        query_text = f"{form_data['title']} {form_data['abstract']} {form_data['toc']}".strip()

        if query_text:
            # Create embedding
            embedding = client.embeddings.create(
                input=query_text,
                model="text-embedding-3-large"
            ).data[0].embedding

            # Query Pinecone with metadata filter
            pinecone_result = index.query(
                vector=embedding,
                namespace=form_data["namespace"],
                top_k=50,
                include_metadata=True,
                filter={"level": {"$in": selected_levels}}
            )
            results = pinecone_result.matches

    print(f"✅ Pinecone returned {len(results)} matches.")
    for match in results:
        print(f"{match.id} - Score: {match.score}")

    return render_template("vector_query.html", form_data=form_data, level_options=level_options, results=results)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
