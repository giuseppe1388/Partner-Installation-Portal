#!/bin/bash

# Test webhook Salesforce
# Questo script invia un webhook di test al server locale

BASE_URL="http://localhost:3000"

echo "Testing Salesforce Webhook..."
echo ""

# Test 1: Creare una nuova installazione
echo "Test 1: Creazione nuova installazione"
curl -X POST "$BASE_URL/api/webhook/salesforce" \
  -H "Content-Type: application/json" \
  -d '{
    "ServiceAppointmentId": "SA-TEST-001",
    "CustomerName": "Mario",
    "CustomerSurname": "Rossi",
    "CustomerCF": "RSSMRA80A01H501Z",
    "CustomerPhone": "+39 333 1234567",
    "CustomerEmail": "mario.rossi@example.com",
    "CustomerAddress": "Via Roma 10, 20100 Milano",
    "InstallationAddress": "Via Milano 5, 20100 Milano",
    "InstallationType": "Impianto Solare",
    "TechnicalNotes": "Installazione su tetto piano",
    "InstallerNotes": "Verificare accesso al tetto",
    "DurationMinutes": 120,
    "ScheduledStart": "2025-10-28T10:00:00Z",
    "ScheduledEnd": "2025-10-28T12:00:00Z"
  }'

echo ""
echo ""

# Test 2: Aggiornare un'installazione esistente
echo "Test 2: Aggiornamento installazione esistente"
curl -X POST "$BASE_URL/api/webhook/salesforce" \
  -H "Content-Type: application/json" \
  -d '{
    "ServiceAppointmentId": "SA-TEST-001",
    "CustomerName": "Mario",
    "CustomerSurname": "Rossi",
    "CustomerCF": "RSSMRA80A01H501Z",
    "CustomerPhone": "+39 333 1234567",
    "CustomerEmail": "mario.rossi@example.com",
    "CustomerAddress": "Via Roma 10, 20100 Milano",
    "InstallationAddress": "Via Milano 5, 20100 Milano",
    "InstallationType": "Impianto Solare - Aggiornato",
    "TechnicalNotes": "Installazione su tetto piano - Aggiornato",
    "InstallerNotes": "Verificare accesso al tetto - Aggiornato",
    "DurationMinutes": 150,
    "ScheduledStart": "2025-10-28T11:00:00Z",
    "ScheduledEnd": "2025-10-28T13:30:00Z"
  }'

echo ""
echo ""

# Test 3: Webhook di test
echo "Test 3: Webhook di test"
curl -X POST "$BASE_URL/api/webhook/test" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test webhook"
  }'

echo ""
echo ""

echo "Test completato!"

