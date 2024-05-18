from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/accounts', methods=['GET'])
def get_accounts():
    # Dummy data to illustrate API functionality
    accounts = [
        {"id": 1, "name": "Account A", "balance": 1200},
        {"id": 2, "name": "Account B", "balance": 1500}
    ]
    return jsonify(accounts)

if __name__ == '__main__':
    app.run(debug=True)
