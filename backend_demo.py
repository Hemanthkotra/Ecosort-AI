# ==========================================
# EcoSort AI - Python RAG Backend Demo
# ==========================================
# This script demonstrates how a Python-based backend 
# processes user queries, retrieves relevant policy documents, 
# and builds a prompt for the IBM Granite AI model.

import math
import re

# 1. Mock Database representing local municipal waste policies
POLICY_DATABASE = [
    {
        "id": "doc1",
        "title": "Solid Waste Management Rules (2016), India",
        "text": "Rule 4: All waste generators must segregate and store waste in three separate streams: Biodegradable (Wet waste - Green bin), Non-biodegradable (Dry waste - Blue bin), and Domestic Hazardous waste (Red pouches). Mixing streams is punishable by a fine of Rs. 500."
    },
    {
        "id": "doc2",
        "title": "E-Waste (Management) Rules, India",
        "text": "Rule 12: Consumers must ensure e-waste (batteries, bulbs, cells, chargers, power banks, computer boards) is channelized to authorized collection points or registered recyclers. E-waste must not be mixed with municipal solid waste."
    },
    {
        "id": "doc3",
        "title": "MCGM Solid Waste Management Bylaws, Mumbai",
        "text": "Section 9: Biodegradable waste must contain no plastic residues. Plastic bags, even if labeled biodegradable, should not be mixed with backyard organic compost as they require commercial composting."
    },
    {
        "id": "doc4",
        "title": "Urban Recycling Contamination Directives",
        "text": "Clause 4.1: Cardboard and paper contaminated with food oils, grease, or pizza residue are rejected from recycling. Dry paper, newspaper, and boxes must be flattened and kept dry."
    }
]

def clean_and_tokenize(text):
    """Lowercase text and split into alphabetic words."""
    return set(re.findall(r'[a-z0-9]+', text.lower()))

def calculate_cosine_similarity(query_tokens, doc_tokens):
    """Calculates keyword similarity score between user query and document."""
    intersection = query_tokens.intersection(doc_tokens)
    if not query_tokens or not doc_tokens:
        return 0.0
    return len(intersection) / (math.sqrt(len(query_tokens)) * math.sqrt(len(doc_tokens)))

def retrieve_policy_documents(query, top_k=2):
    """Simulates Vector Database retrieval by matching query tokens to documents."""
    query_tokens = clean_and_tokenize(query)
    results = []
    
    for doc in POLICY_DATABASE:
        doc_tokens = clean_and_tokenize(doc["title"] + " " + doc["text"])
        score = calculate_cosine_similarity(query_tokens, doc_tokens)
        if score > 0:
            results.append((doc, score))
            
    # Sort results by similarity score in descending order
    results.sort(key=lambda x: x[1], reverse=True)
    return results[:top_k]

def construct_granite_prompt(query, matched_docs):
    """Assembles context-aware prompt template for IBM Granite LLM."""
    context_str = ""
    if matched_docs:
        for idx, (doc, score) in enumerate(matched_docs):
            context_str += f"\n[Source {idx+1}: {doc['title']} - Match: {score*100:.1f}%]\n\"{doc['text']}\"\n"
    else:
        context_str = "No specific municipal bylaws found for this topic."

    prompt = f"""<|system|>
You are a highly accurate Municipal Waste & Sustainability Advisor. Answer the citizen's query based strictly on the retrieved policies provided in the context below. 
If the context does not contain relevant instructions, answer using standard national guidelines and state that no specific local bylaws were found.
<|context|>
{context_str}
<|user|>
Question: {query}
<|assistant|>"""
    return prompt

# ==========================================
# Run Demo
# ==========================================
if __name__ == "__main__":
    print("-" * 50)
    print("EcoSort AI - Python RAG Backend Demo")
    print("-" * 50)
    
    # Simulate a user query
    user_query = "What is the fine for mixing wet and dry waste, and how to throw away batteries?"
    print(f"User Query: '{user_query}'\n")
    
    # Step 1: Document Retrieval (Simulating Vector Search)
    print("Step 1: Retrieving policy documents...")
    matched = retrieve_policy_documents(user_query)
    for doc, score in matched:
        print(f" -> Found match: {doc['title']} (Score: {score*100:.1f}%)")
    
    # Step 2: Prompt Engineering (Simulating IBM Granite prompt setup)
    print("\nStep 2: Constructing IBM Granite Input Prompt...")
    assembled_prompt = construct_granite_prompt(user_query, matched)
    print("=" * 60)
    print(assembled_prompt)
    print("=" * 60)
    
    print("\nStep 3: Ready to send to IBM Granite API for synthesis.")
    print("-" * 50)
