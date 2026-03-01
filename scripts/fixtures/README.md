# M6 Test Fixtures

This directory contains synthetic contract files for testing the M6 AI pipeline.

## Files (Do NOT commit real contracts)

- `sample-contract.pdf` - PDF with selectable text containing various risk clauses
- `sample-contract.docx` - DOCX with headings and tables for testing parsing
- `scanned.pdf` - Scanned PDF with no extractable text (should fail parsing)

## Adding Test Fixtures

Create synthetic contracts that test specific scenarios:

1. **Normal contracts** with various risk types (liability, termination, etc.)
2. **Edge cases** like extremely long contracts, unusual formatting
3. **Error cases** like scanned PDFs, corrupted files

## Security Notice

⚠️ **NEVER commit real contracts** to this repository. All fixtures should be synthetic/test data only.
