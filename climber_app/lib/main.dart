import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:permission_handler/permission_handler.dart' as perm;
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

void main() {
  runApp(const ClimberApp());
}

// Fast timeout fixes.
const int kEspDisconnectedAfterSec = 6;
const int kArmbandLostAfterSec = 6;
const int kStatusRefreshSec = 1;
const int kGpsPostSec = 10;
const int kBleScanEverySec = 3;
const int kBleScanDurationSec = 1;

class ClimberApp extends StatelessWidget {
  const ClimberApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Climber Safety',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: Colors.red,
        scaffoldBackgroundColor: const Color(0xFFF3F4F6),
      ),
      home: const HomePage(),
    );
  }
}

class DeviceStatus {
  String id = 'CLIMBER01';

  double lat = 0;
  double lon = 0;
  double altitude = 0;

  double baseLat = 0;
  double baseLon = 0;

  double lastKnownLat = 0;
  double lastKnownLon = 0;
  int lastKnownAgeMs = 0;
  int gpsAgeMs = 0;
  int gpsSatellites = 0;
  double gpsHdop = 99.9;
  String gpsRejectReason = 'waiting';

  bool gpsCurrentFix = false;
  bool hasLastKnownLocation = false;

  double distanceToBaseM = 0;
  double bearingFromBaseDeg = 0;
  double movementBearingDeg = 0;

  String directionFromBase = 'N';
  String movementDirection = 'N';
  String gpsSource = 'NO_GPS';

  int bpm = 0;
  int battery = 0;
  int armbandBattery = 0;
  int sos = 0;
  int rssi = 0;
  double snr = 0;
  int armbandSensorStatus = 0; // Fetched from updated .INO 

  bool wifiReady = false;
  bool loraReady = false;
  bool armbandConnected = false;
  bool sensorAttached = false;

  int baseMsgSeq = 0;
  String lastBaseMessage = 'No message yet';
  String lastSentMessage = 'No message sent';

  DeviceStatus();

  DeviceStatus.fromJson(Map<String, dynamic> j) {
    id = j['id'] ?? 'CLIMBER01';

    lat = (j['lat'] ?? 0).toDouble();
    lon = (j['lon'] ?? 0).toDouble();
    altitude = (j['altitude'] ?? 0).toDouble();

    baseLat = (j['baseLat'] ?? 0).toDouble();
    baseLon = (j['baseLon'] ?? 0).toDouble();

    lastKnownLat = (j['lastKnownLat'] ?? 0).toDouble();
    lastKnownLon = (j['lastKnownLon'] ?? 0).toDouble();
    lastKnownAgeMs = j['lastKnownAgeMs'] ?? 0;
    gpsAgeMs = j['gpsAgeMs'] ?? 0;
    gpsSatellites = j['gpsSatellites'] ?? 0;
    gpsHdop = (j['gpsHdop'] ?? 99.9).toDouble();
    gpsRejectReason = j['gpsRejectReason'] ?? 'waiting';

    gpsCurrentFix = j['gpsCurrentFix'] ?? false;
    hasLastKnownLocation = j['hasLastKnownLocation'] ?? false;

    distanceToBaseM = (j['distanceToBaseM'] ?? 0).toDouble();
    bearingFromBaseDeg = (j['bearingFromBaseDeg'] ?? 0).toDouble();
    movementBearingDeg = (j['movementBearingDeg'] ?? 0).toDouble();

    directionFromBase = j['directionFromBase'] ?? 'N';
    movementDirection = j['movementDirection'] ?? 'N';
    gpsSource = j['gpsSource'] ?? 'NO_GPS';

    bpm = j['bpm'] ?? 0;
    battery = j['battery'] ?? 0;
    armbandBattery = j['armbandBattery'] ?? 0;
    sos = j['sos'] ?? 0;
    rssi = j['rssi'] ?? 0;
    snr = (j['snr'] ?? 0).toDouble();
    armbandSensorStatus = j['armbandSensorStatus'] ?? 0;

    wifiReady = j['wifiReady'] ?? false;
    loraReady = j['loraReady'] ?? false;
    armbandConnected = j['armbandConnected'] ?? false;
    sensorAttached = j['sensorAttached'] ?? false;

    baseMsgSeq = j['baseMsgSeq'] ?? 0;
    lastBaseMessage = j['lastBaseMessage'] ?? 'No message yet';
    lastSentMessage = j['lastSentMessage'] ?? 'No message sent';
  }
}

class ConversationMessage {
  final String from;
  final String text;
  final String time;

  ConversationMessage(this.from, this.text, this.time);
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final String baseUrl = 'http://192.168.4.1';
  final TextEditingController messageController = TextEditingController();

  DeviceStatus status = DeviceStatus();

  bool espConnected = false;
  bool bluetoothOn = false;
  bool armbandSeen = false;
  bool heartSensorSeen = false;
  bool locationReady = false;

  bool statusBusy = false;
  bool sendingGps = false;
  bool sendingBpm = false;
  bool sendingMessage = false;

  int phoneBpm = 0;
  int armbandBattery = 0;
  int lastPostedBpm = -1;
  int failCount = 0;
  int lastSeenBaseSeq = -1;
  String lastShownBaseMessage = '';

  double phoneLat = 0;
  double phoneLon = 0;
  double phoneAlt = 0;

  DateTime lastSuccessfulEsp = DateTime.fromMillisecondsSinceEpoch(0);
  DateTime lastGpsPostTime = DateTime.fromMillisecondsSinceEpoch(0);
  DateTime lastBpmPostTime = DateTime.fromMillisecondsSinceEpoch(0);
  DateTime lastArmbandSeen = DateTime.fromMillisecondsSinceEpoch(0);

  String infoText = 'Starting...';

  final List<ConversationMessage> conversation = [];

  Timer? statusTimer;
  Timer? gpsTimer;
  Timer? bleTimer;
  Timer? watchdogTimer;

  StreamSubscription<List<ScanResult>>? scanSubscription;
  StreamSubscription<BluetoothAdapterState>? bluetoothSubscription;
  
  BluetoothDevice? connectedArmband;
  StreamSubscription<List<int>>? charSubscription;
  StreamSubscription<BluetoothConnectionState>? connectionSubscription;

  @override
  void initState() {
    super.initState();
    startApp();
  }

  Future<void> startApp() async {
    await requestPermissions();
    await prepareLocation();

    bluetoothSubscription = FlutterBluePlus.adapterState.listen((state) {
      bluetoothOn = state == BluetoothAdapterState.on;
      if (bluetoothOn) {
        scanForArmband();
      } else {
        clearArmband();
      }
      if (mounted) setState(() {});
    });

    scanSubscription = FlutterBluePlus.scanResults.listen(handleScanResults);

    await updatePhoneGps();
    await postGpsToEsp32();
    await fetchStatus();

    statusTimer = Timer.periodic(const Duration(seconds: kStatusRefreshSec), (_) => fetchStatus());

    gpsTimer = Timer.periodic(const Duration(seconds: kGpsPostSec), (_) async {
      await updatePhoneGps();
      await postGpsToEsp32();
    });

    bleTimer = Timer.periodic(const Duration(seconds: kBleScanEverySec), (_) => scanForArmband());

    watchdogTimer = Timer.periodic(const Duration(seconds: 1), (_) => runWatchdog());
  }

  Future<void> requestPermissions() async {
    await [
      perm.Permission.bluetoothScan,
      perm.Permission.bluetoothConnect,
      perm.Permission.locationWhenInUse,
    ].request();
  }

  Future<void> prepareLocation() async {
    final enabled = await Geolocator.isLocationServiceEnabled();
    if (!enabled) {
      locationReady = false;
      infoText = 'Phone GPS is OFF';
      return;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    locationReady = permission == LocationPermission.always ||
        permission == LocationPermission.whileInUse;
  }

  void runWatchdog() {
    final now = DateTime.now();
    bool changed = false;

    if (espConnected &&
        now.difference(lastSuccessfulEsp).inSeconds > kEspDisconnectedAfterSec) {
      espConnected = false;
      infoText = 'Disconnected from climber ESP32 Wi-Fi';
      changed = true;
    }

    if (armbandSeen &&
        now.difference(lastArmbandSeen).inSeconds > kArmbandLostAfterSec) {
      clearArmband();
      postBpmToEsp32(force: true);
      changed = true;
    }

    if (changed && mounted) setState(() {});
  }

  void clearArmband() {
    connectedArmband?.disconnect();
    connectedArmband = null;
    armbandSeen = false;
    heartSensorSeen = false;
    phoneBpm = 0;
    armbandBattery = 0;
  }

  Future<void> updatePhoneGps() async {
    if (!locationReady || sendingMessage) return;

    try {
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 3),
        ),
      );

      phoneLat = pos.latitude;
      phoneLon = pos.longitude;
      phoneAlt = pos.altitude;

      if (mounted) setState(() {});
    } catch (_) {
      try {
        final pos = await Geolocator.getLastKnownPosition();
        if (pos != null) {
          phoneLat = pos.latitude;
          phoneLon = pos.longitude;
          phoneAlt = pos.altitude;
          if (mounted) setState(() {});
        }
      } catch (_) {}
    }
  }

  Future<void> postGpsToEsp32() async {
    if (sendingGps || sendingMessage || statusBusy) return;
    if (phoneLat == 0 || phoneLon == 0) return;

    sendingGps = true;

    try {
      final res = await http
          .post(
            Uri.parse('$baseUrl/gps'),
            headers: {'Content-Type': 'application/json', 'Connection': 'close'},
            body: jsonEncode({'lat': phoneLat, 'lon': phoneLon, 'alt': phoneAlt}),
          )
          .timeout(const Duration(milliseconds: 900));

      if (res.statusCode == 200) {
        lastGpsPostTime = DateTime.now();
        lastSuccessfulEsp = DateTime.now();
        espConnected = true;
        failCount = 0;
      }
    } catch (_) {}

    sendingGps = false;
  }

  Future<void> scanForArmband() async {
    if (!bluetoothOn) return;
    if (connectedArmband != null) return;

    try {
      await FlutterBluePlus.stopScan();
      await FlutterBluePlus.startScan(
        timeout: const Duration(seconds: kBleScanDurationSec),
        androidUsesFineLocation: true,
      );
    } catch (_) {}
  }

  void handleScanResults(List<ScanResult> results) {
    if (connectedArmband != null) return;

    for (final r in results) {
      final advName = r.advertisementData.advName;
      final platformName = r.device.platformName;
      final name = advName.isNotEmpty ? advName : platformName;

      if (name == 'CLIMBER_ARMBAND') {
        FlutterBluePlus.stopScan();
        connectToArmband(r.device);
        break;
      }
    }
  }

  Future<void> connectToArmband(BluetoothDevice device) async {
    try {
      connectedArmband = device;
      await device.connect(autoConnect: false);

      connectionSubscription?.cancel();
      connectionSubscription = device.connectionState.listen((state) {
        if (state == BluetoothConnectionState.disconnected) {
          clearArmband();
          postBpmToEsp32(force: true);
          if (mounted) setState(() {});
        }
      });

      List<BluetoothService> services = await device.discoverServices();
      for (BluetoothService service in services) {
        if (service.uuid.toString() == '6c1d0001-7f4a-4b2d-9c21-5a7d3e110001') {
          for (BluetoothCharacteristic c in service.characteristics) {
            if (c.uuid.toString() == '6c1d0002-7f4a-4b2d-9c21-5a7d3e110001') {
              charSubscription?.cancel();
              charSubscription = c.onValueReceived.listen((value) {
                if (value.isNotEmpty) {
                  parseArmbandData(value);
                }
              });
              await c.setNotifyValue(true);
            }
          }
        }
      }
    } catch (e) {
      clearArmband();
    }
  }

  void parseArmbandData(List<int> bytes) {
    final text = utf8.decode(bytes, allowMalformed: true);

    final bpmMatch = RegExp(r'H:(\d+)').firstMatch(text);
    final sensorMatch = RegExp(r'S:(\d+)').firstMatch(text);
    final batMatch = RegExp(r'B:(\d+)').firstMatch(text);

    armbandSeen = true;
    lastArmbandSeen = DateTime.now();

    phoneBpm = bpmMatch != null ? (int.tryParse(bpmMatch.group(1) ?? '0') ?? 0) : 0;
    heartSensorSeen = sensorMatch != null ? (int.tryParse(sensorMatch.group(1) ?? '0') == 1) : false;
    armbandBattery = batMatch != null ? (int.tryParse(batMatch.group(1) ?? '0') ?? 0) : 0;

    maybePostBpmToEsp32();
    if (mounted) setState(() {});
  }

  void maybePostBpmToEsp32() {
    final now = DateTime.now();

    if (phoneBpm == lastPostedBpm &&
        now.difference(lastBpmPostTime).inSeconds < 5) {
      return;
    }

    postBpmToEsp32();
  }

  Future<void> postBpmToEsp32({bool force = false}) async {
    if (sendingBpm || sendingMessage || statusBusy) return;

    if (!force &&
        phoneBpm == lastPostedBpm &&
        DateTime.now().difference(lastBpmPostTime).inSeconds < 5) {
      return;
    }

    sendingBpm = true;

    try {
      final res = await http
          .post(
            Uri.parse('$baseUrl/bpm'),
            headers: {'Content-Type': 'application/json', 'Connection': 'close'},
            body: jsonEncode({
              'bpm': armbandSeen ? phoneBpm : 0,
              'arm': armbandSeen ? 1 : 0,
              'sensor': heartSensorSeen ? 1 : 0,
              'abat': armbandSeen ? armbandBattery : 0,
            }),
          )
          .timeout(const Duration(milliseconds: 900));

      if (res.statusCode == 200) {
        lastBpmPostTime = DateTime.now();
        lastPostedBpm = phoneBpm;
        lastSuccessfulEsp = DateTime.now();
        espConnected = true;
        failCount = 0;
      }
    } catch (_) {}

    sendingBpm = false;
  }

  Future<void> fetchStatus() async {
    if (statusBusy || sendingMessage) return;
    statusBusy = true;

    try {
      final res = await http
          .get(
            Uri.parse('$baseUrl/status'),
            headers: {'Connection': 'close', 'Cache-Control': 'no-cache'},
          )
          .timeout(const Duration(milliseconds: 900));

      if (res.statusCode != 200) {
        markFailure('ESP32 HTTP error');
        statusBusy = false;
        return;
      }

      status = DeviceStatus.fromJson(jsonDecode(res.body));
      espConnected = true;
      failCount = 0;
      lastSuccessfulEsp = DateTime.now();

      // Standardizing dashboard terminology
      if (status.gpsCurrentFix) {
        infoText = status.gpsSource == 'NEO6M'
            ? 'NEO-6M GPS Tracking Active.'
            : 'Phone GPS Fallback Active.';
      } else if (status.hasLastKnownLocation) {
        infoText = 'NO GPS FIX. Showing last known location.';
      } else {
        infoText = 'NO GPS FIX. Waiting for NEO-6M or phone GPS.';
      }

      checkBaseMessage();

      if (mounted) setState(() {});
    } catch (_) {
      markFailure('Waiting for ESP32 response...');
    }

    statusBusy = false;
  }

  void checkBaseMessage() {
    final msg = status.lastBaseMessage.trim();
    if (msg.isEmpty || msg == 'No message yet') return;

    final isNewSeq = status.baseMsgSeq != lastSeenBaseSeq;
    final isNewText = msg != lastShownBaseMessage;

    if (!isNewSeq && !isNewText) return;

    lastSeenBaseSeq = status.baseMsgSeq;
    lastShownBaseMessage = msg;

    addConversation('Base', msg);
  }

  void markFailure(String msg) {
    failCount++;

    final sec = DateTime.now().difference(lastSuccessfulEsp).inSeconds;

    if (failCount >= 2 && sec > kEspDisconnectedAfterSec) {
      espConnected = false;
      infoText = msg;

      if (mounted) setState(() {});
    }
  }

  Future<bool> postToEsp32(String endpoint, Map<String, dynamic> body) async {
    try {
      final res = await http
          .post(
            Uri.parse('$baseUrl/$endpoint'),
            headers: {'Content-Type': 'application/json', 'Connection': 'close'},
            body: jsonEncode(body),
          )
          .timeout(const Duration(milliseconds: 1200));

      if (res.statusCode == 200) {
        failCount = 0;
        espConnected = true;
        lastSuccessfulEsp = DateTime.now();
        return true;
      }
    } catch (_) {}

    return false;
  }

  void addConversation(String from, String text) {
    final now = DateTime.now();
    final hh = now.hour.toString().padLeft(2, '0');
    final mm = now.minute.toString().padLeft(2, '0');

    conversation.add(ConversationMessage(from, text, '$hh:$mm'));

    while (conversation.length > 5) {
      conversation.removeAt(0);
    }
  }

  Future<void> sendQuickMessage(String text) async {
    if (sendingMessage) return;
    messageController.text = text;
    await sendMessage();
  }

  Future<void> sendMessage() async {
    final text = messageController.text.trim();
    if (text.isEmpty || sendingMessage) return;

    sendingMessage = true;
    messageController.clear();

    addConversation('Me', text);
    infoText = 'Sending message...';

    if (mounted) setState(() {});

    final ok = await postToEsp32('send', {'message': text});
    infoText = ok ? 'Message queued' : 'Message failed';
    sendingMessage = false;

    Future.delayed(const Duration(seconds: 1), fetchStatus);
    if (mounted) setState(() {});
  }

  Future<void> sendSos() async {
    if (sendingMessage) return;

    sendingMessage = true;
    addConversation('Me', 'SOS EMERGENCY');
    infoText = 'Sending SOS...';

    if (mounted) setState(() {});

    final ok = await postToEsp32('sos', {});
    infoText = ok ? 'SOS queued' : 'SOS failed';
    sendingMessage = false;

    Future.delayed(const Duration(seconds: 1), fetchStatus);
    if (mounted) setState(() {});
  }

  Future<void> clearSos() async {
    if (sendingMessage) return;

    sendingMessage = true;
    addConversation('Me', 'SOS CLEARED');
    infoText = 'Clearing SOS...';

    if (mounted) setState(() {});

    final ok = await postToEsp32('clear-sos', {});
    infoText = ok ? 'Clear SOS queued' : 'Clear SOS failed';
    sendingMessage = false;

    Future.delayed(const Duration(seconds: 1), fetchStatus);
    if (mounted) setState(() {});
  }

  String formatDistance(double meters) {
    if (meters <= 0) return '0 m';
    if (meters < 1000) return '${meters.toStringAsFixed(1)} m';
    return '${(meters / 1000).toStringAsFixed(2)} km';
  }

  Color statusColor() {
    if (!espConnected) return const Color(0xFF6B7280);
    if (status.sos == 1) return const Color(0xFFDC2626);
    if (!status.gpsCurrentFix && status.hasLastKnownLocation) {
      return const Color(0xFFF97316);
    }
    if (!status.gpsCurrentFix) return const Color(0xFFDC2626);
    return const Color(0xFF16A34A);
  }

  String mainStatusText() {
    if (!espConnected) return 'DISCONNECTED';
    if (status.sos == 1) return 'SOS ACTIVE';
    if (!status.gpsCurrentFix && status.hasLastKnownLocation) return 'LAST KNOWN';
    if (!status.gpsCurrentFix) return 'NO GPS FIX';
    return 'SAFE';
  }
  
  // Dashboard terminology sync for Sensor
  String getSensorStatusText() {
    if (!armbandSeen) return 'Disconnected';
    if (status.armbandSensorStatus == 1) return 'Measuring';
    if (status.armbandSensorStatus == 2) return 'No Finger detected';
    return 'Detached';
  }

  @override
  void dispose() {
    statusTimer?.cancel();
    gpsTimer?.cancel();
    bleTimer?.cancel();
    watchdogTimer?.cancel();
    scanSubscription?.cancel();
    bluetoothSubscription?.cancel();
    
    charSubscription?.cancel();
    connectionSubscription?.cancel();
    connectedArmband?.disconnect();
    
    messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final shownBpm = status.bpm != 0 ? status.bpm : phoneBpm;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Climber Safety'),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await updatePhoneGps();
          await postGpsToEsp32();
          await fetchStatus();
          await scanForArmband();
        },
        child: ListView(
          padding: const EdgeInsets.all(14),
          children: [
            statusPanel(),
            const SizedBox(height: 12),
            simpleGrid([
              item('Distance', formatDistance(status.distanceToBaseM), Icons.route),
              item('From Base', status.directionFromBase, Icons.explore),
              item('GPS', status.gpsSource, Icons.gps_fixed),
              item('LoRa', status.loraReady ? 'OK' : 'FAIL', Icons.sensors),
              item('Main Batt', '${status.battery}%', Icons.battery_full),
              item('Arm Batt', '${status.armbandBattery}%', Icons.watch),
            ]),
            const SizedBox(height: 12),
            mapPanel(),
            const SizedBox(height: 12),
            gpsPanel(),
            const SizedBox(height: 12),
            healthPanel(shownBpm),
            const SizedBox(height: 12),
            conversationPanel(),
            const SizedBox(height: 12),
            messagePanel(),
            const SizedBox(height: 12),
            sosPanel(),
            const SizedBox(height: 12),
            devicePanel(),
          ],
        ),
      ),
    );
  }

  Widget statusPanel() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: statusColor(),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        children: [
          Text(
            mainStatusText(),
            style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          Text(
            infoText,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white),
          ),
          const SizedBox(height: 10),
          Text(
            '${formatDistance(status.distanceToBaseM)} ${status.directionFromBase} from base',
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  // --- NEW LEAFLET OFFLINE MAP INTEGRATION ---
  Widget mapPanel() {
    final displayLat = status.gpsCurrentFix ? status.lat : (status.hasLastKnownLocation ? status.lastKnownLat : status.baseLat);
    final displayLon = status.gpsCurrentFix ? status.lon : (status.hasLastKnownLocation ? status.lastKnownLon : status.baseLon);
    
    // Fallback coordinates if absolutely everything is zero
    final mapLat = displayLat != 0 ? displayLat : 7.253061; 
    final mapLon = displayLon != 0 ? displayLon : 80.592154;

    return section(
      title: 'GPS Map (Leaflet)',
      icon: Icons.map,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: SizedBox(
            height: 260,
            width: double.infinity,
            child: FlutterMap(
              options: MapOptions(
                initialCenter: LatLng(mapLat, mapLon),
                initialZoom: 15.0,
              ),
              children: [
                TileLayer(
                  // To use strict offline mode, change this to an AssetTileProvider pointing to your .mbtiles
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.climber.app',
                ),
                PolylineLayer(
                  polylines: [
                    if (status.baseLat != 0 && status.baseLon != 0 && displayLat != 0 && displayLon != 0)
                      Polyline(
                        points: [
                          LatLng(status.baseLat, status.baseLon),
                          LatLng(displayLat, displayLon)
                        ],
                        color: Colors.blueGrey,
                        strokeWidth: 3.0,
                        isDotted: true,
                      )
                  ]
                ),
                MarkerLayer(
                  markers: [
                    if (status.baseLat != 0 && status.baseLon != 0)
                      Marker(
                        width: 40.0,
                        height: 40.0,
                        point: LatLng(status.baseLat, status.baseLon),
                        child: const Icon(Icons.home, color: Colors.blue, size: 36),
                      ),
                    if (displayLat != 0 && displayLon != 0)
                      Marker(
                        width: 40.0,
                        height: 40.0,
                        point: LatLng(displayLat, displayLon),
                        child: Icon(
                          Icons.person_pin_circle, 
                          color: status.gpsCurrentFix ? Colors.green : Colors.orange, 
                          size: 36
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
        row('Point B (Home)', 'Basecamp'),
        row('Point C (Pin)', status.gpsCurrentFix ? 'Current climber' : 'Last known climber'),
      ],
    );
  }

  Widget gpsPanel() {
    final displayLat = status.gpsCurrentFix ? status.lat : status.lastKnownLat;
    final displayLon = status.gpsCurrentFix ? status.lon : status.lastKnownLon;

    return section(
      title: 'GPS Tracking',
      icon: Icons.gps_fixed,
      children: [
        row('GPS Source', status.gpsSource),
        row('GPS Fix', status.gpsCurrentFix ? 'Fix Acquired' : 'No Fix'),
        row('GPS Age', '${(status.gpsAgeMs / 1000).round()} s'),
        row('Satellites', status.gpsSatellites.toString()),
        row('HDOP', status.gpsHdop.toStringAsFixed(1)),
        row('GPS Filter', status.gpsRejectReason),
        row('Last Known', status.hasLastKnownLocation ? 'Available' : 'None'),
        row('Last Known Age', '${(status.lastKnownAgeMs / 1000).round()} s'),
        row('Phone GPS Fallback', locationReady ? 'Ready' : 'Not ready'),
        row('Basecamp', '${status.baseLat.toStringAsFixed(6)}, ${status.baseLon.toStringAsFixed(6)}'),
        row('Climber', '${displayLat.toStringAsFixed(6)}, ${displayLon.toStringAsFixed(6)}'),
        row('Altitude', '${status.altitude.toStringAsFixed(1)} m'),
      ],
    );
  }

  Widget healthPanel(int shownBpm) {
    return section(
      title: 'Health + Armband',
      icon: Icons.favorite,
      children: [
        row('Bluetooth', bluetoothOn ? 'ON' : 'OFF'),
        row('Armband Status', armbandSeen ? 'Connected' : 'Disconnected'),
        row('Last Armband Seen', armbandSeen ? 'now' : 'not active'),
        row('Heart Sensor', getSensorStatusText()),
        row('BPM', shownBpm.toString()),
        row('Armband Battery', '${status.armbandBattery}%'),
      ],
    );
  }

  Widget conversationPanel() {
    return section(
      title: 'Conversation',
      icon: Icons.forum,
      children: [
        if (conversation.isEmpty)
          const Text('No conversation yet', style: TextStyle(color: Color(0xFF64748B)))
        else
          ...conversation.map((m) {
            final isMe = m.from == 'Me';
            return Container(
              width: double.infinity,
              margin: const EdgeInsets.symmetric(vertical: 4),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isMe ? const Color(0xFFFFE4E6) : const Color(0xFFDBEAFE),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '${m.from} • ${m.time}\n${m.text}',
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
            );
          }),
      ],
    );
  }

  Widget messagePanel() {
    return section(
      title: 'Send Message',
      icon: Icons.send,
      children: [
        const Text('Quick messages', style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            quickChip('I am OK'),
            quickChip('Need help'),
            quickChip('Injured'),
            quickChip('Lost path'),
            quickChip('Low battery'),
            quickChip('Returning to base'),
            quickChip('Reached checkpoint'),
          ],
        ),
        const SizedBox(height: 12),
        TextField(
          controller: messageController,
          maxLength: 120,
          enabled: !sendingMessage,
          decoration: const InputDecoration(
            labelText: 'Message to basecamp',
            border: OutlineInputBorder(),
          ),
        ),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: FilledButton.icon(
            onPressed: sendingMessage ? null : sendMessage,
            icon: const Icon(Icons.send),
            label: Text(sendingMessage ? 'Sending...' : 'Send'),
          ),
        ),
        const SizedBox(height: 8),
        row('Last base message', status.lastBaseMessage),
      ],
    );
  }

  Widget quickChip(String text) {
    return ActionChip(
      label: Text(text, overflow: TextOverflow.ellipsis),
      onPressed: sendingMessage ? null : () => sendQuickMessage(text),
      avatar: const Icon(Icons.flash_on, size: 18),
    );
  }

  Widget sosPanel() {
    return Column(
      children: [
        SizedBox(
          height: 56,
          width: double.infinity,
          child: FilledButton.icon(
            onPressed: sendingMessage ? null : sendSos,
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
            ),
            icon: const Icon(Icons.warning),
            label: const Text('SEND SOS'),
          ),
        ),
        if (status.sos == 1) ...[
          const SizedBox(height: 8),
          SizedBox(
            height: 50,
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: sendingMessage ? null : clearSos,
              icon: const Icon(Icons.check_circle),
              label: const Text('CLEAR SOS'),
            ),
          ),
        ],
      ],
    );
  }

  Widget devicePanel() {
    return section(
      title: 'Device',
      icon: Icons.info_outline,
      children: [
        row('ESP32 API', espConnected ? 'Connected' : 'Disconnected'),
        row('Wi-Fi AP', status.wifiReady ? 'OK' : 'FAIL'),
        row('Main Battery', '${status.battery}%'),
        row('RSSI', '${status.rssi} dBm'),
        row('SNR', status.snr.toStringAsFixed(1)),
        row('Fail count', failCount.toString()),
      ],
    );
  }

  Widget simpleGrid(List<Widget> children) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final cardWidth = (constraints.maxWidth - 10) / 2;
        return Wrap(
          spacing: 10,
          runSpacing: 10,
          children: children
              .map((child) => SizedBox(
                    width: cardWidth < 145 ? constraints.maxWidth : cardWidth,
                    child: child,
                  ))
              .toList(),
        );
      },
    );
  }

  Widget item(String title, String value, IconData icon) {
    return Container(
      constraints: const BoxConstraints(minHeight: 98),
      padding: const EdgeInsets.all(12),
      decoration: cardDecoration(),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: statusColor(), size: 22),
          const SizedBox(height: 8),
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 19, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget section({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: const Color(0xFF0F172A)),
              const SizedBox(width: 8),
              Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 10),
          ...children,
        ],
      ),
    );
  }

  Widget row(String left, String right) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 4,
            child: Text(
              left,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Color(0xFF64748B)),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            flex: 5,
            child: Text(
              right,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.right,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  BoxDecoration cardDecoration() {
    return BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
    );
  }
}