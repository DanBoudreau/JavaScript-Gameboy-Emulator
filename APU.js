APU = {
    // Timing and output state
    _cpuClock: 4194304,
    _sampleRate: 44100,
    _samplePeriod: 4194304 / 44100,
    _sampleClock: 0,
    _frameClock: 0,
    _frameStep: 0,
    _bufferSize: 1024,
    _maxQueuedSamples: 65536,
    _sampleQueueLeft: null,
    _sampleQueueRight: null,
    _sampleReadIndex: 0,
    _sampleWriteIndex: 0,
    _queuedSamples: 0,
    _audioContext: null,
    _processor: null,
    _masterGain: null,
    _userEnabled: false,
    _scriptNodeReady: false,
    _volume: 0.18,
    _registers: [],
    _waveRam: [],
    _masterEnabled: true,
    _leftVolume: 7,
    _rightVolume: 7,
    _routing: 0xFF,
    _channel1: null,
    _channel2: null,
    _channel3: null,
    _channel4: null,
    _lastLeftSample: 0,
    _lastRightSample: 0,

    // Reset APU state and rebuild channel objects
    reset: function() {
        APU._sampleClock = 0;
        APU._frameClock = 0;
        APU._frameStep = 0;
        APU._sampleReadIndex = 0;
        APU._sampleWriteIndex = 0;
        APU._queuedSamples = 0;
        APU._lastLeftSample = 0;
        APU._lastRightSample = 0;
        APU._masterEnabled = true;
        APU._volume = 0.18;
        APU._leftVolume = 7;
        APU._rightVolume = 7;
        APU._routing = 0xFF;
        APU._registers = [];
        APU._waveRam = [];

        if(!APU._sampleQueueLeft || APU._sampleQueueLeft.length !== APU._maxQueuedSamples) {
            APU._sampleQueueLeft = new Float32Array(APU._maxQueuedSamples);
            APU._sampleQueueRight = new Float32Array(APU._maxQueuedSamples);
        }

        for(var index = 0; index < 0x30; index++)
            APU._registers[index] = 0;
        for(var waveIndex = 0; waveIndex < 0x10; waveIndex++)
            APU._waveRam[waveIndex] = 0;

        APU._channel1 = APU._createSquareChannel(true);
        APU._channel2 = APU._createSquareChannel(false);
        APU._channel3 = APU._createWaveChannel();
        APU._channel4 = APU._createNoiseChannel();

        APU._registers[0x16] = 0x80;
    },

    // Channel factory helpers
    _createSquareChannel: function(withSweep) {
        return {
            enabled: false,
            dacEnabled: false,
            withSweep: withSweep,
            duty: 2,
            phase: 0,
            lengthCounter: 0,
            lengthEnabled: false,
            frequency: 0,
            initialVolume: 0,
            volume: 0,
            envelopePeriod: 0,
            envelopeIncrease: false,
            envelopeTimer: 0,
            sweepPeriod: 0,
            sweepNegate: false,
            sweepShift: 0
        };
    },

    _createWaveChannel: function() {
        return {
            enabled: false,
            dacEnabled: false,
            phase: 0,
            lengthCounter: 0,
            lengthEnabled: false,
            frequency: 0,
            volumeCode: 0
        };
    },

    _createNoiseChannel: function() {
        return {
            enabled: false,
            dacEnabled: false,
            lengthCounter: 0,
            lengthEnabled: false,
            initialVolume: 0,
            volume: 0,
            envelopePeriod: 0,
            envelopeIncrease: false,
            envelopeTimer: 0,
            divisorCode: 0,
            clockShift: 0,
            widthMode: 0,
            lfsr: 0x7FFF,
            phase: 0
        };
    },

    // Web Audio setup and user controls
    _ensureAudio: function() {
        if(APU._scriptNodeReady)
            return;

        var AudioCtor = window.AudioContext || window.webkitAudioContext;
        if(!AudioCtor)
            return;

        APU._audioContext = new AudioCtor();
    APU._sampleRate = APU._audioContext.sampleRate || 44100;
    APU._samplePeriod = APU._cpuClock / APU._sampleRate;
        APU._processor = APU._audioContext.createScriptProcessor(APU._bufferSize, 0, 2);
        APU._masterGain = APU._audioContext.createGain();
        APU._masterGain.gain.value = APU._volume;

        APU._processor.onaudioprocess = function(event) {
            var left = event.outputBuffer.getChannelData(0);
            var right = event.outputBuffer.getChannelData(1);

            for(var index = 0; index < left.length; index++) {
                if(APU._queuedSamples > 0) {
                    left[index] = APU._sampleQueueLeft[APU._sampleReadIndex];
                    right[index] = APU._sampleQueueRight[APU._sampleReadIndex];
                    APU._lastLeftSample = left[index];
                    APU._lastRightSample = right[index];
                    APU._sampleReadIndex = (APU._sampleReadIndex + 1) % APU._maxQueuedSamples;
                    APU._queuedSamples--;
                }
                else {
                    left[index] = APU._lastLeftSample;
                    right[index] = APU._lastRightSample;
                }
            }
        };

        APU._processor.connect(APU._masterGain);
        APU._masterGain.connect(APU._audioContext.destination);
        APU._scriptNodeReady = true;
    },

    enableAudio: function() {
        APU._userEnabled = true;
        APU._ensureAudio();

        if(APU._audioContext && APU._audioContext.state === 'suspended')
            APU._audioContext.resume();
    },

    disableAudio: function() {
        APU._userEnabled = false;
        APU._sampleReadIndex = 0;
        APU._sampleWriteIndex = 0;
        APU._queuedSamples = 0;
        APU._lastLeftSample = 0;
        APU._lastRightSample = 0;
    },

    setVolume: function(level) {
        APU._volume = Math.max(0, Math.min(1, level));
        if(APU._masterGain)
            APU._masterGain.gain.value = APU._volume;
    },

    // Advance the APU by CPU cycles and emit audio samples
    step: function(cycles) {
        if(!cycles)
            return;

        APU._frameClock += cycles;
        while(APU._frameClock >= 8192) {
            APU._frameClock -= 8192;
            APU._clockFrameSequencer();
        }

        APU._sampleClock += cycles;
        while(APU._sampleClock >= APU._samplePeriod) {
            APU._sampleClock -= APU._samplePeriod;
            APU._advanceSample();
        }
    },

    // Frame sequencer clocks length and envelope timing
    _clockFrameSequencer: function() {
        if((APU._frameStep & 1) === 0)
            APU._clockLengthCounters();

        if(APU._frameStep === 7)
            APU._clockEnvelopes();

        APU._frameStep = (APU._frameStep + 1) & 7;
    },

    _clockLengthCounters: function() {
        APU._clockLength(APU._channel1);
        APU._clockLength(APU._channel2);
        APU._clockLength(APU._channel3);
        APU._clockLength(APU._channel4);
    },

    _clockLength: function(channel) {
        if(channel.enabled && channel.lengthEnabled && channel.lengthCounter > 0) {
            channel.lengthCounter--;
            if(channel.lengthCounter === 0)
                channel.enabled = false;
        }
    },

    _clockEnvelopes: function() {
        APU._clockEnvelope(APU._channel1);
        APU._clockEnvelope(APU._channel2);
        APU._clockEnvelope(APU._channel4);
    },

    _clockEnvelope: function(channel) {
        if(!channel.enabled || !channel.dacEnabled || !channel.envelopePeriod)
            return;

        if(channel.envelopeTimer > 0)
            channel.envelopeTimer--;

        if(channel.envelopeTimer === 0) {
            channel.envelopeTimer = channel.envelopePeriod;
            if(channel.envelopeIncrease && channel.volume < 15)
                channel.volume++;
            else if(!channel.envelopeIncrease && channel.volume > 0)
                channel.volume--;
        }
    },

    // Mix all enabled channels into the output sample queue
    _advanceSample: function() {
        var left = 0;
        var right = 0;

        if(APU._masterEnabled) {
            var square1 = APU._sampleSquare(APU._channel1);
            var square2 = APU._sampleSquare(APU._channel2);
            var wave = APU._sampleWave(APU._channel3);
            var noise = APU._sampleNoise(APU._channel4);
            var channelSamples = [square1, square2, wave, noise];

            for(var channel = 0; channel < 4; channel++) {
                var sample = channelSamples[channel];
                var leftMask = 1 << (4 + channel);
                var rightMask = 1 << channel;
                if(APU._routing & leftMask)
                    left += sample;
                if(APU._routing & rightMask)
                    right += sample;
            }

            left *= (APU._leftVolume + 1) / 8;
            right *= (APU._rightVolume + 1) / 8;
        }

        if(!APU._userEnabled || !APU._scriptNodeReady)
            return;

        left = Math.max(-1, Math.min(1, left * 0.2));
        right = Math.max(-1, Math.min(1, right * 0.2));

        if(APU._queuedSamples >= APU._maxQueuedSamples) {
            APU._sampleReadIndex = (APU._sampleReadIndex + 1) % APU._maxQueuedSamples;
            APU._queuedSamples--;
        }

        APU._sampleQueueLeft[APU._sampleWriteIndex] = left;
        APU._sampleQueueRight[APU._sampleWriteIndex] = right;
        APU._sampleWriteIndex = (APU._sampleWriteIndex + 1) % APU._maxQueuedSamples;
        APU._queuedSamples++;
    },

    // Per-channel waveform sampling helpers
    _sampleSquare: function(channel) {
        if(!channel.enabled || !channel.dacEnabled)
            return 0;

        var frequency = 131072 / Math.max(1, 2048 - channel.frequency);
        var dutyPatterns = [
            [0,1,0,0,0,0,0,0],
            [0,1,1,0,0,0,0,0],
            [0,1,1,1,1,0,0,0],
            [1,0,0,1,1,1,1,1]
        ];
        channel.phase = (channel.phase + (frequency * 8) / APU._sampleRate) % 8;
        var duty = dutyPatterns[channel.duty] || dutyPatterns[2];
        var bit = duty[Math.floor(channel.phase) & 7] ? 1 : -1;
        return bit * (channel.volume / 15);
    },

    _sampleWave: function(channel) {
        if(!channel.enabled || !channel.dacEnabled || channel.volumeCode === 0)
            return 0;

        var frequency = 65536 / Math.max(1, 2048 - channel.frequency);
        channel.phase = (channel.phase + (frequency * 32) / APU._sampleRate) % 32;
        var sampleIndex = Math.floor(channel.phase) & 31;
        var waveByte = APU._waveRam[sampleIndex >> 1] || 0;
        var rawSample = (sampleIndex & 1) ? (waveByte & 0x0F) : (waveByte >> 4);
        var volumeShift = [4, 0, 1, 2][channel.volumeCode] || 4;
        var sample = volumeShift === 4 ? 0 : (rawSample >> volumeShift);
        return ((sample / 7.5) - 1) * 0.8;
    },

    _sampleNoise: function(channel) {
        if(!channel.enabled || !channel.dacEnabled)
            return 0;

        var divisors = [8, 16, 32, 48, 64, 80, 96, 112];
        var divisor = divisors[channel.divisorCode] || 8;
        var frequency = 524288 / divisor / Math.pow(2, channel.clockShift + 1);
        channel.phase += frequency / APU._sampleRate;

        while(channel.phase >= 1) {
            channel.phase -= 1;
            var xorBit = (channel.lfsr ^ (channel.lfsr >> 1)) & 0x01;
            channel.lfsr = (channel.lfsr >> 1) | (xorBit << 14);
            if(channel.widthMode)
                channel.lfsr = (channel.lfsr & ~(1 << 6)) | (xorBit << 6);
        }

        return ((channel.lfsr & 1) ? -1 : 1) * (channel.volume / 15);
    },

    // Trigger helpers restart channels from their register state
    _triggerSquare: function(channel) {
        channel.enabled = channel.dacEnabled;
        if(channel.lengthCounter === 0)
            channel.lengthCounter = 64;
        channel.phase = 0;
        channel.volume = channel.initialVolume;
        channel.envelopeTimer = channel.envelopePeriod || 8;
    },

    _triggerWave: function() {
        var channel = APU._channel3;
        channel.enabled = channel.dacEnabled;
        if(channel.lengthCounter === 0)
            channel.lengthCounter = 256;
        channel.phase = 0;
    },

    _triggerNoise: function() {
        var channel = APU._channel4;
        channel.enabled = channel.dacEnabled;
        if(channel.lengthCounter === 0)
            channel.lengthCounter = 64;
        channel.volume = channel.initialVolume;
        channel.envelopeTimer = channel.envelopePeriod || 8;
        channel.phase = 0;
        channel.lfsr = 0x7FFF;
    },

    // Audio register access
    rb: function(addr) {
        if(addr >= 0xFF30 && addr <= 0xFF3F)
            return APU._waveRam[addr - 0xFF30];

        if(addr === 0xFF26) {
            return (APU._masterEnabled ? 0x80 : 0) |
                   (APU._channel4.enabled ? 0x08 : 0) |
                   (APU._channel3.enabled ? 0x04 : 0) |
                   (APU._channel2.enabled ? 0x02 : 0) |
                   (APU._channel1.enabled ? 0x01 : 0);
        }

        return APU._registers[addr - 0xFF10] || 0;
    },

    wb: function(addr, val) {
        if(addr >= 0xFF30 && addr <= 0xFF3F) {
            APU._waveRam[addr - 0xFF30] = val & 0xFF;
            return;
        }

        if(addr === 0xFF26) {
            APU._masterEnabled = !!(val & 0x80);
            APU._registers[0x16] = val & 0x80;
            if(!APU._masterEnabled) {
                for(var index = 0; index < 0x16; index++)
                    APU._registers[index] = 0;
                APU._channel1.enabled = false;
                APU._channel2.enabled = false;
                APU._channel3.enabled = false;
                APU._channel4.enabled = false;
            }
            return;
        }

        if(!APU._masterEnabled && addr !== 0xFF26)
            return;

        APU._registers[addr - 0xFF10] = val & 0xFF;

        switch(addr) {
            case 0xFF10:
                APU._channel1.sweepPeriod = (val >> 4) & 0x07;
                APU._channel1.sweepNegate = !!(val & 0x08);
                APU._channel1.sweepShift = val & 0x07;
                break;
            case 0xFF11:
                APU._channel1.duty = (val >> 6) & 0x03;
                APU._channel1.lengthCounter = 64 - (val & 0x3F);
                break;
            case 0xFF12:
                APU._channel1.initialVolume = (val >> 4) & 0x0F;
                APU._channel1.envelopeIncrease = !!(val & 0x08);
                APU._channel1.envelopePeriod = val & 0x07;
                APU._channel1.dacEnabled = !!(val & 0xF8);
                if(!APU._channel1.dacEnabled)
                    APU._channel1.enabled = false;
                break;
            case 0xFF13:
                APU._channel1.frequency = (APU._channel1.frequency & 0x0700) | val;
                break;
            case 0xFF14:
                APU._channel1.frequency = (APU._channel1.frequency & 0x00FF) | ((val & 0x07) << 8);
                APU._channel1.lengthEnabled = !!(val & 0x40);
                if(val & 0x80)
                    APU._triggerSquare(APU._channel1);
                break;

            case 0xFF16:
                APU._channel2.duty = (val >> 6) & 0x03;
                APU._channel2.lengthCounter = 64 - (val & 0x3F);
                break;
            case 0xFF17:
                APU._channel2.initialVolume = (val >> 4) & 0x0F;
                APU._channel2.envelopeIncrease = !!(val & 0x08);
                APU._channel2.envelopePeriod = val & 0x07;
                APU._channel2.dacEnabled = !!(val & 0xF8);
                if(!APU._channel2.dacEnabled)
                    APU._channel2.enabled = false;
                break;
            case 0xFF18:
                APU._channel2.frequency = (APU._channel2.frequency & 0x0700) | val;
                break;
            case 0xFF19:
                APU._channel2.frequency = (APU._channel2.frequency & 0x00FF) | ((val & 0x07) << 8);
                APU._channel2.lengthEnabled = !!(val & 0x40);
                if(val & 0x80)
                    APU._triggerSquare(APU._channel2);
                break;

            case 0xFF1A:
                APU._channel3.dacEnabled = !!(val & 0x80);
                if(!APU._channel3.dacEnabled)
                    APU._channel3.enabled = false;
                break;
            case 0xFF1B:
                APU._channel3.lengthCounter = 256 - val;
                break;
            case 0xFF1C:
                APU._channel3.volumeCode = (val >> 5) & 0x03;
                break;
            case 0xFF1D:
                APU._channel3.frequency = (APU._channel3.frequency & 0x0700) | val;
                break;
            case 0xFF1E:
                APU._channel3.frequency = (APU._channel3.frequency & 0x00FF) | ((val & 0x07) << 8);
                APU._channel3.lengthEnabled = !!(val & 0x40);
                if(val & 0x80)
                    APU._triggerWave();
                break;

            case 0xFF20:
                APU._channel4.lengthCounter = 64 - (val & 0x3F);
                break;
            case 0xFF21:
                APU._channel4.initialVolume = (val >> 4) & 0x0F;
                APU._channel4.envelopeIncrease = !!(val & 0x08);
                APU._channel4.envelopePeriod = val & 0x07;
                APU._channel4.dacEnabled = !!(val & 0xF8);
                if(!APU._channel4.dacEnabled)
                    APU._channel4.enabled = false;
                break;
            case 0xFF22:
                APU._channel4.clockShift = (val >> 4) & 0x0F;
                APU._channel4.widthMode = !!(val & 0x08);
                APU._channel4.divisorCode = val & 0x07;
                break;
            case 0xFF23:
                APU._channel4.lengthEnabled = !!(val & 0x40);
                if(val & 0x80)
                    APU._triggerNoise();
                break;

            case 0xFF24:
                APU._rightVolume = val & 0x07;
                APU._leftVolume = (val >> 4) & 0x07;
                break;
            case 0xFF25:
                APU._routing = val;
                break;
        }
    }
};

APU.reset();
