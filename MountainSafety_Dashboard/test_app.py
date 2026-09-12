import pytest
import collections
from app import app, is_duplicate_packet, seen_message_ids, haversine_m, bearing_deg, build_alerts
import app as app_module
import json

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_csv_export_formatting(client):
    # Call api/export-log and check for proper \n characters
    response = client.get('/api/export-log')
    assert response.status_code == 200
    data = response.data.decode('utf-8')
    assert '\\n' not in data  # Phase 1 fix check
    assert '\n' in data

def test_packet_id_validation():
    # Test valid and invalid ids based on regex ^[A-Za-z0-9_-]{3,20}$
    import re
    pattern = r"^[A-Za-z0-9_-]{3,20}$"
    assert re.match(pattern, "CLIMBER01")
    assert re.match(pattern, "VALID_ID-123")
    assert not re.match(pattern, "A") # too short
    assert not re.match(pattern, "AB") # too short
    assert not re.match(pattern, "INVALID CHARS!") # bad chars
    assert not re.match(pattern, "WAY_TOO_LONG_IDENTIFIER_STRING") # too long

def test_duplicate_detection_deque():
    seen_message_ids.clear()
    assert is_duplicate_packet("TYPE:MSG,MID:123,TEXT:Hello") == False
    assert is_duplicate_packet("TYPE:MSG,MID:123,TEXT:Hello") == True
    assert isinstance(seen_message_ids, collections.deque)
    assert seen_message_ids.maxlen == 300

def test_pipe_sanitization(client, mocker):
    mocker.patch('app.queue_or_send', return_value=True)
    mocker.patch('app.find_climber', return_value={"id": "CLIMBER01"})
    mocker.patch('app.get_climber', return_value={"id": "CLIMBER01"})
    mocker.patch('app.save_climber')
    
    response = client.post('/api/send', json={
        "target": "CLIMBER01",
        "message": "Hello|World,Test"
    })
    
    assert response.status_code == 200
    app_module.queue_or_send.assert_called_once_with(
        "MSG|CLIMBER01|Hello World Test",
        "Hello World Test",
        "CLIMBER01"
    )

def test_distance_bearing_calculations():
    # Example coordinates
    # Columbo: 6.9271, 79.8612
    # Kandy: 7.2906, 80.6337
    dist = haversine_m(6.9271, 79.8612, 7.2906, 80.6337)
    assert 90000 < dist < 100000  # rough check for ~95km
    
    bearing = bearing_deg(6.9271, 79.8612, 7.2906, 80.6337)
    assert 50 < bearing < 80 # roughly NE

def test_alert_generation():
    climbers = [
        {"id": "C1", "display_name": "Climber 1", "sos": 1, "online": True},
        {"id": "C2", "display_name": "Climber 2", "online": False, "seconds_since": 30},
        {"id": "C3", "display_name": "Climber 3", "gps_fix": 0, "has_last_known": 1, "last_known_age_s": 50, "online": True},
        {"id": "C4", "display_name": "Climber 4", "battery": 15, "online": True},
    ]
    alerts = build_alerts(climbers)
    
    assert any(a["id"] == "C1" and a["level"] == "CRITICAL" for a in alerts)
    assert any(a["id"] == "C2" and a["level"] == "WARNING" for a in alerts)
    assert any(a["id"] == "C3" and a["level"] == "WARNING" and "GPS" in a["text"] for a in alerts)
    assert any(a["id"] == "C4" and a["level"] == "WARNING" and "battery" in a["text"].lower() for a in alerts)