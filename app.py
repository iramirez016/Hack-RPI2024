from flask import Flask, jsonify
from flask_cors import CORS

# Import your existing IP functions
def getIP():
    import requests
    publicIp = requests.get("https://api64.ipify.org?format=json").json()["ip"]
    return publicIp

def getIPMetaData():
    import requests
    try:
        response = requests.get("https://ipinfo.io/json")
        if response.status_code == 200:
            metadata = response.json()
            return metadata
        else:
            print("Failed to retrieve IP metadata")
            return None
    except requests.RequestException as e:
        print(f"An error occurred: {e}")
        return None

def getLocation():
    ipMetadata = getIPMetaData()
    return ipMetadata.get("loc")

# Set up Flask app
app = Flask(__name__)
CORS(app)

@app.route('/api/location')
def get_location_data():
    try:
        location = getLocation()
        return jsonify({
            'loc': location
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)