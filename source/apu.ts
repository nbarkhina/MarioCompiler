import { Nes } from "./nes";
import { BitHelper } from "./bithelper";
import { ToneJS } from "./tonejs";

declare var Tone;

export class APU {

    audioContext: AudioContext;
    nes: Nes;
    masterGainNode: GainNode;
    useDuty = true;
    _soundDisabled = true; //for performance, don't process registers if disabled
    FREQUENCY_RANGE_HIGH = 2000;
    FREQUENCY_RANGE_LOW = 10;

    //channels
    square1: SoundChannel;
    square2: SoundChannel;
    triangle: SoundChannel;
    noise: SoundChannel;

    lengthCounterTable = [10, 254, 20, 2, 40, 4, 80, 6, 160, 8, 60, 10, 14, 12, 26, 14,
        12, 16, 24, 18, 48, 20, 96, 22, 192, 24, 72, 26, 16, 28, 32, 30];
    frameCounterMode = 0;

    constructor(nes: Nes) {
        this.nes = nes;
        this.square1 = new SoundChannel(this, "square");
        this.square2 = new SoundChannel(this, "square");
        this.triangle = new SoundChannel(this, "triangle");
        this.noise = new SoundChannel(this, "noise");
    }

    muteAll() {
        this.square1.disable();
        this.square2.disable();
        this.triangle.disable();
        this.noise.disable();
        this._soundDisabled = true;
    }

    unMuteAll() {
        this.square1.enable();
        this.square2.enable();
        this.triangle.enable();
        // this.noise.enable();
        this._soundDisabled = false;
    }

    initialize(audioContext: AudioContext) {

        Tone.context.resume();

        //currently disable noise channel by default
        this.noise.disable();

        /*
        this.audioContext = audioContext;
        

        //gain node
        this.masterGainNode = this.audioContext.createGain();
        this.masterGainNode.connect(this.audioContext.destination);
        this.masterGainNode.gain.value = .2; //50% volume
        */

    }

    writeRegister(address: number, value: number) {

        if (this._soundDisabled) return;

        // Reference
        // $4000-$4003	First square wave
        // $4004-$4007	Second square wave
        // $4008-$400B	Triangle wave
        // $400C-$400F	Noise
        // $4010-$4013	DMC

        //square 1
        if (address >= 0x4000 && address < 0x4004) {
            this.square1.processRegister(address, value);
        }

        //square 2
        if (address >= 0x4004 && address < 0x4008) {
            this.square2.processRegister(address, value);
        }

        //triangle
        if (address >= 0x4008 && address < 0x400C) {
            this.triangle.processRegister(address, value);
        }

        //noise
        if (address >= 0x400C && address < 0x4010) {
            this.noise.processRegister(address, value);
        }

        if (address == 0x4015) {

            //enable or disable channels
            let squareEnable1 = BitHelper.getBit(value, 0);
            let squareEnable2 = BitHelper.getBit(value, 1);
            let triangleEnable = BitHelper.getBit(value, 2);
            let noiseEnable = BitHelper.getBit(value, 3);

            if (squareEnable1 == 1)
                this.square1.registerEnable();
            else
                this.square1.registerDisable();

            if (squareEnable2 == 1)
                this.square2.registerEnable();
            else
                this.square2.registerDisable();

            if (triangleEnable == 1)
            {
                this.triangle.registerEnable();
            }
            else
            {
                //Use $4015 to turn off the channel, which will clear its length counter. 
                //To resume, turn it back on via $4015, then write to $400B to reload the length counter.
                this.triangle.lengthCounter = 0;
                this.triangle.triangleLinearCounterReloadFlag = false;
                this.triangle.registerDisable();
            }
            if (noiseEnable == 1)
                this.noise.registerEnable();
            else
                this.noise.registerDisable();

        }

        //frame counter
        //mode 0 = 4 step, mode 1 = 5 step
        // https://wiki.nesdev.com/w/index.php/APU#Triangle_.28.244008-400B.29
        if (address == 0x4017){
            //TODO need to add a fifth frame for framecountermode = 1
            //this is why percussion is off in mario noise channel
            //lengthCounter entry of 2 should play instead of 
            //decrememnting to zero during the same frame
            this.frameCounterMode = BitHelper.getBit(value,7);
        }
    }


    //one nes half frame
    halfFrame() {
        if (this._soundDisabled) return;

        //half frames
        this.square1.sweepProcess();
        this.square2.sweepProcess();

        //quarter frame
        this.square1.envelopeProcess();
        this.square1.envelopeProcess();
        this.square2.envelopeProcess();
        this.square2.envelopeProcess();
        

        //half frame
        this.square1.countersProcess();
        this.square2.countersProcess();
        this.triangle.countersProcess();
        this.noise.countersProcess();

    }

    abruptTriangleVolumeHalt = false;

    //only set the volumes after alls said and done
    adjustVolumes(){
        if (this._soundDisabled) return;

        if (this.square1.enabled) this.square1.tone.volume.value = this.square1.volume;
        if (this.square2.enabled) this.square2.tone.volume.value = this.square2.volume;
        if (this.triangle.enabled){

            let triggerAttack = false;
            let triggerRelease = false;
            //apply amplitude filter to help with triangle popping noises
            if (this.triangle.amplitudeFilterMode){
                if (this.triangle.amplitudeVolumeHolder==-100 && this.triangle.volume==this.triangle.TRIANGLE_VOLUME)
                    triggerAttack = true;
                if (this.triangle.amplitudeVolumeHolder==this.triangle.TRIANGLE_VOLUME && this.triangle.volume==-100)
                    triggerRelease = true;
                this.triangle.amplitudeVolumeHolder = this.triangle.volume;
                
                //abrupt halt causes a popping noise
                //because of abrupt volume cutoff
                //adjusted release stage to be .01
                //in order to compensate
                if (this.abruptTriangleVolumeHalt)
                    this.triangle.tone.volume.value = this.triangle.volume; 
                else
                    this.triangle.tone.volume.value = this.triangle.TRIANGLE_VOLUME;

                if (triggerAttack)
                    this.triangle.amplitudeEnvelope.triggerAttack();
                if (triggerRelease)
                    this.triangle.amplitudeEnvelope.triggerRelease();
            }else
                this.triangle.tone.volume.value = this.triangle.volume;



        } 
        if (this.noise.enabled) this.noise.tone.volume.value = this.noise.volume;

    }


}


export class SoundChannel {

    apu: APU;
    tone: ToneJS; //ToneJS Oscillator 
    waveType: string;


    soundTimingLowByte = 0;
    soundTimingHighByte = 0;
    soundTiming = 0;
    dutyCycle = 0.5;
    volume = -100;
    sweepMode = false;
    sweepShiftAmount = 0;
    sweepNegate = 0;
    sweepPeriod = 0;
    sweepFrameCounter = 0;
    CPU_SPEED = 1789773;
    debugCurrentFrequency = 0; //for debugging
    lengthCounterHalt = 0;
    triangleLinearCounter = 0;
    triangleLinearCounterMax = 0;
    triangleLinearCounterReloadFlag = false;
    constantVolume = 0;
    lengthCounter = 0;
    enabled = true; //for my debugging, turning channels on and off
    registerEnabled = false; //wait until enable or disable from $4015 register

    SQUARE_VOLUME = -20;
    TRIANGLE_VOLUME = -10;
    NOISE_VOLUME = -25;

    //ADSR to help filter out some of the popping noise of the triangle channel
    amplitudeFilterMode = true;
    amplitudeEnvelope:any;
    amplitudeVolumeHolder:number = 0;

    envelopeRestart = false;
    envelopeDividerPeriod = 0; //how long the envelope will last
    envelopeDividerCounter = 0; //count down of the envelope divider period
    envelopeCounter = 0; //the current volume to set
    envelopeLoop = 0; //if we are looping
    registerVolume = 0; //volume that comes from register, don't think this is being used

    constructor(apu: APU, waveType: string) {
        this.apu = apu;
        this.waveType = waveType;

        //Initial state
        try {
            if (waveType == "square") {
                this.tone = new Tone.Oscillator(440, "square");
                this.tone.volume.value = -100;
                this.tone.toMaster();
                this.tone.start();

                //TODO bring back duty cycle
                //currently disabled tone width
                //beacause tone.oscillator doesn't have that property
                //however the square wave sounds better than the tone.pulseoscillator
                // this.tone = new Tone.PulseOscillator(440, 0.5);
                // this.tone.width.value = .5;
                // this.tone.volume.value = -100;
                // this.tone.toMaster();
                // this.tone.start();

            }
            if (waveType == "triangle") {
                this.tone = new Tone.Oscillator(440, "triangle");
                this.tone.volume.value = -100;

                if (this.amplitudeFilterMode){
                    // this.env = new Tone.AmplitudeEnvelope(.5,.1,.5,.5);
                    // this.amplitudeEnvelope = new Tone.AmplitudeEnvelope(.01,.1,.8,.5);
                    this.amplitudeEnvelope = new Tone.AmplitudeEnvelope();
                    this.tone.connect(this.amplitudeEnvelope);
                    this.amplitudeEnvelope.toMaster();
                    this.tone.volume.value = this.TRIANGLE_VOLUME;
                    this.amplitudeEnvelope.release=.01;

                }
                else{
                    this.TRIANGLE_VOLUME -= 10;
                    this.tone.toMaster();
                }

                

                this.tone.start();

            }
            if (waveType == "noise") {
                this.tone = new Tone.Noise("white");
                this.tone.volume.value = -100;
                this.tone.toMaster();
                this.tone.start();
            }
        } catch (error) {
            //in case Tone doesn't work
        }



    }

    disable() {
        this.enabled = false;
        this.tone.volume.value = -100;
        this.debugCurrentFrequency = 0;
        this.stop();
    }

    enable() {
        this.enabled = true;
    }

    //fix for double dragon while paused should be silent
    //comes from $4015
    registerDisable(){
        this.stop();
        this.registerEnabled = false;
    }

    registerEnable(){
        this.registerEnabled = true; //has to be in this order
        this.start();
    }

    //will be twice a frame
    countersProcess() {

        if (this.lengthCounterHalt==0) //as long as length counter halt is not set
            this.lengthCounter--;

        if (this.waveType == "square" || this.waveType=="noise"){
            if (this.lengthCounter<=0)
            {
                this.stop();
                this.lengthCounter = 0;
            }
        }

        if (this.waveType == "triangle"){


            //holy crap this was complex - (from nesdev)
            //When the frame counter generates a linear counter clock, the following actions occur in order:
            //If the linear counter reload flag is set, the linear counter is reloaded with the 
            //counter reload value, otherwise if the linear counter is non-zero, it is decremented.
            //If the control flag is clear, the linear counter reload flag is cleared.

            if (this.triangleLinearCounterReloadFlag) {
                this.triangleLinearCounter = this.triangleLinearCounterMax;
            } else if (this.triangleLinearCounter) {
                this.triangleLinearCounter-=2;   //runs 4 times a frame
            }
    
            if (this.lengthCounterHalt==0) {
                this.triangleLinearCounterReloadFlag = false;
            }

            //stops take priority over starts
            //you will see sometimes it's constantly starting/stopping
            //the triangle channel however via the adjustVolumes() function
            //will ultimately silence the channel if EITHER
            //triangleLinearCounter or lengthCounter reach 0
            if (this.lengthCounter<=0)
            {
                this.stop();
                this.lengthCounter = 0;
            }

            //or linear counter reaches zero
            if (this.triangleLinearCounter<=0){
                this.stop();
                this.triangleLinearCounter=0;
            }
        }


    }

    //adjusts frequency up or down automatically over time
    //to produce interesting sound effects like mario jumping
    sweepProcess() {
        if (this.sweepMode) {
            this.sweepFrameCounter++;
            if (this.sweepFrameCounter % this.sweepPeriod == 0) {
                if (this.sweepNegate == 1)
                    this.soundTiming -= this.soundTiming >> this.sweepShiftAmount;
                else
                    this.soundTiming += this.soundTiming >> this.sweepShiftAmount;

                this.setFrequency();
                this.sweepFrameCounter = 0;

            }
        }
    }


    envelopeProcess(){



        if (this.envelopeRestart) {
            this.envelopeRestart = false;
            this.envelopeCounter = 15;
            this.envelopeDividerCounter = this.envelopeDividerPeriod;
        }
        else{

            //this is basically two loops
            //outer loop is envelopeDividerCounter
            //inner loop is envelopeCounter which we set to our volume
            if (this.envelopeDividerCounter>0){
                this.envelopeDividerCounter--;
                if (this.envelopeDividerCounter==0){ 
                    this.envelopeCounter--; //volume decay
    
                    //if we are looping
                    if (this.envelopeCounter==0 && this.envelopeLoop){
                        this.envelopeCounter = 15;
                    }
    
                    //also reload the outer loop
                    this.envelopeDividerCounter = this.envelopeDividerPeriod;
                }
            }


            if (this.envelopeDividerCounter==0)
                this.envelopeCounter=0;

        }

        if(this.constantVolume)
        {
            //envelope disabled
            return;
        }
        else{
            //TODO slowly silence the volume instead of instantaneously
            if (this.envelopeCounter==0)
                this.volume = -100;
        }
    }

    processRegister(address: number, value: number) {

        if (this.enabled == false || this.registerEnabled==false) return;
        if (this.waveType == "square") {
            this.processRegisterSquare(address, value);
        }
        if (this.waveType == "triangle") {
            this.processRegisterTriangle(address, value);
        }
        if (this.waveType == "noise") {
            this.processRegisterNoise(address, value);
        }
    }

    processRegisterSquare(address: number, value: number) {


        let mode = address % 4;
        switch (mode) {
            //Volume, Envelope, length counter, duty cycle
            case 0:

                //parse duty cycle or "width" of square wave
                let duty = value >> 6;
                if (duty == 0) this.dutyCycle = .125;
                if (duty == 1) this.dutyCycle = .25;
                if (duty == 2) this.dutyCycle = .50;
                if (duty == 3) this.dutyCycle = .75;
                // this.tone.width.value = this.dutyCycle;

                //parse length counter halt flag
                this.lengthCounterHalt = BitHelper.getBit(value, 5);
                this.envelopeLoop = BitHelper.getBit(value, 5); //same bit as lengthCounterHalt
                this.constantVolume = BitHelper.getBit(value, 4);

                //parse volume
                let vol = value & 15; //extract first 4 bits
                if (vol == 0)
                    this.volume = -100;
                else
                {
                    this.volume = this.SQUARE_VOLUME - (15-vol); //adjust volume down accordingly

                }

                this.registerVolume = this.volume;

                //envelope
                this.envelopeRestart = true;
                this.envelopeDividerPeriod = vol + 1;

                this.setFrequency();
                break;
            //sweep, direction, update rate, enabled
            case 1:
                let sweepEnabled = BitHelper.getBit(value, 7);
                if (sweepEnabled) {
                    //EPPP.NSSS
                    this.sweepShiftAmount = value & 7; //right 3 bits
                    this.sweepNegate = BitHelper.getBit(value, 3) //4th bit
                    this.sweepPeriod = ((value >> 4) & 7) + 1; //bits 5,6,7
                    this.sweepMode = true;
                    this.sweepFrameCounter = 0;
                }
                else
                    this.sweepMode = false;
                break;
            //Frequency Low Byte
            case 2:
                // this.soundPlaying = false;
                this.soundTimingLowByte = value;
                this.soundTiming = (this.soundTimingHighByte << 8) | this.soundTimingLowByte;
                this.setFrequency();
                break;
            //Frequency High Byte (rightmost 3 bits), length counter
            case 3:

                this.envelopeRestart = true;

                this.soundTimingHighByte = 0;
                this.soundTimingHighByte = value & 7; //extract first 3 bits
                this.soundTiming = (this.soundTimingHighByte << 8) | this.soundTimingLowByte;


                this.lengthCounter = this.apu.lengthCounterTable[value >> 3]; //left 5 bits
                this.setFrequency();

                break;
        }
    }

    processRegisterTriangle(address: number, value: number) {


        let mode = address % 4;
        switch (mode) {
            //length counter halt/linear counter control, linear counter load
            case 0:
                this.lengthCounterHalt = BitHelper.getBit(value, 7);
                this.triangleLinearCounterMax = value & 127;
                this.setFrequency();
                break;
            //unused
            case 1:
                break;
            //Frequency Low Byte
            case 2:
                // this.soundPlaying = false;
                this.soundTimingLowByte = value;
                this.soundTiming = (this.soundTimingHighByte << 8) | this.soundTimingLowByte;
                this.setFrequency();
                break;
            //Frequency High Byte (rightmost 3 bits), length counter
            case 3:
                
                this.triangleLinearCounterReloadFlag = true;
                
                //first reset values
                this.soundTimingHighByte = 0;
                this.soundTimingHighByte = value & 7; //extract first 3 bits
                this.soundTiming = (this.soundTimingHighByte << 8) | this.soundTimingLowByte;


                this.lengthCounter = this.apu.lengthCounterTable[value >> 3]; //left 5 bits
                this.setFrequency();

                break;
        }

    }

    processRegisterNoise(address: number, value: number) {


        let mode = address % 4;
        switch (mode) {
            //Volume, Envelope, length counter
            case 0:


                //parse length counter halt flag
                this.lengthCounterHalt = BitHelper.getBit(value, 5);
                this.envelopeLoop = BitHelper.getBit(value, 5); //same bit as lengthCounterHalt
                this.constantVolume = BitHelper.getBit(value, 4);

                //parse volume
                let vol = value & 15; //extract first 4 bits
                if (vol == 0)
                    this.volume = -100;
                else
                {
                    this.volume = this.NOISE_VOLUME - (15-vol); //adjust volume down accordingly

                }

                this.registerVolume = vol;

                //envelope
                this.envelopeRestart = true;
                this.envelopeDividerPeriod = vol + 1;

                this.setFrequency();
                break;
            //not used
            case 1:
                break;
            //mode and period
            case 2:
                this.setFrequency();
                break;
            //length counter
            case 3:
                this.envelopeRestart = true;

                this.lengthCounter = this.apu.lengthCounterTable[value >> 3]; //left 5 bits

                //CURRENTLY A HACK FOR MARIO
                //otherwise percussion timing is off
                if (this.lengthCounter==2)
                    this.lengthCounter=4;

                this.setFrequency();
                break;
        }
    }




    start() {
        if (this.enabled == false  || this.registerEnabled==false) return;

        //this causes sounds to continue when unwanted
        //like in zelda name select screen
        //or when walking down the steps
        // if (this.waveType=="square"){
        //     this.volume=this.registerVolume;
        // }


        if (this.waveType == "triangle") {
            if (this.lengthCounter>0 || this.triangleLinearCounter>0)
            {
                this.volume = this.TRIANGLE_VOLUME;
            }
        }
    }


    stop() {

        this.volume = -100;
    }

    setFrequency() {

        //currently not setting frequency of noise
        if (this.waveType=="noise")
        {
            this.start();
            return;
        }

        //FORMULA
        // f = CPU / (16 * (t + 1))

        //protect from divide by zero
        let frequency = 0;
        if ((16 * (this.soundTiming + 1)) != 0) {
            frequency = this.CPU_SPEED / (16 * (this.soundTiming + 1));
        }

        //triangle plays one octave lower, divide frequency by 2
        if (this.waveType == "triangle")
            frequency = frequency / 2;


        //TODO is 2000 the boundary?
        //protect against very high/low frequencies
        if ( (frequency > this.apu.FREQUENCY_RANGE_HIGH || frequency < this.apu.FREQUENCY_RANGE_LOW)) 
        {
            // console.log('frequency out of range: ' + frequency)
            this.debugCurrentFrequency = 0;
            this.tone.frequency.value = 0;
            this.sweepMode = false;
            this.stop();
        }
        else 
        {
            this.debugCurrentFrequency = Math.floor(frequency);
            this.tone.frequency.value = frequency;
            this.start(); //otherwise double dragon doesn't work

        }
    }

}

export class Note {

    public static getNote(frequency:number):string{

        if (frequency==0)
            return '';

        let note = '';
        let counter = 0;
        for(let i = 0;i<this.allNotes.length/2;i++){

            let noteString = this.allNotes[counter] as string;
            let noteNumber = this.allNotes[counter+1] as number;

            if (frequency<=noteNumber){
                note = noteString;

                //compare to see if it's closer to the next note
                if (counter>0){
                    let lastNoteNumber = this.allNotes[counter-1] as number;
                    let diff = noteNumber-lastNoteNumber;
                    let diff2 = noteNumber-frequency;
                    if (diff2>diff/2)
                        note = this.allNotes[counter-2] as string;
                }
                break;
            }

            counter+=2;
        }
        return note;
    }

    static allNotes: any[] =
           [
            'C0', 16.35,
            'C#0', 17.32,
            'D0', 18.35,
            'D#0', 19.45,
            'E0', 20.60,
            'F0', 21.83,
            'F#0', 23.12,
            'G0', 24.50,
            'G#0', 25.96,
            'A0', 27.50,
            'A#0', 29.14,
            'B0', 30.87,
            'C1', 32.70,
            'C#1', 34.65,
            'D1', 36.71,
            'D#1', 38.89,
            'E1', 41.20,
            'F1', 43.65,
            'F#1', 46.25,
            'G1', 49.00,
            'G#1', 51.91,
            'A1', 55.00,
            'A#1', 58.27,
            'B1', 61.74,
            'C2', 65.41,
            'C#2', 69.30,
            'D2', 73.42,
            'D#2', 77.78,
            'E2', 82.41,
            'F2', 87.31,
            'F#2', 92.50,
            'G2', 98.00,
            'G#2', 103.83,
            'A2', 110.00,
            'A#2', 116.54,
            'B2', 123.47,
            'C3', 130.81,
            'C#3', 138.59,
            'D3', 146.83,
            'D#3', 155.56,
            'E3', 164.81,
            'F3', 174.61,
            'F#3', 185.00,
            'G3', 196.00,
            'G#3', 207.65,
            'A3', 220.00,
            'A#3', 233.08,
            'B3', 246.94,
            'C4', 261.63,
            'C#4', 277.18,
            'D4', 293.66,
            'D#4', 311.13,
            'E4', 329.63,
            'F4', 349.23,
            'F#4', 369.99,
            'G4', 392.00,
            'G#4', 415.30,
            'A4', 440.00,
            'A#4', 466.16,
            'B4', 493.88,
            'C5', 523.25,
            'C#5', 554.37,
            'D5', 587.33,
            'D#5', 622.25,
            'E5', 659.26,
            'F5', 698.46,
            'F#5', 739.99,
            'G5', 783.99,
            'G#5', 830.61,
            'A5', 880.00,
            'A#5', 932.33,
            'B5', 987.77,
            'C6', 1046.50,
            'C#6', 1108.73,
            'D6', 1174.66,
            'D#6', 1244.51,
            'E6', 1318.51,
            'F6', 1396.91,
            'F#6', 1479.98,
            'G6', 1567.98,
            'G#6', 1661.22,
            'A6', 1760.00,
            'A#6', 1864.66,
            'B6', 1975.53,
            'C7', 2093.00,
            'C#7', 2217.46,
            'D7', 2349.32,
            'D#7', 2489.02,
            'E7', 2637.02,
            'F7', 2793.83,
            'F#7', 2959.96,
            'G7', 3135.96,
            'G#7', 3322.44,
            'A7', 3520.00,
            'A#7', 3729.31,
            'B7', 3951.07,
            'C8', 4186.01,
            'C#8', 4434.92,
            'D8', 4698.64,
            'D#8', 4978.03,
            'E8', 5274.04,
            'F8', 5587.65,
            'F#8', 5919.91,
            'G8', 6271.93,
            'G#8', 6644.88,
            'A8', 7040.00,
            'A#8', 7458.62,
            'B8', 7902.13,
            ];
}