import json
import pytest
from app.routes.ai_routes import get_best_card
import os

# Load mock data from the JSON file
with open('app/tests/data/mock_data.json') as f:
    test_data = json.load(f)

results_dir = 'tests/results'
os.makedirs(results_dir, exist_ok=True)

# Mock fetch_user_credit_cards function
def mock_fetch_user_credit_cards(user_id):
    return test_data['credit_cards']

@pytest.fixture
def transaction_cases():
    """
    Load transaction test cases from mock data.
    """
    return test_data['transactions']

# Tracking test results for analysis
test_results = []

# Unit Test for get_best_card
def test_get_best_card(transaction_cases, monkeypatch):
    """
    Test if the get_best_card endpoint returns the expected best card based on merchant and amount.
    """
    # Replace the real database fetch function with our mock
    monkeypatch.setattr('app.routes.fetch_user_credit_cards', mock_fetch_user_credit_cards)
    
    for case in transaction_cases:
        transaction_details = {
            "merchant": case['merchant'],
            "amount": case['amount']
        }
        user_id = 1  # Dummy user ID
        
        # Call the function with mock data
        result = get_best_card(transaction_details, user_id)
        
        # Verify if the expected card name is in the result
        passed = case['expected_best_card'] in result
        test_results.append({
            "merchant": case['merchant'],
            "amount": case['amount'],
            "expected_best_card": case['expected_best_card'],
            "result": result,
            "status": "Pass" if passed else "Fail"
        })
        
        assert passed, f"Failed for transaction: {case}"
    
    # After all test cases have been processed, save the test results
    # Then update the part where you save the JSON
    # Then update the part where you save the JSON
    if test_results:
        json_path = os.path.join(results_dir, 'test_results.json')
        with open(json_path, 'w') as outfile:
            json.dump(test_results, outfile, indent=4)
        print(f"\n✅ Test results saved to '{json_path}'")