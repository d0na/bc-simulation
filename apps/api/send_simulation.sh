#!/bin/bash

# Verifica che sia fornito un file JSON come argomento
if [ $# -ne 1 ]; then
    echo "Usage: $0 <json_file>"
    exit 1
fi

JSON_FILE=$1

# Verifica che il file esista
if [ ! -f "$JSON_FILE" ]; then
    echo "Error: File '$JSON_FILE' not found!"
    exit 1
fi

# Esegue la richiesta HTTP POST e cattura response + status code
echo "Sending simulation request from '$JSON_FILE'..."
echo "--------------------------------------------"

response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d @"$JSON_FILE" \
  http://localhost:8099/newsimulation)

# Estrae body e status code
body=$(echo "$response" | sed '/HTTP_STATUS/d')
http_status=$(echo "$response" | grep 'HTTP_STATUS' | cut -d':' -f2)

# Determina se è un successo (2xx) o un errore (4xx/5xx)
if [[ "$http_status" =~ ^2[0-9]{2}$ ]]; then
    echo -e "\n[SUCCESS] Status: $http_status"
    echo "--------------------------------------------"
    echo "Response Body:"
    echo "$body" | jq . 2>/dev/null || echo "$body"
else
    echo -e "\n[ERROR] Status: $http_status"
    echo "--------------------------------------------"
    echo "Details:"
    echo "$body" | jq . 2>/dev/null || echo "$body"
    exit 1  # Esce con errore
fi

exit 0