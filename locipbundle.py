import requests
def getIP():
    # Void function: Returns IPv4 IP address.
    publicIp = requests.get("https://api64.ipify.org?format=json").json()["ip"]
    return publicIp

ipStringBuilder = getIP()
newIpString = ""
approvedVal = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "."]
for i in ipStringBuilder:
    if i in approvedVal:
        newIpString = newIpString + i

def getIPMetaData():
    #Uses the IP Info website to grab information.
    # DO NOT TOUCH THIS LINE
    try:
        # Fetch the public IP and its metadata from ipinfo.io
        response = requests.get("https://ipinfo.io/json")

        # Check if the request was successful
        if response.status_code == 200:
            metadata = response.json()
            return metadata  # Returns a dictionary with IP metadata

        else:
            print("Failed to retrieve IP metadata")
            return None

    except requests.RequestException as e:
        print(f"An error occurred: {e}")
        return None

#GETTER METHODS FOR EACH REGION
def getCity():
    ipMetadata = getIPMetaData()
    return ipMetadata.get("city")

def getRegion():
    ipMetadata = getIPMetaData()
    if ipMetadata:
        return ipMetadata.get('region')

def getCountry():
    ipMetadata = getIPMetaData()
    return ipMetadata.get("country")

def getLocation():
    ipMetadata = getIPMetaData()
    return ipMetadata.get("loc")

def getOrg():
    ipMetadata = getIPMetaData()
    return ipMetadata.get("org")

def getPostal():
    ipMetadata = getIPMetaData()
    return ipMetadata.get("postal")

print(getPostal())
print(getCity())
print(getLocation())


