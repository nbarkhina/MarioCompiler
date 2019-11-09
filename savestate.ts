import { Nes } from "./nes";

declare var toastr;

export class SaveState {

    //CPU
    A: number = 0;       // Accumulator Register
    X: number = 0;       // X Register
    Y: number = 0;       // Y Register
    STACK: number = 0;   // Stack Pointer (points to location on bus)
    PC: number = 0x8000;      // Program Counter (16 bit), hardcoded to start at 0x8000?
    STATUS: number = 0;  // Status Register
    address: number = 0;    // address to get data based on addressing mode
    cycles: number = 0;  // number of cpu cycles left for the current operation
    nmi_requested = false;
    irq_requested = false;

    //MEMORY
    ram: Uint8Array;
    saveRam: Uint8Array;

    //CARTRIDGE
    chrData:Uint8Array;

    //PPU
    vram: Uint8Array;
    scanline = -1;  //y coordinate of scanline
    tick = 0;       //x coordinate of scanline
    nametable_x = 0; //which nametable gets drawn first
    nametable_y = 0; //which nametable gets drawn first
    increment_mode = 0; //ppu to increment address by 1 or 32
    pattern_sprite = 0; //tells you whether to read sprite tiles from chr page 1 or 2
    pattern_background = 0; //tells you whether to read background tiles from chr page 1 or 2
    sprite_size = 0;
    slave_mode = 0; // unused
    enable_nmi = 0;
    greyscale = 0;
    show_background_leftmost = 0;
    show_sprites_leftmost = 0;
    show_background = 0;
    show_sprites = 0;
    emphasize_red = 0;
    emphasize_green = 0;
    emphasize_blue = 0;
    sprite_overflow = 0;
    sprite_zero_hit = 0;
    vertical_blank = 0; //period when tv laser is off screen
    scroll_x = 0; //ScrollX offset
    scroll_y = 0; //scrollY offset
    scroll_last = 0; //for address latch alternation
    marioHack = false;
    isMMC3 = false;
    ppu_data: number = 0;
    ppu_data_delay: number = 0; //reading from the ppu by the cpu is delayed by one cycle
    ppu_address: number = 0;
    ppu_address_lo_high = 0;
    oam: Uint8Array;
    oamAddress = 0;

    //MAPPERS
    prgBanksCount = 0;
    chrBanksCount = 0;
    mapper = 0;
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
    mmc3BankSelect = 0;
    mmc3PrgMode = 0;
    mmc3ChrA12 = 0;
    irqEnabled = false;
	irqCounter = 0;
	irqCounterReset = 0;
    irqReloadRequested = false;

    static save(nes: Nes, name: string) {

        let saveState = new SaveState();

        //ram (16kb)
        saveState.ram = new Uint8Array(0x4020);
        for (let i = 0; i < saveState.ram.length; i++)
            saveState.ram[i] = nes.memory.ram[i];

        //vram (16kb)
        saveState.vram = new Uint8Array(0x4000);
        for (let i = 0; i < saveState.vram.length; i++)
            saveState.vram[i] = nes.ppu.vram[i];

        //chr (8kb)
        saveState.chrData = new Uint8Array(8192);
        for (let i = 0; i < saveState.chrData.length; i++)
            saveState.chrData[i] = nes.cartridge.chrData[i];

        //sram (16kb) - only save 0x4000-0x8000
        saveState.saveRam = new Uint8Array(0x4000);
        for (let i = 0; i < 0x4000; i++)
            saveState.saveRam[i] = nes.memory.saveRam[i+0x4000];

        //CPU
        saveState.A = nes.cpu.A;
        saveState.X = nes.cpu.X;
        saveState.Y = nes.cpu.Y;
        saveState.STACK = nes.cpu.STACK;
        saveState.PC = nes.cpu.PC;
        saveState.STATUS = nes.cpu.STATUS;
        saveState.address = nes.cpu.address;
        saveState.cycles = nes.cpu.cycles;
        saveState.nmi_requested = nes.cpu.nmi_requested;
        saveState.irq_requested = nes.cpu.irq_requested;

        //PPU
        saveState.scanline = nes.ppu.scanline;
        saveState.tick = nes.ppu.tick;
        saveState.nametable_x = nes.ppu.nametable_x;
        saveState.nametable_y = nes.ppu.nametable_y;
        saveState.increment_mode = nes.ppu.increment_mode;
        saveState.pattern_sprite = nes.ppu.pattern_sprite;
        saveState.pattern_background = nes.ppu.pattern_background;
        saveState.sprite_size = nes.ppu.sprite_size;
        saveState.slave_mode = nes.ppu.slave_mode;
        saveState.enable_nmi = nes.ppu.enable_nmi;
        saveState.greyscale = nes.ppu.greyscale;
        saveState.show_background_leftmost = nes.ppu.show_background_leftmost;
        saveState.show_sprites_leftmost = nes.ppu.show_sprites_leftmost;
        saveState.show_background = nes.ppu.show_background;
        saveState.show_sprites = nes.ppu.show_sprites;
        saveState.emphasize_red = nes.ppu.emphasize_red;
        saveState.emphasize_green = nes.ppu.emphasize_green;
        saveState.emphasize_blue = nes.ppu.emphasize_blue;
        saveState.sprite_overflow = nes.ppu.sprite_overflow;
        saveState.sprite_zero_hit = nes.ppu.sprite_zero_hit;
        saveState.vertical_blank = nes.ppu.vertical_blank;
        saveState.scroll_x = nes.ppu.scroll_x;
        saveState.scroll_y = nes.ppu.scroll_y;
        saveState.scroll_last = nes.ppu.scroll_last;
        saveState.marioHack = nes.ppu.marioHack;
        saveState.isMMC3 = nes.ppu.isMMC3;
        saveState.ppu_data = nes.ppu.ppu_data;
        saveState.ppu_data_delay = nes.ppu.ppu_data_delay;
        saveState.ppu_address = nes.ppu.ppu_address;
        saveState.ppu_address_lo_high = nes.ppu.ppu_address_lo_high;
        saveState.scroll_y = nes.ppu.scroll_y;
        saveState.oam = nes.ppu.oam;
        saveState.oamAddress = nes.ppu.oamAddress;

        //MAPPERS
        saveState.prgBanksCount = nes.memory.prgBanksCount;
        saveState.chrBanksCount = nes.memory.chrBanksCount;
        saveState.mapper = nes.memory.mapper;
        saveState.prgMode = nes.memory.prgMode;
        saveState.prgBankSwitchable = nes.memory.prgBankSwitchable;
        saveState.prgBank0offset = nes.memory.prgBank0offset;
        saveState.prgBank1offset = nes.memory.prgBank1offset;
        saveState.prgBank2offset = nes.memory.prgBank2offset;
        saveState.prgBank3offset = nes.memory.prgBank3offset;
        saveState.chrMode = nes.memory.chrMode;
        saveState.chrBank0 = nes.memory.chrBank0;
        saveState.chrBank1 = nes.memory.chrBank1;
        saveState.mapperShiftRegister = nes.memory.mapperShiftRegister;
        saveState.mapperWriteCount = nes.memory.mapperWriteCount;
        saveState.mmc3BankSelect = nes.memory.mmc3BankSelect;
        saveState.mmc3PrgMode = nes.memory.mmc3PrgMode;
        saveState.mmc3ChrA12 = nes.memory.mmc3ChrA12;
        saveState.irqEnabled = nes.memory.irqEnabled;
        saveState.irqCounter = nes.memory.irqCounter;
        saveState.irqCounterReset = nes.memory.irqCounterReset;
        saveState.irqReloadRequested = nes.memory.irqReloadRequested;





        var request = indexedDB.open('NeilNESDB');
        request.onsuccess = function (ev: any) {
            var db = ev.target.result as IDBDatabase;
            var romStore = db.transaction("NESROMS", "readwrite").objectStore("NESROMS");
            var addRequest = romStore.put(saveState, name + '.sav');
            addRequest.onsuccess = function (event) {
                console.log('data added');
                window["saveState"] = saveState;
            };
            addRequest.onerror = function (event) {
                console.log('error adding data');
                console.log(event);
            };
        }

    }


    static load(nes: Nes, name: string) {

        var request = indexedDB.open('NeilNESDB');
        request.onsuccess = function (ev: any) {
            var db = ev.target.result as IDBDatabase;
            var romStore = db.transaction("NESROMS", "readwrite").objectStore("NESROMS");
            var rom = romStore.get(name + '.sav');
            rom.onsuccess = function (event) {
                if (rom.result==null || rom.result==undefined)
                {
                    toastr.error("No Save Found");
                }
                else
                {
                    let saveStateData = rom.result as SaveState;
                    nes.loadStateData = saveStateData;
                    console.log('data pulled from db');
                    window["saveState"] = saveStateData;
                }
                
            };
            rom.onerror = function (event) {
                console.log('error getting save state data from store');
            }
        }
        request.onerror = function (ev: any) {
            console.log('error loading db');
        }
    }

    static parseLoad(nes: Nes,saveState:SaveState){

        for (let i = 0; i < 0x4020; i++)
            nes.memory.ram[i] = saveState.ram[i];

        for (let i = 0; i < 0x4000; i++)
            nes.ppu.vram[i] = saveState.vram[i];

        for (let i = 0; i < 8192; i++)
            nes.cartridge.chrData[i] = saveState.chrData[i];

        for (let i = 0; i < 0x4000; i++)
            nes.memory.saveRam[i+0x4000] = saveState.saveRam[i];

        //CPU
        nes.cpu.A = saveState.A;
        nes.cpu.X = saveState.X;
        nes.cpu.Y = saveState.Y;
        nes.cpu.STACK = saveState.STACK;
        nes.cpu.PC = saveState.PC;
        nes.cpu.STATUS = saveState.STATUS;
        nes.cpu.address = saveState.address;
        nes.cpu.cycles = saveState.cycles;
        nes.cpu.nmi_requested = saveState.nmi_requested;
        nes.cpu.irq_requested = saveState.irq_requested;

        //PPU
        nes.ppu.scanline = saveState.scanline;
        nes.ppu.tick = saveState.tick;
        nes.ppu.nametable_x = saveState.nametable_x;
        nes.ppu.nametable_y = saveState.nametable_y;
        nes.ppu.increment_mode = saveState.increment_mode;
        nes.ppu.pattern_sprite = saveState.pattern_sprite;
        nes.ppu.pattern_background = saveState.pattern_background;
        nes.ppu.sprite_size = saveState.sprite_size;
        nes.ppu.slave_mode = saveState.slave_mode;
        nes.ppu.enable_nmi = saveState.enable_nmi;
        nes.ppu.greyscale = saveState.greyscale;
        nes.ppu.show_background_leftmost = saveState.show_background_leftmost;
        nes.ppu.show_sprites_leftmost = saveState.show_sprites_leftmost;
        nes.ppu.show_background = saveState.show_background;
        nes.ppu.show_sprites = saveState.show_sprites;
        nes.ppu.emphasize_red = saveState.emphasize_red;
        nes.ppu.emphasize_green = saveState.emphasize_green;
        nes.ppu.emphasize_blue = saveState.emphasize_blue;
        nes.ppu.sprite_overflow = saveState.sprite_overflow;
        nes.ppu.sprite_zero_hit = saveState.sprite_zero_hit;
        nes.ppu.vertical_blank = saveState.vertical_blank;
        nes.ppu.scroll_x = saveState.scroll_x;
        nes.ppu.scroll_y = saveState.scroll_y;
        nes.ppu.scroll_last = saveState.scroll_last;
        nes.ppu.marioHack = saveState.marioHack;
        nes.ppu.isMMC3 = saveState.isMMC3;
        nes.ppu.ppu_data = saveState.ppu_data;
        nes.ppu.ppu_data_delay = saveState.ppu_data_delay;
        nes.ppu.ppu_address = saveState.ppu_address;
        nes.ppu.ppu_address_lo_high = saveState.ppu_address_lo_high;
        nes.ppu.scroll_y = saveState.scroll_y;
        nes.ppu.oam = saveState.oam;
        nes.ppu.oamAddress = saveState.oamAddress;

        //MAPPERS
        nes.memory.prgBanksCount = saveState.prgBanksCount;
        nes.memory.chrBanksCount = saveState.chrBanksCount;
        nes.memory.mapper = saveState.mapper;
        nes.memory.prgMode = saveState.prgMode;
        nes.memory.prgBankSwitchable = saveState.prgBankSwitchable;
        nes.memory.prgBank0offset = saveState.prgBank0offset;
        nes.memory.prgBank1offset = saveState.prgBank1offset;
        nes.memory.prgBank2offset = saveState.prgBank2offset;
        nes.memory.prgBank3offset = saveState.prgBank3offset;
        nes.memory.chrMode = saveState.chrMode;
        nes.memory.chrBank0 = saveState.chrBank0;
        nes.memory.chrBank1 = saveState.chrBank1;
        nes.memory.mapperShiftRegister = saveState.mapperShiftRegister;
        nes.memory.mapperWriteCount = saveState.mapperWriteCount;
        nes.memory.mmc3BankSelect = saveState.mmc3BankSelect;
        nes.memory.mmc3PrgMode = saveState.mmc3PrgMode;
        nes.memory.mmc3ChrA12 = saveState.mmc3ChrA12;
        nes.memory.irqEnabled = saveState.irqEnabled;
        nes.memory.irqCounter = saveState.irqCounter;
        nes.memory.irqCounterReset = saveState.irqCounterReset;
        nes.memory.irqReloadRequested = saveState.irqReloadRequested;

        //for backwards compatibility with
        //older savestates before i switched
        //to single ppu.clock() cycle vs 3
        if (nes.ppu.tick%3!=0)
        {
            nes.ppu.tick -= nes.ppu.tick%3;
        }

        console.log('data loaded');
    }

    static reset(nes: Nes){
        for (let i = 0; i < 0x4020; i++)
            nes.memory.ram[i] = 0;

        for (let i = 0; i < 0x4000; i++)
            nes.ppu.vram[i] = 0;

        for (let i = 0; i < 8192; i++)
            nes.cartridge.chrData[i] = 0;

        for (let i = 0; i < 0x4000; i++)
            nes.memory.saveRam[i+0x4000] = 0;

        for (let i = 0; i < nes.ppu.oam.length; i++)
            nes.ppu.oam[i] = 0x00;

        //CPU
        nes.cpu.A = 0;
        nes.cpu.X = 0;
        nes.cpu.Y = 0;
        nes.cpu.STACK = 0;
        nes.cpu.PC = 0;
        nes.cpu.STATUS = 0;
        nes.cpu.address = 0;
        nes.cpu.cycles =0;
        nes.cpu.nmi_requested = false;
        nes.cpu.irq_requested = false;

        //PPU
        nes.ppu.scanline = -1;
        nes.ppu.tick = 0;
        nes.ppu.nametable_x = 0;
        nes.ppu.nametable_y = 0;
        nes.ppu.increment_mode = 0;
        nes.ppu.pattern_sprite = 0;
        nes.ppu.pattern_background = 0;
        nes.ppu.sprite_size = 0;
        nes.ppu.slave_mode = 0;
        nes.ppu.enable_nmi = 0;
        nes.ppu.greyscale = 0;
        nes.ppu.show_background_leftmost = 0;
        nes.ppu.show_sprites_leftmost = 0;
        nes.ppu.show_background = 0;
        nes.ppu.show_sprites = 0;
        nes.ppu.emphasize_red = 0;
        nes.ppu.emphasize_green = 0;
        nes.ppu.emphasize_blue = 0;
        nes.ppu.sprite_overflow = 0;
        nes.ppu.sprite_zero_hit = 0;
        nes.ppu.vertical_blank = 0;
        nes.ppu.scroll_x = 0;
        nes.ppu.scroll_y = 0;
        nes.ppu.scroll_last = 0;
        nes.ppu.ppu_data = 0;
        nes.ppu.ppu_data_delay = 0;
        nes.ppu.ppu_address = 0;
        nes.ppu.ppu_address_lo_high = 0;
        nes.ppu.scroll_y = 0;
        nes.ppu.oamAddress = 0;

    }
}