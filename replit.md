# ETH-UDK Navigator

## Overview

ETH-UDK Navigator is an AI-powered web application built by ETH Library Zürich for exploring and searching the ETH Zurich adaptation of the Universal Decimal Classification (UDK) system. It provides three main tools:

1. **Explorer** – Browse and navigate the classification hierarchy in a list-based view
2. **Graph** – Visualize semantic relationships (broader, narrower, related terms) using interactive network graphs
3. **Vector Query** – Submit document metadata (title, abstract, TOC) to find semantically relevant classification terms using AI embeddings (requires login)

The app also includes an experimental **Auto Classification Workflow Eval** tool for evaluating different automated classification approaches.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend: Flask (Python)

- **Framework**: Flask 3.0.0, a lightweight Python web framework
- **Entry point**: `main.py` – handles all routing, data loading, authentication, and API endpoints
- **Data source**: Classification data is loaded from `data.json` at startup into an in-memory dictionary (`data_dict`) keyed by `sys` ID for fast lookup. There is no traditional database.
- **Authentication**: Simple session-based login using Flask sessions. A `login_required` decorator protects sensitive routes (like Vector Query). Password is likely stored as an environment variable.
- **CORS**: Enabled globally via `flask-cors`
- **Environment variables**: Managed via `python-dotenv` loading from `.env` file. Key secrets include `FLASK_SECRET_KEY`, and credentials for Pinecone and OpenAI.

### Frontend: Server-rendered HTML + Vanilla JS

- **Templating**: Jinja2 templates in `templates/` directory with shared partials (`_navbar.html`, `_footer.html`)
- **CSS Framework**: Bootstrap 5.3.0 (loaded via CDN)
- **Custom styling**: Multiple CSS files in `static/` — `styles.css` (explorer), `graph.css` (graph view), `nav.css` (navigation), `fonts.css` (custom DINPro font)
- **JavaScript**: Vanilla JS files per feature — `scripts.js` (explorer), `graph.js` (ETH-UDK graph), `taxonomy_graph.js` (Wikidata taxonomy graph), `vector_query.js` (vector query form logic)
- **Graph visualization**: Uses vis-network library (v9.1.9), bundled locally as `static/vis-network.min.js`
- **No build system**: All JS/CSS is served directly as static files, no bundler or transpiler

### Key Pages/Routes

| Route | Template | Purpose |
|-------|----------|---------|
| `/` | `home.html` | Landing page with feature cards and intro video |
| `/explorer` | `index.html` | List-based classification browser |
| `/graph` | `graph.html` | Interactive network graph of ETH-UDK terms |
| `/vector-query` | `vector_query.html` | AI-powered semantic search (login required) |
| `/auto-classification` | `auto-classification.html` | Workflow evaluation tool |
| `/login` | `login.html` | Password-based login page |

### API Endpoints (JSON)

- `/roots` – Returns top-level classification objects
- `/object/<sys>` – Returns details for a specific classification term
- `/search?q=...` – Searches classification terms
- Graph-related endpoints for loading focused subgraphs

### Data Model

Classification records in `data.json` have this structure:
- `sys` (int): Unique identifier
- `level` (int): Hierarchy depth level
- `udc` (string): UDC notation
- `descriptor_eng/ger/fre` (string): Labels in English, German, French
- `variants_eng/ger/fre` (string): Alternative labels
- `broader_terms` (list of int): Parent term sys IDs
- `narrower_terms` (list of int): Child term sys IDs
- `related_terms` (string): Related term references
- `category_label` (string): e.g., "topical"
- `root_term` (string): e.g., "domain" or "facet"

There is also `static/taxonomy-enriched.json` containing Wikidata-sourced taxonomy data with QIDs, labels, descriptions, and relationships (subclass_of, instance_of, has_part).

## External Dependencies

### AI/ML Services
- **OpenAI API** (`openai` package): Used to generate text embeddings for the vector query feature. Requires `OPENAI_API_KEY` environment variable.
- **Pinecone** (`pinecone` package): Vector database for similarity search against pre-indexed ETH-UDK classification embeddings. Requires Pinecone API key and index configuration.

### Python Libraries
- **Flask** + **Flask-CORS**: Web framework and cross-origin support
- **Gunicorn**: Production WSGI server
- **PyMuPDF** (`fitz`): PDF text extraction (currently commented out in imports but listed in requirements)
- **BeautifulSoup4**: HTML parsing, likely for scraping metadata from external sources
- **Requests**: HTTP client for external API calls (e.g., Swisscovery lookups)
- **python-dotenv**: Environment variable management

### External Data Sources
- **Swisscovery**: Library catalog system used for MMS-ID lookups to retrieve document metadata
- **ETH-UDK Database**: Links out to `eth-udk.library.ethz.ch` for term details
- **Swisscovery Search**: Links out to `eth.swisscovery.slsp.ch` for catalog searches

### Frontend Libraries (CDN/Local)
- **Bootstrap 5.3.0**: UI framework (CDN)
- **vis-network 9.1.9**: Graph visualization (bundled locally)
- **noUiSlider 15.7.0**: Range slider for vector query level selection (CDN)

### Environment Variables Required
- `FLASK_SECRET_KEY`: Session encryption key
- `OPENAI_API_KEY`: For embedding generation
- Pinecone credentials (API key, environment, index name)
- Login password for protected routes