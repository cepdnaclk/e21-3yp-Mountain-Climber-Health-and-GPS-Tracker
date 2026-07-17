"""
test_climber_functions.py

Week 6 test suite for CO328 Group 23 (Mountain Climber IoT Safety Tracking
System). Covers 4 critical functions using equivalence partitioning,
boundary value analysis, and error/negative case testing, as required by
the Week 6 worksheet.

Run with:  pytest --maxfail=1 --disable-warnings -q
"""

import pytest
from climber_functions import (
    haversine_m,
    is_duplicate_packet,
    build_alerts,
    accept_point,
)


# ===========================================================================
# 1. haversine_m
#    Owner: Jayasundara J.M.S.D.B. (E/21/198)
#    External dependency: none (pure math) - nothing to mock
# ===========================================================================
class TestHaversineM:
    # --- Equivalence classes ---
    def test_equivalence_same_point_returns_zero(self):
        assert haversine_m(7.253061, 80.592154, 7.253061, 80.592154) == 0.0

    def test_equivalence_known_short_distance(self):
        # Two points about 1km apart (roughly, near Kandy/Peradeniya area)
        d = haversine_m(7.253061, 80.592154, 7.262000, 80.592154)
        assert 900 < d < 1100

    def test_equivalence_opposite_hemispheres(self):
        d = haversine_m(45.0, 90.0, -45.0, -90.0)
        assert d > 10_000_000  # should be close to half the Earth's circumference

    # --- Boundary value analysis (the (0,0) sentinel boundary) ---
    def test_boundary_first_point_is_zero_sentinel(self):
        assert haversine_m(0, 0, 7.25, 80.59) == 0.0

    def test_boundary_second_point_is_zero_sentinel(self):
        assert haversine_m(7.25, 80.59, 0, 0) == 0.0

    def test_boundary_just_off_zero_sentinel(self):
        # 0.0001 deg is NOT the sentinel and should compute a real (tiny) distance
        d = haversine_m(0.0001, 0.0001, 0.0002, 0.0002)
        assert d > 0.0

    def test_boundary_max_latitude_pole(self):
        # North pole boundary should not raise, even though it's an edge case
        d = haversine_m(90.0, 0.0, 89.9, 0.0)
        assert d > 0.0

    # --- Error / negative cases ---
    def test_error_none_latitude_raises(self):
        with pytest.raises(ValueError):
            haversine_m(None, 80.59, 7.25, 80.59)

    def test_error_string_longitude_raises(self):
        with pytest.raises(ValueError):
            haversine_m(7.25, "not-a-number", 7.26, 80.59)

    def test_error_boolean_input_rejected(self):
        # bool is a subclass of int in Python; must not silently pass as a coordinate
        with pytest.raises(ValueError):
            haversine_m(True, 80.59, 7.26, 80.59)


# ===========================================================================
# 2. is_duplicate_packet
#    Owner: Sandeep Y.P. (E/21/353)
#    External dependency: seen-id cache (module-level set in the real code).
#    Mocked/stubbed here by passing the cache set explicitly as `seen_ids`,
#    so the test does not depend on global state or real LoRa packets.
# ===========================================================================
class TestIsDuplicatePacket:
    # --- Equivalence classes ---
    def test_equivalence_new_id_not_duplicate(self):
        dup, seen = is_duplicate_packet("TYPE:MSG,MID:1001,TEXT:hi", set())
        assert dup is False
        assert "1001" in seen

    def test_equivalence_repeated_id_is_duplicate(self):
        dup, seen = is_duplicate_packet("TYPE:SOS,MID:2002", {"2002"})
        assert dup is True

    def test_equivalence_no_mid_field_never_flagged(self):
        # No MID field at all -> cannot dedupe, treated as not-a-duplicate
        dup, seen = is_duplicate_packet("TYPE:MSG,TEXT:hello", set())
        assert dup is False

    # --- Boundary value analysis (cache size limit) ---
    def test_boundary_cache_just_under_limit_keeps_entries(self):
        seen = {str(i) for i in range(299)}
        dup, new_seen = is_duplicate_packet("MID:299", seen, max_cache=300)
        assert dup is False
        assert len(new_seen) == 300  # exactly at the limit, not cleared yet

    def test_boundary_cache_exactly_at_limit_clears_on_next_add(self):
        seen = {str(i) for i in range(300)}
        dup, new_seen = is_duplicate_packet("MID:301", seen, max_cache=300)
        assert dup is False
        assert new_seen == set()  # cache reset once it goes over the limit

    def test_boundary_empty_mid_value_treated_as_no_id(self):
        dup, seen = is_duplicate_packet("TYPE:MSG,MID:,TEXT:hi", set())
        assert dup is False

    # --- Error / negative cases ---
    def test_error_none_packet_raises(self):
        with pytest.raises(TypeError):
            is_duplicate_packet(None, set())

    def test_error_non_string_packet_raises(self):
        with pytest.raises(TypeError):
            is_duplicate_packet(12345, set())

    def test_error_seen_ids_not_a_set_raises(self):
        with pytest.raises(TypeError):
            is_duplicate_packet("MID:1", ["1", "2"])


# ===========================================================================
# 3. build_alerts
#    Owner: Rathnayaka R.M.P.M. (E/21/328)
#    External dependency: none directly, but in the real app this is fed by
#    live climber state coming from the serial/LoRa reader thread. That
#    thread is stubbed out here by constructing climber dicts by hand.
# ===========================================================================
def climber(**overrides):
    base = {
        "id": "CLIMBER01",
        "online": True,
        "seconds_since": 2,
        "sos": 0,
        "gps_fix": 1,
        "has_last_known": 0,
        "last_known_age_s": 0,
        "battery": 80,
        "armband_battery": 80,
        "ble": 1,
    }
    base.update(overrides)
    return base


class TestBuildAlerts:
    # --- Equivalence classes ---
    def test_equivalence_healthy_climber_no_alerts(self):
        assert build_alerts([climber()]) == []

    def test_equivalence_sos_generates_critical_alert(self):
        alerts = build_alerts([climber(sos=1)])
        assert any(a["level"] == "CRITICAL" and "SOS" in a["text"] for a in alerts)

    def test_equivalence_offline_generates_warning(self):
        alerts = build_alerts([climber(online=False)])
        assert any("offline" in a["text"].lower() for a in alerts)

    def test_equivalence_no_gps_and_no_last_known_is_critical(self):
        alerts = build_alerts([climber(gps_fix=0, has_last_known=0)])
        assert any(a["level"] == "CRITICAL" and "GPS" in a["text"] for a in alerts)

    # --- Boundary value analysis (battery low-threshold at 20%) ---
    def test_boundary_battery_19_is_low(self):
        alerts = build_alerts([climber(battery=19)])
        assert any("Main battery low" in a["text"] for a in alerts)

    def test_boundary_battery_20_is_not_low(self):
        alerts = build_alerts([climber(battery=20)])
        assert not any("Main battery low" in a["text"] for a in alerts)

    def test_boundary_battery_zero_is_low(self):
        # This is the gap found during testing: battery=0 must still alert
        alerts = build_alerts([climber(battery=0)])
        assert any("Main battery low" in a["text"] for a in alerts)

    def test_boundary_armband_battery_only_alerts_when_connected(self):
        alerts = build_alerts([climber(armband_battery=5, ble=0)])
        assert not any("Armband battery low" in a["text"] for a in alerts)

    # --- Error / negative cases ---
    def test_error_none_list_raises(self):
        with pytest.raises(TypeError):
            build_alerts(None)

    def test_error_list_of_non_dicts_raises(self):
        with pytest.raises(TypeError):
            build_alerts(["not-a-dict"])

    def test_error_empty_list_returns_empty_alerts(self):
        # Empty input is valid (no climbers connected yet), not an error
        assert build_alerts([]) == []


# ===========================================================================
# 4. accept_point  (mirrors acceptPoint() in c3.ino, climber main node)
#    Owner: Jayasundara J.M.S.D.B. (E/21/198) / Sandeep Y.P. (E/21/353)
#    (shared - GPS filter feeds both the distance calc and the dedupe/path
#    logic, so it is reviewed jointly)
#    External dependency: TinyGPSPlus hardware object. Stubbed here by
#    passing a plain `state` dict instead of reading a live GPS module.
# ===========================================================================
def gps_state(**overrides):
    base = {"has_last": True, "lat": 7.25, "lon": 80.59, "sats": 8, "hdop": 1.0,
            "ms_since_last_fix": 0}
    base.update(overrides)
    return base


class TestAcceptPoint:
    # --- Equivalence classes ---
    def test_equivalence_first_fix_always_accepted(self):
        state = gps_state(has_last=False, lat=0, lon=0)
        ok, reason = accept_point(7.30, 80.60, "NEO6M", state)
        assert ok is True and reason == "OK"

    def test_equivalence_good_fix_with_real_movement_accepted(self):
        # 220m move, but far enough past the last fix that it isn't a JUMP
        state = gps_state(lat=7.2500, lon=80.5900, ms_since_last_fix=20000)
        ok, reason = accept_point(7.2520, 80.5900, "NEO6M", state)
        assert ok is True

    def test_equivalence_sudden_jump_soon_after_last_fix_rejected(self):
        # Same 220m move, but reported almost immediately after the last fix
        # -> looks like a GPS glitch rather than real climber movement
        state = gps_state(lat=7.2500, lon=80.5900, ms_since_last_fix=500)
        ok, reason = accept_point(7.2520, 80.5900, "NEO6M", state)
        assert ok is False and reason == "JUMP"

    def test_equivalence_phone_source_skips_satellite_check(self):
        state = gps_state(sats=0, hdop=99.0, lat=7.2500, lon=80.5900)
        ok, reason = accept_point(7.2600, 80.6000, "PHONE", state)
        assert ok is True

    # --- Boundary value analysis (MIN_SAT = 5) ---
    def test_boundary_sats_just_below_minimum_rejected(self):
        state = gps_state(sats=4)
        ok, reason = accept_point(7.30, 80.60, "NEO6M", state)
        assert ok is False and reason == "LOW_SATS"

    def test_boundary_sats_exactly_at_minimum_accepted(self):
        state = gps_state(sats=5, has_last=False, lat=0, lon=0)
        ok, reason = accept_point(7.30, 80.60, "NEO6M", state)
        assert ok is True

    # --- Boundary value analysis (MAX_HDOP = 3.0) ---
    def test_boundary_hdop_just_above_max_rejected(self):
        state = gps_state(hdop=3.01)
        ok, reason = accept_point(7.30, 80.60, "NEO6M", state)
        assert ok is False and reason == "BAD_HDOP"

    def test_boundary_hdop_exactly_at_max_accepted(self):
        state = gps_state(hdop=3.0, has_last=False, lat=0, lon=0)
        ok, reason = accept_point(7.30, 80.60, "NEO6M", state)
        assert ok is True

    # --- Boundary value analysis (MIN_MOVE_M jitter = 12.0) ---
    def test_boundary_movement_just_under_jitter_threshold_rejected(self):
        # ~5m move, well under 12m -> jitter, must reject
        state = gps_state(lat=7.250000, lon=80.590000)
        ok, reason = accept_point(7.250004, 80.590000, "NEO6M", state)
        assert ok is False and reason == "JITTER"

    def test_boundary_movement_well_over_jitter_threshold_accepted(self):
        state = gps_state(lat=7.250000, lon=80.590000, ms_since_last_fix=20000)
        ok, reason = accept_point(7.251000, 80.590000, "NEO6M", state)  # ~111m
        assert ok is True

    # --- Error / negative cases ---
    def test_error_zero_lat_rejected_not_raised(self):
        ok, reason = accept_point(0, 80.60, "NEO6M", gps_state())
        assert ok is False and reason == "ZERO_COORD"

    def test_error_invalid_source_raises(self):
        with pytest.raises(ValueError):
            accept_point(7.30, 80.60, "BLUETOOTH", gps_state())

    def test_error_none_coordinates_raise(self):
        with pytest.raises(ValueError):
            accept_point(None, 80.60, "NEO6M", gps_state())
