from app import app

with app.test_client() as client:
    client.post('/api/patricia/init')
    resp = client.post('/api/patricia/insert', json={'key': '1000'})
    data = resp.get_json()
    print(data)
