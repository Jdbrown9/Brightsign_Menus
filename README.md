# ACWMC Concession Menu Pricing

This version removes login and adds preset uploads.

## New preset feature
You can upload a file to replace all current menu items for a specific event.

Supported file types:
- .json
- .csv
- .txt

## Preset examples

### CSV or TXT
Hot Dog,$5.00
Fountain Soda,$4.00
Nachos,$7.50

### JSON
{
  "items": [
    { "name": "Hot Dog", "price": "$5.00" },
    { "name": "Fountain Soda", "price": "$4.00" }
  ]
}

Uploading a preset replaces the current items in the editor. When you publish, old feed files are deleted and new ones are created.
