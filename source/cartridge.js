define(["require", "exports", "./bithelper"], function (require, exports, bithelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Cartridge {
        constructor(nes) {
            this.badrom = false;
            this.nes = nes;
        }
        load(rom_data) {
            this.rom_data = rom_data;
            this.loadHeader();
        }
        loadChr(rom_string) {
            try {
                let header = new Uint8Array(16);
                //read the header
                for (let i = 0; i < 16; i++) {
                    //do we need to & with 0xff?
                    //i think so because javascript stores strings as unicode not UTF=8
                    header[i] = rom_string.charCodeAt(i) & 0xff;
                }
                header[0]; //N
                header[1]; //E
                header[2]; //S
                header[3]; //blank
                let prgBanks = header[4];
                let chrBanks = header[5];
                console.log('prgBanks: ' + prgBanks);
                console.log('chrBanks: ' + chrBanks);
                let prgSize = prgBanks * 16 * 1024;
                let chrSize = chrBanks * 8 * 1024;
                this.chrDataMario = new Uint8Array(8 * 1024);
                let file_pointer = 16;
                //read the program data
                for (let i = 0; i < prgSize; i++) {
                    file_pointer++;
                }
                //init 2k usable character data
                for (let i = 0; i < this.chrDataMario.length; i++) {
                    if (chrSize > 0)
                        this.chrDataMario[i] = rom_string.charCodeAt(file_pointer) & 0xff;
                    else
                        this.chrDataMario[i] = 0; //if there's no chr data just init to 0
                    file_pointer++;
                }
            }
            catch (error) {
            }
            //do some additional checks to verify smb rom
            if (this.chrDataMario != null) {
                if (this.chrDataMario[0] != 3)
                    this.badrom = true;
                if (this.chrDataMario[1] != 15)
                    this.badrom = true;
                if (this.chrDataMario[2] != 31)
                    this.badrom = true;
                if (this.chrDataMario[3] != 31)
                    this.badrom = true;
                if (this.chrDataMario[4] != 28)
                    this.badrom = true;
                if (this.chrDataMario[5] != 36)
                    this.badrom = true;
                if (this.chrDataMario[6] != 38)
                    this.badrom = true;
                if (this.chrDataMario[7] != 102)
                    this.badrom = true;
                if (this.chrDataMario[8] != 0)
                    this.badrom = true;
                if (this.chrDataMario[9] != 0)
                    this.badrom = true;
            }
            if (this.badrom) {
                this.chrDataMario = null;
                console.log('bad rom');
                setTimeout(() => {
                    window["myApp"].lblCompiler = 'Bad Rom';
                    $("#lblCompiler").show();
                }, 2000);
            }
            console.log('finished parsing chr data');
        }
        loadHeader() {
            this.header = new Uint8Array(16);
            //read the header
            for (let i = 0; i < 16; i++) {
                //do we need to & with 0xff?
                //i think so because javascript stores strings as unicode not UTF=8
                this.header[i] = this.rom_data.charCodeAt(i) & 0xff;
            }
            this.header[0]; //N
            this.header[1]; //E
            this.header[2]; //S
            this.header[3]; //blank
            this.prgBanks = this.header[4];
            this.chrBanks = this.header[5];
            // this.mapperType = BitHelper.getBit(this.header[6],4);
            this.mapperType = this.header[6] >> 4 | this.header[7] & 0xf0;
            this.mirroring = bithelper_1.BitHelper.getBit(this.header[6], 0);
            console.log('prgBanks: ' + this.prgBanks);
            console.log('chrBanks: ' + this.chrBanks);
            console.log('mirroring: ' + this.mirroring);
            console.log('mapperType: ' + this.mapperType);
            if (this.mapperType > 4 && this.mapperType != 7) {
                console.log('MAPPER ' + this.mapperType + ' NOT IMPLEMENTED');
                this.nes.error_message = 'MAPPER ' + this.mapperType + ' NOT IMPLEMENTED';
            }
            //for performance
            this.nes.memory.prgBanksCount = this.prgBanks;
            this.nes.memory.chrBanksCount = this.chrBanks;
            this.nes.memory.mapper = this.mapperType;
            let prgSize = this.prgBanks * 16 * 1024;
            let chrSize = this.chrBanks * 8 * 1024;
            //also moved prgData to memory class for performance
            this.nes.memory.prgDataLength = prgSize;
            this.nes.memory.prgData = new Uint8Array(prgSize);
            this.chrData = new Uint8Array(8 * 1024);
            this.chrDataAll = new Uint8Array(chrSize);
            let file_pointer = 16;
            //TODO skip past trainer data if it exists
            //read the program data
            for (let i = 0; i < prgSize; i++) {
                this.nes.memory.prgData[i] = this.rom_data.charCodeAt(file_pointer) & 0xff;
                file_pointer++;
            }
            //read the whole character data
            for (let i = 0; i < chrSize; i++) {
                this.chrDataAll[i] = this.rom_data.charCodeAt(file_pointer) & 0xff;
                file_pointer++;
            }
            //init 2k usable character data
            for (let i = 0; i < this.chrData.length; i++) {
                if (chrSize > 0) {
                    if (this.chrDataMario != null)
                        this.chrData[i] = this.chrDataMario[i];
                    else
                        this.chrData[i] = this.chrDataAll[i];
                }
                else
                    this.chrData[i] = 0; //if there's no chr data just init to 0
            }
            //INITIALIZE MAPPERS 
            //MMC1
            if (this.mapperType == 1) {
                //initial state
                this.nes.memory.prgMode = 3;
                this.nes.memory.setPRGBanks();
            }
            //UxROM
            if (this.mapperType == 2) {
                //initial state
                //bank1 is fixed to last bank;
                this.nes.memory.prgBank1offset = (16384 * (this.nes.memory.prgBanksCount - 2));
            }
            //CNROM
            if (this.mapperType == 3) {
                //nothing to do
            }
            //MMC3
            if (this.mapperType == 4) {
                //fixed second half of prg rom
                this.nes.memory.prgBank3offset = prgSize - (16384 * 2);
                this.nes.ppu.isMMC3 = true;
            }
            //AxROM
            if (this.mapperType == 7) {
                //anything to do here?
                // this.mirroring = Mirroring.SINGLE_SCREEN;
            }
            //hack to detect SMB rom and remove sprite 0
            if (this.nes.memory.read(0xE000) == 0x23) {
                console.log('smb rom detected');
                this.nes.rom_name = 'smb.nes';
            }
            console.log('finished loading rom');
        }
    }
    exports.Cartridge = Cartridge;
    var Mirroring;
    (function (Mirroring) {
        Mirroring[Mirroring["HORIZONTAL"] = 0] = "HORIZONTAL";
        Mirroring[Mirroring["VERTICAL"] = 1] = "VERTICAL";
        Mirroring[Mirroring["FOUR_SCREEN"] = 2] = "FOUR_SCREEN";
        Mirroring[Mirroring["SINGLE_SCREEN"] = 3] = "SINGLE_SCREEN";
    })(Mirroring = exports.Mirroring || (exports.Mirroring = {}));
});
//# sourceMappingURL=cartridge.js.map