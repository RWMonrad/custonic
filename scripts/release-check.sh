#!/bin/bash

# Release Gate Script - Hard Rule: GREEN = SHIP
# If npm run gate is green → ship
# If not → it's not cosmetic, fix it

echo "🚀 RELEASE GATE CHECK"
echo "===================="
echo "Rule: If npm run gate is green → ship"
echo "If not: it's not cosmetic, fix it"
echo ""

# Run the gate command
echo "Running: npm run gate"
npm run gate

# Capture exit code
GATE_EXIT_CODE=$?

echo ""
echo "===================="
if [ $GATE_EXIT_CODE -eq 0 ]; then
    echo "✅ GATE PASSED - READY TO SHIP"
    echo "Release is GREEN - proceed with deployment"
else
    echo "❌ GATE FAILED - DO NOT SHIP"
    echo "Release is RED - fix all issues before shipping"
    echo "This is NOT cosmetic - blocking issues must be resolved"
    exit 1
fi

echo ""
echo "🧪 Running Release Tests (saving output)"
echo "========================================"

# Run and save test outputs
echo "Running billing tests..."
npm run test:billing > docs/release-test-billing.log 2>&1
echo "✅ Billing test output saved to docs/release-test-billing.log"

echo "Running ops tests..."
npm run test:ops > docs/release-test-ops.log 2>&1
echo "✅ Ops test output saved to docs/release-test-ops.log"

echo ""
echo "🎯 RELEASE CHECK COMPLETE"
echo "========================"
if [ $GATE_EXIT_CODE -eq 0 ]; then
    echo "✅ READY FOR PRODUCTION DEPLOYMENT"
else
    echo "❌ BLOCKED - Fix gate issues first"
fi
