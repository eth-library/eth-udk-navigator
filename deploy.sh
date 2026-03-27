#!/bin/bash

echo "Deploying to Cloud Run..."

ENV_VARS=$(paste -sd, .env | tr -d '\r')

gcloud run deploy eth-udk-navigator \
  --source . \
  --region europe-west6 \
  --allow-unauthenticated \
  --memory=2048Mi \
  --cpu=1 \
  --concurrency=10 \
  --timeout=300 \
  --min-instances=0 \
  --max-instances=3 \
  --set-env-vars "$ENV_VARS"

echo "Done!"