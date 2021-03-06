/*

  Base sound functions, borrowed from 
  http://chromakode.com/misc/sound.html

*/

var info = {
    channels: 2,
    rate: 44100,
    bits: 16 
};


// Convert a number into a binary string of the specified byte length.
function encInt(n, bytes) {
  var cs = "";

  for (var i = 0; i < bytes; i++) {
    cs += String.fromCharCode((n >> i*8) & 0xff);
  }
  return cs;
}

// Thanks to https://ccrma.stanford.edu/courses/422/projects/WaveFormat/
function wav(info, data) {
  
    var wavData = "data:audio/x-wav;base64,",
	    binaryData = "";
	  
    binaryData += "RIFF";                                             // Start of RIFF header
    binaryData += encInt(36 + data.length, 4);                        // Rest of file size
    binaryData += "WAVE";                                             // Format
    binaryData += "fmt ";                                             // Subchunk 1 id
    binaryData += encInt(16, 4);                                      // Subchunk size
    binaryData += encInt(1, 2);                                       // Linear quantization
    binaryData += encInt(info.channels, 2);                           // Channels
    binaryData += encInt(info.rate, 4);                               // Sample rate
    binaryData += encInt(info.rate * info.channels * info.bits/8, 4); // Byte rate
    binaryData += encInt(info.channels * info.bits/8, 2);               // Block align
    binaryData += encInt(info.bits, 2);                               // Bits per sample
    binaryData += "data";                                             // Subchunk 2 id
    binaryData += encInt(data.length, 4);                             // Subchunk size
    binaryData += data;                                               // Audio data
    wavData += btoa(binaryData);
    
    return wavData;
}

// Convert an array of 2-dimensional floating point sample arrays into binary wave sample data.
function wavEncode(info, samples) {
  var data = "";
  for (var i = 0; i < samples.length; i++) {
    var sample = samples[i];
	  for (var j = 0; j < sample.length; j++) {
	    value = sample[j] * (Math.pow(2, info.bits-1) - 1);
	    data += encInt(Math.round(value), info.bits/8);
	  }
  }
  return data;
}

// Adapted from https://github.com/gasman/jasmid/blob/master/synth.js
function SineGenerator(info, freq) {
  var self = {'alive': true},
	  period = info.rate / freq,
	  t = 0;

	self.read = function() {
	    var phase = t / period,
	      result = Math.sin(phase * 2 * Math.PI);
	    t++;
	    return [result, result];
	};
	return self;
}


// Adapted from https://github.com/gasman/jasmid/blob/master/synth.js
function AttackDecayGenerator(rate, attackTimeS, decayTimeS, child, amplitude) {

  var self = {'alive': true},
    attackTime = rate * attackTimeS,
    decayTime = rate * decayTimeS,
    t = 0;

  amplitude = amplitude || 1;

  self.read = function() {
    var input,
      localAmplitude;
    
    if (!self.alive) {
      return [0,0];
    }
    
    input = child.read();
    self.alive = child.alive;

    if (t < attackTime) {
      localAmplitude = amplitude * (t / attackTime);
    } else {
      localAmplitude = amplitude * (1 - (t - attackTime) / decayTime);
      if (localAmplitude <= 0) {
        self.alive = false;
        return [0,0];
      }
    }

    t++;
    return [localAmplitude * input[0], localAmplitude * input[1]];
  };
  return self;
}

// Adapted from https://github.com/gasman/jasmid/blob/master/synth.js
function XAttackDecayGenerator(info, child, attackTimeS, decayTimeS, amplitude) {
  var self = {'alive': true},
    attackTime = info.rate * attackTimeS,
    decayTime = info.rate * decayTimeS,
    t = 0;

  self.read = function() {
    var input,
      localAmplitude;

    if (!self.alive) return [0,0];

    input = child.read();
    self.alive = child.alive;

    if (t < attackTime) {
      localAmplitude = amplitude * (t / attackTime);
    } else {
      localAmplitude = amplitude * (1 - (t - attackTime) / decayTime);
      if (localAmplitude <= 0) {
        self.alive = false;
        return [0,0];
      }
    }

    t++;
    return [localAmplitude * input[0], localAmplitude * input[1]];
  };
    
  return self;
}


function synthesize(gen, duration, samples) {
    samples = samples || [];
    for (var i = 0; i < duration; i++) {
        samples.push(gen.read());
    }
    return samples;
}


function echo(rate, delay, samples) {
  var i,
    j,
    sample,
    echoSample,
    newSample,
    offset = delay * rate,
    length = samples.length = samples.length + offset * 8;

  samples = samples.concat();

  for (i = 0; i < length; i++) {
    sample = samples[i];
    echoSample = samples[i + offset] || [];
    newSample = [];
    for (j = 0; j < sample.length; j++) {
      newSample[j] = ((echoSample[j] || 0) + sample[j])/2;
    }
    samples[i + offset] = newSample;
  }
  return samples;
}