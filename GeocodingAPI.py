import googlemaps
import json
from datetime import datetime

# Initialize the Google Maps client
gmaps = googlemaps.Client(key='AIzaSyAwTD3-V30SQKb9tmM7UyVhx_ron9jcH5s')  # Replace with your actual API key

# Reverse geocode to get place_id
reverse_geocode_result = gmaps.reverse_geocode((40.714224, -73.961452))
place_id = reverse_geocode_result[0]['place_id']

# Fetch detailed information using place_id
place_details = gmaps.place(place_id=place_id)

# Save place_details to a text file
with open("place_details.txt", "w") as file:
    json.dump(place_details, file, indent=4)  # Pretty print with an indentation of 4

print("Place details have been saved to 'place_details.txt'")

