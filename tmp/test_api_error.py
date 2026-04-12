import requests

# Test the comisiones endpoint and print the full response
url = "http://localhost:8000/api/comisiones"
try:
    # We might need a token, but let's try without first to see if we get 401 or 500
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error calling API: {e}")
