// When other modules connectMIDI(fun), we add those fun's to this array
// and call them all onmidimessage.
const callbacks = [];

//    === Main ===

if (navigator.requestMIDIAccess)
  navigator.requestMIDIAccess().then(success, fail);
else
  alert("No MIDI support present in your browser.  Try Chrome.")

function fail(err) {
  console.log("Failed to get MIDI access. Error: " + err);
}

function success(access) {
  access.onstatechange = (event) => onMIDIStateChange(event.port);

  const inputs = access.inputs.values();
  const devices = [];

  for (let i = inputs.next(); i && !i.done; i = inputs.next()) {
    devices.push(i.value);
  }

  if (devices.length === 0) {
    console.log("Midi success, but no devices.")
  } else {
    list(devices);
    connect(devices);
  }
}


//    === Functions ===

function onMIDIStateChange(device) {
  if (device.state === 'connected' && device.connection === 'closed') {
    device.onmidimessage = onMessage;
    console.log('Device', device.name, 'connected.')
  }
}

function connect(devices) {
  devices.forEach(dev => {
    dev.onmidimessage = onMessage;
  })
}

function onMessage(msg) {
  // console.debug("MIDI message data: ", msg.data[0], msg.data[1], msg.data[2]);
  const data = parse(msg.data);
  callbacks.forEach(v => v(data))
}

// function find(name, devices) {
//   return devices.find(dev => dev.name.indexOf(name) >= 0)
// }

function list(devices) {
  console.info("Midi devices:")
  for (const device of devices) {
    console.info(device.name)
  }
}

function parse(midiData) {
  const status = midiData[0];
  const data1 = midiData[1];
  const data2 = midiData[2];

  let channel = 1;
  const unit = data1;   // note or knob or pad
  const value = data2; // or velocity or pressure

  let msg = 'This midi msg has no handler';

  if (status >= 128 && status <= 143) {
    msg = 'Note off'
    channel = status - 127;
  }

  if (status >= 144 && status <= 159) {
    msg = 'Note on'
    channel = status - 143;
  }

  if (status >= 160 && status <= 175) {
    msg = 'Polyphonic Aftertouch'
    channel = status - 159;
  }

  if (status >= 176 && status <= 191) {
    msg = 'Knob' // or Modulation Wheel
    channel = status - 175;
  }

  if (status >= 224 && status <= 239) {
    msg = 'Pitch Bend Change'
    channel = status - 223;
  }

  return [msg, channel, unit, value];
}

export function connectMIDI(callback) {
  callbacks.push(callback);
}
