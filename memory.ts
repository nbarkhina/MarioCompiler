import { Nes } from "./nes";
import { BitHelper } from "./bithelper";
import { Mirroring } from "./cartridge";

export class Memory {

    public ram: Uint8Array;
    public saveRam: Uint8Array;
    nes: Nes;
    inputCounter = 0; //controller 1 input

    //for performance
    //amazingly accessing this.nes.cartridge.prgBanks is slower than
    //this.prgBanksCopy seemingly because it needs to access a seperate object
    prgBanksCount = 0;
    chrBanksCount = 0;
    mapper = 0;
    prgDataLength = 0;
    prgData:Uint8Array;

    //Mapper variables
    prgMode = 0;
    prgBankSwitchable = 0; //index of prg bank that is switchable
    prgBank0offset = 0; //used to calculate offset into prg data based on current bank
    prgBank1offset = 0;
    prgBank2offset = 0; //used in mmc3 mapper
    prgBank3offset = 0;
    chrMode = 0;
    chrBank0 = 0;  //which chr bank 0 is using
    chrBank1 = 0;  //which chr bank 1 is using
    mapperShiftRegister = 0;  //it takes 5 writes for MMC1, each right loads into this shift register
    mapperWriteCount = 0;   //keeps track to know when the 5th write has occurred

    //MMC3
    mmc3BankSelect = 0;
    mmc3PrgMode = 0;
    mmc3ChrA12 = 0;
    irqEnabled = false;
	irqCounter = 0;
	irqCounterReset = 0;
    irqReloadRequested = false;
    
    constructor(nes: Nes) {
        this.nes = nes;

        //currently covers the entire addressable rangle
        //however only 2k will come from ram
        //the rest gets routed based on mappers, cartridge, etc..
        // this.ram = new Uint8Array(64 * 1024);
        this.ram = new Uint8Array(0xFFFF); //64 kb (large just to support sample program)
        this.saveRam = new Uint8Array(0x8000); //TEMPORARY - need to optimize


    }



    read(address: number): number {


        //Cartridge
        if (address >= 0x4020 && address <= 0xFFFF) {

            //this is the most common read function in the app
            //make sure to keep it LEAN

            if (this.mapper == 0) {
                let real_address = address - 0x8000;

                //MAPPER 0
                //https://wiki.nesdev.com/w/index.php/NROM

                //handle 16kb rom vs 32kb rom
                if (this.prgBanksCount == 1) {
                    //mirror second half of prg data
                    if (real_address >= 16384) {
                        real_address -= 16384
                    }
                }
                return this.prgData[real_address];
            }
            else if (this.mapper == 1) { //MAPPER 1
                if (address >= 0x8000) {
                    let real_address = address - 0x8000;

                    //BANK0
                    if (real_address < 16384) {
                        real_address += this.prgBank0offset;
                    }
                    //BANK1
                    else {
                        real_address += this.prgBank1offset;
                    }

                    //guard against going over length
                    //example: palamedes game
                    if (real_address>=this.prgDataLength)
                    {
                        real_address = real_address % this.prgData.length;
                    }

                    return this.prgData[real_address];
                }
                else {
                    //Save RAM
                    return this.saveRam[address];
                }


            }
            else if (this.mapper == 2) {
                let real_address = address - 0x8000;

                //BANK0
                if (real_address < 16384) {
                    real_address += this.prgBank0offset;
                }
                //BANK1
                else {
                    real_address += this.prgBank1offset;
                }

                return this.prgData[real_address];
            }
            else if (this.mapper == 3) {
                let real_address = address - 0x8000;

                //handle 16kb rom vs 32kb rom
                if (this.prgBanksCount == 1) {
                    //mirror second half of prg data
                    if (real_address >= 16384) {
                        real_address -= 16384
                    }
                }

                return this.prgData[real_address];
            }
            else if (this.mapper == 4) {
                if (address >= 0x8000) {
                    let real_address = address - 0x8000;

                    //BANK0
                    if (real_address < 8192) {
                        real_address += this.prgBank0offset;
                    }
                    //BANK1
                    else if (real_address < 16384) {
                        real_address += this.prgBank1offset;
                    }
                    //BANK2
                    else if (real_address < 24576) {
                        real_address += this.prgBank2offset;
                    }
                    //BANK3
                    else {
                        real_address += this.prgBank3offset;
                    }

                    return this.prgData[real_address];
                    
                }
                else {
                    //Save RAM
                    return this.saveRam[address];
                }

            }
            else if (this.mapper == 7) {
                let real_address = address - 0x8000;
                real_address += this.prgBank0offset

                return this.prgData[real_address];
            }
            else if (this.mapper == -1) { //SAMPLEPROGRAM
                return this.ram[address];
            }
            else {
                //catch all for other mappers for now
                let real_address = address - 0x8000;
                return this.prgData[real_address];
            }
        }
        else {
            let real_address = this.mapAddress(address);

            //PPU
            if (address >= 0x2000 && address < 0x4000) {
                return this.nes.ppu.readRegister(real_address);
            }
            //APU
            else if (address >= 0x4000 && address <= 0x400F) {

                //does it ever read from APU?
            }
            //Controller
            else if (address >= 0x4016 && address < 0x4017) {

                //Controller 1
                if (address == 0x4016) {
                    if (this.inputCounter < 9) {

                        this.inputCounter++;
                        if (this.inputCounter == 1) return this.nes.inputController.Key_Action_A ? 65 : 64; //A
                        if (this.inputCounter == 2) return this.nes.inputController.Key_Action_B ? 65 : 64; //B
                        if (this.inputCounter == 3) return this.nes.inputController.Key_Action_Select ? 65 : 64; //Select
                        if (this.inputCounter == 4) return this.nes.inputController.Key_Action_Start ? 65 : 64; //Start
                        if (this.inputCounter == 5) return this.nes.inputController.Key_Up ? 65 : 64; //Up
                        if (this.inputCounter == 6) return this.nes.inputController.Key_Down ? 65 : 64; //Down
                        if (this.inputCounter == 7) return this.nes.inputController.Key_Left ? 65 : 64; //Left
                        if (this.inputCounter == 8) return this.nes.inputController.Key_Right ? 65 : 64; //Right

                        return 0;

                    }
                }
                else
                    return this.ram[real_address];
            }
            else
                return this.ram[real_address];
        }

    }



    write(address: number, value: number) {
        var real_address = this.mapAddress(address);

        //Cartridge
        if (address >= 0x4020 && address <= 0xFFFF) {

            if (address >= 0x8000) {
                //Mapper 1
                if (this.mapper == 1) {

                    //REFERENCE
                    //https://wiki.nesdev.com/w/index.php/MMC1

                    //if bit 7 is set, clear the mapper shiftRegister
                    if (BitHelper.getBit(value, 7)) {
                        this.mapperShiftRegister = 0;
                        this.mapperWriteCount = 0;

                        //reset it to it's initial state
                        this.applyMapper1(0x8000, 0xc);
                    }
                    else //write to the shift register
                    {

                        this.mapperShiftRegister = this.mapperShiftRegister | (BitHelper.getBit(value, 0) << this.mapperWriteCount);
                        this.mapperWriteCount++;

                        if (this.mapperWriteCount == 5) { //fifth write, now apply to mapper

                            this.applyMapper1(address, this.mapperShiftRegister);
                            this.mapperShiftRegister = 0;
                            this.mapperWriteCount = 0;
                        }
                    }

                }
                //Mapper 2
                else if (this.mapper == 2) {
                    this.prgBank0offset = value * 16384;
                }
                //Mapper 3
                else if (this.mapper == 3) {

                    // https://wiki.nesdev.com/w/index.php/CNROM
                    //8kb chr rom bank switchable

                    let chrBank = value & 0x3;//first 2 bits

                    for (let i = 0; i < 8 * 1024; i++) {
                        this.nes.cartridge.chrData[i] = this.nes.cartridge.chrDataAll[i + (8 * 1024 * chrBank)];
                    }

                }
                //Mapper 4
                else if (this.mapper == 4) {

                    //https://wiki.nesdev.com/w/index.php/MMC3

                    this.applyMapper3(address, value);


                }
                //Mapper 7
                else if (this.mapper == 7) {
                    //TODO mirroring
                    // let mirroring = BitHelper.getBit(value,4);
                    // if (mirroring!=0)
                    // {
                    //     let debug=1;
                    // }

                    value = value & 7;
                    this.prgBank0offset = value * 32768;
                }
                else if (this.mapper == -1) { //SAMPLEPROGRAM
                    this.ram[address] = value;
                }
            }
            else //Save RAM
            {
                if (address>=this.saveRam.length || address<0)
                    console.log('saveram out of range');
                this.saveRam[address] = value;

            }

        }
        //PPU
        else if (address >= 0x2000 && address < 0x4000) {
            this.nes.ppu.writeRegister(real_address, value);
        }
        //APU
        else if (address >= 0x4000 && address <= 0x4013) {
            this.nes.apu.writeRegister(address, value);
        }
        //APU additional registers
        else if (address == 0x4015 || address == 0x4017) {
            this.nes.apu.writeRegister(address, value);
        }
        //OAM DMA
        else if (address == 0x4014) {
            this.nes.ppu.OAM_DMA_Copy(value);
            this.nes.cpu.cycles = 513;
        }
        //Controller
        else if (address == 0x4016)
            this.inputCounter = 0;
        else
            this.ram[real_address] = value;
    }

    mapAddress(address: number): number {
        var real_address = address;

        //2KB of internal ram
        //mirrored 4 times
        if (address < 0x2000) {
            //use modulo to simulate mirroring
            if (address > 0x07FF) {
                real_address = address % 0x0800;
            }
        }

        //ppu registers 0x2000-0x2007
        //mirrored every 8 bytes
        else if (address >= 0x2000 && address < 0x4000) {
            if (address > 0x2008) {
                real_address = (address % 8) + 0x2000;
            }
        }
        //APU and I/O registers
        else if (address >= 0x4000 && address < 0x4018) {

        }

        return real_address;
    }


    //MAPPERS

    
    /*

        MMC1 Mapper

    */

    applyMapper1(address: number, value: number) {
        if (address >= 0x8000 && address <= 0x9FFF) {
            //MAPPER CONTROL
            //set mirroring,prg mode,chr mode
            var mirroring = value & 0x3,
                prgMode = (value & 0xc) >> 2,
                chrMode = (value & 0x10) >> 4;

            if (mirroring == 2)
                this.nes.cartridge.mirroring = Mirroring.VERTICAL
            if (mirroring == 3)
                this.nes.cartridge.mirroring = Mirroring.HORIZONTAL;
            this.prgMode = prgMode;
            this.chrMode = chrMode;
            this.setPRGBanks();

        }
        else if (address >= 0xA000 && address <= 0xBFFF) {
            //set chr bank 0
            this.chrBank0 = value;
            this.setCHRBanks();
        }
        else if (address >= 0xC000 && address <= 0xDFFF) {
            //set chr bank 1
            this.chrBank1 = value;
            this.setCHRBanks();
        }
        else if (address >= 0xE000 && address <= 0xFFFF) {
            //set prg bank
            let bank = value % 16; //only use first 4 bits, bit 5 controls prg ram
            this.prgBankSwitchable = bank;
            this.setPRGBanks();
        }

    }

    setPRGBanks() {

        switch (this.prgMode) {
            case 0:
                this.prgBank0offset = this.prgBankSwitchable * 16384;
                this.prgBank1offset = (this.prgBankSwitchable) * 16384;
                break;
            case 2:
                this.prgBank0offset = 0;
                this.prgBank1offset = this.prgBankSwitchable * 16384;
                break;
            case 3:
                this.prgBank0offset = this.prgBankSwitchable * 16384;
                this.prgBank1offset = (16384 * (this.prgBanksCount - 2));
                break;
        }

    }

    setCHRBanks() {
        switch (this.chrMode) {
            case 0:	//switch all 8kb
                this.chrBank1 = this.chrBank0 + 1;
                break;
            case 1: //switch 2 seperate 4kb banks
                break;
        }

        let chrOffset0 = (4 * 1024 * this.chrBank0);
        let chrOffset1 = (4 * 1024 * this.chrBank1);

        //bank0
        for (let i = 0; i < 4 * 1024; i++) {
            this.nes.cartridge.chrData[i] = this.nes.cartridge.chrDataAll[i + chrOffset0];
        }

        //bank1
        for (let i = 0; i < 4096; i++) {
            this.nes.cartridge.chrData[i + 4096] = this.nes.cartridge.chrDataAll[i + chrOffset1];
        }
    }



    /*
        MMC3 Mapper

        7  bit  0
        ---- ----
        CPMx xRRR
        |||   |||
        |||   +++- Specify which bank register to update on next write to Bank Data register
        |||        0: Select 2 KB CHR bank at PPU $0000-$07FF (or $1000-$17FF);
        |||        1: Select 2 KB CHR bank at PPU $0800-$0FFF (or $1800-$1FFF);
        |||        2: Select 1 KB CHR bank at PPU $1000-$13FF (or $0000-$03FF);
        |||        3: Select 1 KB CHR bank at PPU $1400-$17FF (or $0400-$07FF);
        |||        4: Select 1 KB CHR bank at PPU $1800-$1BFF (or $0800-$0BFF);
        |||        5: Select 1 KB CHR bank at PPU $1C00-$1FFF (or $0C00-$0FFF);
        |||        6: Select 8 KB PRG ROM bank at $8000-$9FFF (or $C000-$DFFF);
        |||        7: Select 8 KB PRG ROM bank at $A000-$BFFF
        ||+------- Nothing on the MMC3, see MMC6
        |+-------- PRG ROM bank mode (0: $8000-$9FFF swappable,
        |                                $C000-$DFFF fixed to second-last bank;
        |                             1: $C000-$DFFF swappable,
        |                                $8000-$9FFF fixed to second-last bank)
        +--------- CHR A12 inversion (0: two 2 KB banks at $0000-$0FFF,
                                        four 1 KB banks at $1000-$1FFF;
                                    1: two 2 KB banks at $1000-$1FFF,
                                        four 1 KB banks at $0000-$0FFF)
    */
    applyMapper3(address: number, value: number) {


        let odd = address % 2 != 0;
        if (address >= 0x8000 && address <= 0x9FFF) {

            if (odd) {
                //set banks

                //otherwise batman doesn't work
                //was not clear from nesdev at all


                if (this.mmc3BankSelect == 0){
                    // 0: Select 2 KB CHR bank at PPU $0000-$07FF (or $1000-$17FF);
                    let destinationOffset = 0;
                    let sourceOffset = value*1024;
                    if (this.mmc3ChrA12==1)
                        destinationOffset += 0x1000;
                    for (let i = 0; i < 0x800; i++) {
                        this.nes.cartridge.chrData[i+destinationOffset] = this.nes.cartridge.chrDataAll[i + sourceOffset];
                    }
                }else if (this.mmc3BankSelect == 1){
                    // 1: Select 2 KB CHR bank at PPU $0800-$0FFF (or $1800-$1FFF);
                    let destinationOffset = 0x800;
                    let sourceOffset = value*1024;
                    if (this.mmc3ChrA12==1)
                        destinationOffset += 0x1000;
                    for (let i = 0; i < 0x800; i++) {
                        this.nes.cartridge.chrData[i+destinationOffset] = this.nes.cartridge.chrDataAll[i + sourceOffset];
                    }
                }
                else if (this.mmc3BankSelect==2){
                    // 2: Select 1 KB CHR bank at PPU $1000-$13FF (or $0000-$03FF)
                    let destinationOffset = 0x1000;
                    let sourceOffset = value*1024;
                    if (this.mmc3ChrA12==1)
                        destinationOffset -= 0x1000;
                    for (let i = 0; i < 0x400; i++) {
                        this.nes.cartridge.chrData[i+destinationOffset] = this.nes.cartridge.chrDataAll[i + sourceOffset];
                    }
                }
                else if (this.mmc3BankSelect==3){
                    // 3: Select 1 KB CHR bank at PPU $1400-$17FF (or $0400-$07FF);
                    let destinationOffset = 0x1400;
                    let sourceOffset = value*1024;
                    if (this.mmc3ChrA12==1)
                        destinationOffset -= 0x1000;
                    for (let i = 0; i < 0x400; i++) {
                        this.nes.cartridge.chrData[i+destinationOffset] = this.nes.cartridge.chrDataAll[i + sourceOffset];
                    }
                }
                else if (this.mmc3BankSelect==4){
                    // 4: Select 1 KB CHR bank at PPU $1800-$1BFF (or $0800-$0BFF);
                    let destinationOffset = 0x1800;
                    let sourceOffset = value*1024;
                    if (this.mmc3ChrA12==1)
                        destinationOffset -= 0x1000;
                    for (let i = 0; i < 0x400; i++) {
                        this.nes.cartridge.chrData[i+destinationOffset] = this.nes.cartridge.chrDataAll[i + sourceOffset];
                    }
                }
                else if (this.mmc3BankSelect==5){
                    // 5: Select 1 KB CHR bank at PPU $1C00-$1FFF (or $0C00-$0FFF);
                    let destinationOffset = 0x1C00;
                    let sourceOffset = value*1024;
                    if (this.mmc3ChrA12==1)
                        destinationOffset -= 0x1000;
                    for (let i = 0; i < 0x400; i++) {
                        this.nes.cartridge.chrData[i+destinationOffset] = this.nes.cartridge.chrDataAll[i + sourceOffset];
                    }
                }
                else if (this.mmc3BankSelect == 6) {
                    // this.prgBank0offset = 8192 * Math.floor(value / 2) % this.nes.memory.prgBanksCount;
                    // this.prgBank0offset = 8192 * (value & ( (this.prgBanksCount*2) - 1 ));
                    value = value & ((this.prgBanksCount*2) - 1);
                    if (this.mmc3PrgMode == 0)
                        this.prgBank0offset = 8192 * value;
                    else
                        this.prgBank2offset = 8192 * (value-2);
                }else if (this.mmc3BankSelect == 7) {
                    // this.prgBank1offset = 8192 * Math.floor(value / 2) % this.nes.memory.prgBanksCount;
                    // this.prgBank1offset = 8192 * (value & ( (this.prgBanksCount*2) - 1 ));
                    value = value & ((this.prgBanksCount*2) - 1);
                    this.prgBank1offset = (8192 * (value-1));
                }

                //this was hell to debug
                // if (this.prgBank0offset==81920 && this.readyLogger==false)
                // {
                //     this.readyLogger = true;
                //     console.log('ready logger');
                // }
                // if (this.readyLogger && this.prgBank0offset==0)
                // {
                //     this.nes.cpu.startLogging = true;
                // }
                // console.log('bank 10');
                // if (this.prgBank1offset==8192)

                // let bank0 = (this.prgBank0offset/8192);
                // let bank1 = (this.prgBank1offset/8192);
                // console.log('Bank0: ' + bank0 + ' Bank1: ' + bank1);

                //     this.nes.cpu.startLogging = true;
                // {
                //     this.prgBank0offset = this.prgBank0offset = 8192 * 29
                // }
                // if (bank0==30)

            } else {
                //set bank mode
                this.mmc3BankSelect = value & 7; //right 3 bits
                this.mmc3PrgMode = BitHelper.getBit(value, 6);
                this.mmc3ChrA12 = BitHelper.getBit(value, 7);

                if (this.mmc3PrgMode == 0) {
                    // $8000-$9FFF swappable
                    // $C000-$DFFF fixed to second-last bank
                    this.prgBank2offset = (16384 * (this.prgBanksCount - 2));
                }
                else {
                    // $C000-$DFFF swappable
                    // $8000-$9FFF fixed to second-last bank
                    // this.prgBank0offset = (16384 * (this.prgBanksCount - 2));
                    this.prgBank0offset = (16384 * (this.prgBanksCount - 1));
                    // this.prgBank0offset = (8192*(this.prgBanksCount*2))-(8192*2);
                }
            }

        }
        else if (address >= 0xA000 && address <= 0xBFFF) {
            if (odd) {
                //set ram project
            } else {
                //set mirroring
                let mirroring = BitHelper.getBit(value,0);
                if (mirroring==0)
                    this.nes.cartridge.mirroring = Mirroring.VERTICAL;
                else
                    this.nes.cartridge.mirroring = Mirroring.HORIZONTAL; 
            }

        }
        else if (address >= 0xC000 && address <= 0xDFFF) {
            if ( odd ) {
				this.reloadIRQ();
			} else {
				this.irqLatch( value );
			}

        }
        else if (address >= 0xE000 && address <= 0xFFFF) {
            if (odd)
                this.enableIRQ();
            else
                this.disableIRQ();
        }

    }

    reloadIRQ() {
		this.irqReloadRequested = true;
	}

	irqLatch( value:number ) {
		this.irqCounterReset = value;
	}

	enableIRQ( ) {
		this.irqEnabled = true;
    }

    disableIRQ( ) {
		this.irqEnabled = false;
    }

    clockScanlineCounter() {
		if( this.irqReloadRequested || !this.irqCounter ) {
			this.irqCounter = this.irqCounterReset;
			this.irqReloadRequested = false;
		} else {
			this.irqCounter--;

			if ( !this.irqCounter && this.irqEnabled ) {
                //doesn't work in super mario bros 3
                if (!this.nes.isSmb3)
				    this.nes.cpu.irqRequest();
			}
		}
	}


    
}