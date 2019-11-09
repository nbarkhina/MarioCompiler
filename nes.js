define(["require", "exports", "./cpu", "./memory", "./cartridge", "./ppu", "./fps_controller", "./video", "./bithelper", "./apu", "./savestate"], function (require, exports, cpu_1, memory_1, cartridge_1, ppu_1, fps_controller_1, video_1, bithelper_1, apu_1, savestate_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Nes {
        constructor() {
            this.SCREEN_WIDTH = 256;
            this.SCREEN_HEIGHT = 240;
            this.SCREEN_DEBUG_WIDTH = 400;
            this.SCREEN_DEBUG_HEIGHT = 300;
            this.rom_name = '';
            //debug
            this.DEBUGMODE = false;
            this.PAUSED = true;
            this.SAMPLEPROGRAM = false;
            this.error_message = '';
            this.reverseSpriteOrder = false; //if we should read oam backwards for priority
            this.debug_view_chr = false;
            this.debug_view_nametable = true;
            this.debugNametable = 1; //which nametable is viewed on debug screen
            this.debugDisableSprites = false;
            this.debugProgram = ''; //view stats via rivets
            this.debugMemory = ''; //view stats via rivets
            this.debugStats = ''; //view stats via rivets
            this.debugMemPage = 0; //which page of memory map to view
            this.debugSoundMode = false;
            this.debugSquare1Visual = '';
            this.debugSquare2Visual = '';
            this.debugTriangleVisual = '';
            this.debugSquare1Note = '';
            this.debugSquare2Note = '';
            this.debugTriangleNote = '';
            this.debugSoundStats = ''; //view sound stats
            //nestest rom
            this.nestestlog = [];
            this.nestestlogstatus = [];
            this.nestestcounter = 0;
            this.nestestlogmode = false; //ALSO GO TO CPU UNCOMMENT CYCLES
            this.nestestframecounter = 0; //SHOULD REACH LINE 5003 TO PASS
            //ALSO GO TO frame() AND UNCOMMENT nestestlogmode CHECK
            //performance tuning
            this.timeDiff = 0;
            this.timeCalc = 0;
            //hacks
            this.isSmb3 = false;
            this.SEIJumpMode = false;
            this.saveStateRequested = false;
            this.loadStateRequested = false;
            this.reloadStateRequested = false;
            this.loadStateData = null;
            this.recordMusicMode = false;
            this.recordMusicArray = [];
            this.playBackMusicMode = false;
            this.playBackMusicCounter = 0;
            this.memory = new memory_1.Memory(this);
            this.cpu = new cpu_1.CPU(this);
            this.ppu = new ppu_1.PPU(this);
            this.cartridge = new cartridge_1.Cartridge(this);
            this.apu = new apu_1.APU(this);
            this.fps_controller = new fps_controller_1.FPSController(60);
            if (this.nestestlogmode) {
                this.btnReadLog();
            }
        }
        initCanvases() {
            //init canvases
            this.canvas = $('#canvas')[0];
            this.canvas_ctx = this.canvas.getContext("2d");
            this.canvasImage = this.canvas_ctx.getImageData(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
            this.canvas_ctx.fillStyle = "black";
            this.canvas_ctx.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
            if (this.DEBUGMODE) {
                this.enableDebugCanvas();
            }
            //initialize pixelData
            this.SCREEN_MAIN = new video_1.VideoScreen(this.SCREEN_WIDTH, this.SCREEN_HEIGHT, this.canvas_ctx, this);
        }
        enableDebugMode() {
            this.DEBUGMODE = true;
            setTimeout(() => {
                this.enableDebugCanvas();
                document.getElementById('divMonOuter').classList.replace("col-sm-8", "col-sm-12");
                document.getElementById('divEmuOuter').classList.replace("col-sm-4", "col-sm-12");
            }, 1000);
        }
        enableDebugCanvas() {
            this.canvasDebug = $('#canvasDebug')[0];
            this.canvasDebug_ctx = this.canvasDebug.getContext("2d");
            this.canvasDebug_Image = this.canvasDebug_ctx.getImageData(0, 0, this.SCREEN_DEBUG_WIDTH, this.SCREEN_DEBUG_HEIGHT);
            this.canvasDebug_ctx.fillStyle = "black";
            this.canvasDebug_ctx.fillRect(0, 0, this.SCREEN_DEBUG_WIDTH, this.SCREEN_DEBUG_HEIGHT);
            this.SCREEN_DEBUG = new video_1.VideoScreen(this.SCREEN_DEBUG_WIDTH, this.SCREEN_DEBUG_HEIGHT, this.canvasDebug_ctx, this);
        }
        btnReadLog() {
            $.get('nestest.log.txt').then((data) => {
                console.log('data read');
                var lines = data.split('\r\n');
                lines.forEach(line => {
                    var address = line.substr(0, 4);
                    this.nestestlog.push(address);
                    var status = line.substr(line.indexOf('P:')).substr(2, 2);
                    this.nestestlogstatus.push(status);
                });
            });
        }
        loadROM(rom_data, rom_name) {
            console.log('rom length', rom_data.length);
            this.rom_name = rom_name;
            if (this.SAMPLEPROGRAM) {
                //for testing
                this.loadSampleProgram();
            }
            else {
                this.cartridge.load(rom_data);
            }
            //call the reset function on the cpu
            this.cpu.reset();
            if (this.nestestlogmode) {
                this.cpu.PC = 0xC000;
                if (this.DEBUGMODE)
                    this.cpu.getNextInstructionForDebug();
            }
        }
        /*
            SAMPLE PROGRAM TO MULTIPLY 10x3 and using a loop then store the result in 0x8040
    
            *=$8000
            LDX #10
            STX $8020
            LDX #3
            STX $8030
            LDY $8020
            LDA #0
            CLC
            loop
            ADC $8030
            DEY
            BNE loop
            STA $8040
            NOP
            NOP
            NOP
        */
        //online emulator here for testing
        //Note: set start address and program counter 
        //to 8000 before pasting code
        //https://www.masswerk.at/6502/index.html
        loadSampleProgram() {
            //all tests assume program counter starts at location 0x8000
            //test program 1 - multiple 3x10
            // var program = "A2 0A 8E 20 80 A2 03 8E 30 80 AC 20 80 A9 00 18 6D 30 80 88 D0 FA 8D 40 80 EA EA EA";
            //test program 2 - subtraction test 10-5 = 5
            // var program = "A9 0A 38 E9 05 8D 20 80 EA";
            //test program 3 - subtraction test going negative 5-10 = 251 or 0xFB
            // var program = "A9 05 38 E9 0A 8D 20 80 EA";
            //test program 4 - test ASL arithmetic shift left
            // var program = "A9 40 8D 20 80 0E 20 80 0E 20 80 0E 20 80 0E 20 80 EA";  
            //test program 5 - test jump to subroutine, return, adds 5+7 and copies to x and y registers
            var program = "A9 05 20 09 80 AA 4C 0C 80 69 07 60 A8 EA";
            //test program 6 - rotate left and rotate right the value 5. test that carry bit is set on last ROR
            // var program = "A9 05 2A 6A 6A EA";
            //test program 7 - rotate left and right number 129 (10000001) - observe carry bit
            // var program = "A9 81 2A 6A 6A EA";
            //test program 8 - ROL and ROR with absolute addressing, at the end copies result to accumulator
            // var program = "A2 81 8E 20 80 2E 20 80 6E 20 80 6E 20 80 AD 20 80 EA";
            var codes = program.split(" ");
            var counter = 0x8000;
            for (let i = 0; i < codes.length; i++) {
                let code = parseInt(codes[i], 16);
                this.memory.write(counter, code);
                counter++;
            }
            //set reset vector
            this.memory.write(0xFFFC, 0x00);
            this.memory.write(0xFFFD, 0x80);
            this.debugMemPage = 0x8000;
        }
        SEIJump() {
            this.SEIJumpMode = true;
        }
        frame() {
            let perfCheck = window.performance.now();
            if (this.fps_controller.frame_limiter_enabled) {
                if (this.fps_controller.IsFrameReady() == false)
                    return;
            }
            this.fps_controller.countFPS();
            // let cycle_counter = 0; //for debugging
            if (!this.PAUSED) {
                while (this.ppu.frame_complete == false) {
                    //EXPENSIVE
                    // if (this.nestestlogmode)
                    //     this.compareNesTestLog();
                    this.cpu.clock();
                    //ppu is clocked at 3 times the speed of the cpu
                    this.ppu.clock();
                    // this.ppu.clock();
                    // this.ppu.clock();
                    // cycle_counter++;
                }
                this.ppu.frame_complete = false;
                //audio - every half frame
                this.apu.halfFrame();
                this.apu.halfFrame();
                //set volumes after all's said and done
                //to avoid crackling sound
                this.apu.adjustVolumes();
            }
            else {
                //so i can easily step through without waiting on cycles
                this.cpu.cycles = 0;
            }
            if (this.SEIJumpMode) {
                let seifound = false;
                while (seifound == false) {
                    //EXPENSIVE
                    // if (this.nestestlogmode)
                    //     this.compareNesTestLog();
                    this.cpu.clock();
                    //ppu is clocked at 3 times the speed of the cpu
                    this.ppu.clock();
                    // this.ppu.clock();
                    // this.ppu.clock();
                    // cycle_counter++;
                    this.cpu.getNextInstructionForDebug();
                    if (this.cpu.next_op == "SEI") {
                        seifound = true;
                    }
                }
                this.SEIJumpMode = false;
                this.PAUSED = true;
            }
            //for running 10x3 sample asm 
            if (this.SAMPLEPROGRAM) {
                this.cpu.getNextInstructionForDebug();
                this.cpu.updateHexDebugValues();
                this.drawDebugInfo();
                return;
            }
            //if recording music mode is on
            this.processRecordMusic();
            // this.render();
            if (this.DEBUGMODE) {
                this.cpu.getNextInstructionForDebug();
                this.cpu.updateHexDebugValues();
                this.drawDebugInfo();
                this.drawDebugScreen();
            }
            //page swap the image buffers onto the canvases
            this.applyScreenBuffers();
            //for calculating how many milliseconds to run each frame()
            this.timeCalc++;
            if (this.timeCalc % 60 == 0)
                this.timeDiff = window.performance.now() - perfCheck;
            //process load/save states
            this.load_state_process();
            this.drawFPS();
        }
        saveState() {
            this.saveStateRequested = true;
        }
        loadState() {
            this.loadStateRequested = true;
        }
        reloadState() {
            this.reloadStateRequested = true;
        }
        load_state_process() {
            if (this.saveStateRequested) {
                savestate_1.SaveState.save(this, this.rom_name);
                this.saveStateRequested = false;
                toastr.info("State Saved");
            }
            if (this.loadStateRequested) {
                savestate_1.SaveState.load(this, this.rom_name);
                this.loadStateRequested = false;
            }
            if (this.reloadStateRequested) {
                savestate_1.SaveState.reset(this);
                this.cartridge.load(this.reload_rom_data);
                this.cpu.reset();
                this.reloadStateRequested = false;
            }
            if (this.loadStateData != null) {
                //reset it back to null so it only does it once
                //at the end of a frame if there is any data 
                //to load after the indexedDB async call returns
                savestate_1.SaveState.parseLoad(this, this.loadStateData);
                this.loadStateData = null;
            }
        }
        drawFPS() {
            let x = 195;
            let y = 220;
            let w = 50;
            let h = 15;
            this.SCREEN_MAIN.drawBox(x, y, w, h, "white");
            this.SCREEN_MAIN.drawText("FPS: " + this.fps_controller.currentfps, x + 2, y + 12, "red");
            this.SCREEN_MAIN.drawBox(x, y - 34, w, h, "white");
            this.SCREEN_MAIN.drawText("" + this.timeDiff.toFixed(3), x + 2, y - 22, "red");
        }
        render() {
            this.drawBackground(0);
            this.drawBackground(1);
            if (this.debugDisableSprites == false)
                this.drawSprites();
        }
        drawSprites() {
            let startingSprite = 0;
            let counter = 0;
            if (this.reverseSpriteOrder)
                counter = 63 * 4;
            //hack for super mario to not draw sprite 0
            if (this.rom_name == "smb.nes") {
                startingSprite = 1;
                counter = 4;
            }
            for (let i = startingSprite; i < 64; i++) {
                //byte 0 - y position
                //byte 1 - tile number (0-255)
                //byte 2 - attributes
                //bute 3 - x position
                //Y POSITION LOOKS LIKE ITS 1 DOWN
                let y_position = this.ppu.oam[counter] + 1;
                let tile_number = this.ppu.oam[counter + 1];
                let attributes = this.ppu.oam[counter + 2];
                let x_position = this.ppu.oam[counter + 3];
                if (x_position < 0 || x_position >= this.SCREEN_MAIN.SCREEN_WIDTH ||
                    y_position < 0 || y_position >= this.SCREEN_MAIN.SCREEN_HEIGHT) {
                    //don't render it's off screen
                }
                else {
                    //8x8 Tiles Mode
                    if (this.ppu.sprite_size == 0) {
                        let offset = 0;
                        //hack
                        if (this.rom_name != 'ducktales.nes') {
                            if (this.ppu.pattern_sprite == 1)
                                offset = 256 * 16;
                        }
                        this.ppu.renderTile((tile_number * 16) + offset, x_position, y_position, this.SCREEN_MAIN, 0, 0, null, null, attributes);
                    }
                    //8x16 Tiles Mode
                    else {
                        //https://wiki.nesdev.com/w/index.php/PPU_OAM
                        let tile_byte = this.ppu.oam[counter + 1];
                        tile_number = tile_byte & 254; //left 7 bits
                        let chr_table = bithelper_1.BitHelper.getBit(tile_byte, 0);
                        if (chr_table == 1)
                            tile_number += 256;
                        let tile1 = tile_number;
                        let tile2 = tile_number + 1;
                        let flip_v = bithelper_1.BitHelper.getBit(attributes, 7);
                        if (flip_v) {
                            tile1 = tile_number + 1;
                            tile2 = tile_number;
                        }
                        //top tile
                        this.ppu.renderTile(tile1 * 16, x_position, y_position, this.SCREEN_MAIN, 0, 0, null, null, attributes);
                        //bottom tile
                        this.ppu.renderTile(tile2 * 16, x_position, y_position + 8, this.SCREEN_MAIN, 0, 0, null, null, attributes);
                    }
                }
                if (this.reverseSpriteOrder)
                    counter -= 4;
                else
                    counter += 4;
            }
        }
        drawBackground(nameTable) {
            //TODO move these to the ppu class
            //SCROLLING
            //precalculate this before calling render tile
            //greatly improves performance
            //figure out where the pixel will ultimately be,
            //taking into account scrolling
            let scrolladjust_y = 0;
            let scrolladjust_x = 0;
            if (this.cartridge.mirroring == cartridge_1.Mirroring.HORIZONTAL) //ice climber style up_down
             {
                if (nameTable == 0 && this.ppu.nametable_y == 0)
                    scrolladjust_y = 0;
                if (nameTable == 0 && this.ppu.nametable_y == 1)
                    scrolladjust_y = 240;
                if (nameTable == 1 && this.ppu.nametable_y == 0)
                    scrolladjust_y = 240;
                if (nameTable == 1 && this.ppu.nametable_y == 1)
                    scrolladjust_y = 0;
            }
            if (this.cartridge.mirroring == cartridge_1.Mirroring.VERTICAL) //mario style left_right
             {
                if (nameTable == 0 && this.ppu.nametable_x == 0)
                    scrolladjust_x = 0;
                if (nameTable == 0 && this.ppu.nametable_x == 1)
                    scrolladjust_x = 256;
                if (nameTable == 1 && this.ppu.nametable_x == 0)
                    scrolladjust_x = 256;
                if (nameTable == 1 && this.ppu.nametable_x == 1)
                    scrolladjust_x = 0;
            }
            scrolladjust_x -= this.ppu.scroll_x;
            scrolladjust_y -= this.ppu.scroll_y;
            let scrollXStore = scrolladjust_x;
            let nameTableCounter = 0;
            for (let y = 0; y < 30; y++) {
                for (let x = 0; x < 32; x++) {
                    //smb sprite zero scroll hack
                    if (this.rom_name == "smb.nes") {
                        if (y < 4) {
                            if (nameTable == 0)
                                scrolladjust_x = 0;
                            if (nameTable == 1)
                                scrolladjust_x = 256;
                        }
                        else
                            scrolladjust_x = scrollXStore;
                    }
                    let isOffScreen = false;
                    let x_screen = (x * 8) + scrolladjust_x;
                    let y_screen = (y * 8) + scrolladjust_y;
                    //first pass check
                    if (x_screen < -8 || x_screen >= this.SCREEN_WIDTH || y_screen < -8 || y_screen >= this.SCREEN_HEIGHT)
                        isOffScreen = true;
                    let wraparound_x = 0;
                    let wraparound_y = 0;
                    //WRAPAROUND
                    //currently only handles the 2 most common
                    //types of wraparound when it is
                    //updating the last row of tiles as you're walking
                    //examples - Double Dragon, Castlevania 2
                    if (isOffScreen) {
                        if (this.cartridge.mirroring == cartridge_1.Mirroring.HORIZONTAL) //ice climber style up_down
                         {
                            if (x_screen < 0)
                                wraparound_x += 256;
                        }
                        if (this.cartridge.mirroring == cartridge_1.Mirroring.VERTICAL) //mario style left_right
                         {
                            if (y_screen < 0)
                                wraparound_y += 240;
                        }
                        isOffScreen = false;
                        x_screen += wraparound_x;
                        y_screen += wraparound_y;
                        //second pass check
                        if (x_screen < -8 || x_screen >= this.SCREEN_WIDTH || y_screen < -8 || y_screen >= this.SCREEN_HEIGHT)
                            isOffScreen = true;
                    }
                    if (!isOffScreen) {
                        let nametable_offset = 0;
                        if (nameTable == 1) {
                            //TODO implement proper single screen
                            //mirroring - currently doing special
                            //case for mapper 7 - fix for jeopardy
                            if (this.cartridge.mirroring == cartridge_1.Mirroring.VERTICAL || this.cartridge.mapperType == 7)
                                nametable_offset += 0x400;
                            else
                                nametable_offset += 0x800;
                        }
                        let byte = this.ppu.readVRAM(0x2000 + nametable_offset + nameTableCounter);
                        let offset = 0;
                        if (this.ppu.pattern_background == 1)
                            offset = 256 * 16;
                        this.ppu.renderTile((byte * 16) + offset, x * 8, y * 8, this.SCREEN_MAIN, scrolladjust_x + wraparound_x, scrolladjust_y + wraparound_y, nameTableCounter, nameTable);
                    }
                    nameTableCounter++;
                }
            }
        }
        applyScreenBuffers() {
            this.canvasImage.data.set(this.SCREEN_MAIN.pixel_data);
            this.canvas_ctx.putImageData(this.canvasImage, 0, 0);
            if (this.DEBUGMODE) {
                this.canvasDebug_Image.data.set(this.SCREEN_DEBUG.pixel_data);
                this.canvasDebug_ctx.putImageData(this.canvasDebug_Image, 0, 0);
            }
        }
        drawDebugScreen() {
            let x = 0, y = 0;
            //DRAW SECOND NAMETABLE
            if (this.debug_view_nametable) {
                let nameTableCounter = 0;
                for (let y = 0; y < 30; y++) {
                    for (let x = 0; x < 32; x++) {
                        let nametable_offset = 0;
                        if (this.debugNametable == 1) {
                            if (this.cartridge.mirroring == cartridge_1.Mirroring.VERTICAL)
                                nametable_offset += 0x400;
                            else
                                nametable_offset += 0x800;
                        }
                        let byte = this.ppu.readVRAM(0x2000 + nametable_offset + nameTableCounter);
                        let offset = 0;
                        if (this.ppu.pattern_background == 1)
                            offset = 256 * 16;
                        this.ppu.renderTile((byte * 16) + offset, x * 8, (y * 8), this.SCREEN_DEBUG, 0, 0, nameTableCounter, this.debugNametable);
                        nameTableCounter++;
                    }
                }
            }
            if (this.debug_view_chr) {
                //DRAW FULL PALETTE
                //EXPENSIVE
                // for (let i = 0; i < this.ppu.palette.length; i++) {
                //     this.SCREEN_DEBUG.drawSquareOnBuffer(x * 20, y * 20, 20, this.ppu.palette[i]);
                //     //move to next row
                //     x++;
                //     if (x == 16) {
                //         x = 0;
                //         y++;
                //     }
                // }
                //DRAW CHR SPRITES
                x = 0;
                y = 150;
                for (let i = 0; i < 256; i++) {
                    this.ppu.renderTile(i * 16, x, y, this.SCREEN_DEBUG, 0, 0);
                    x += 8;
                    if (x == 8 * 16) {
                        x = 0;
                        y += 8;
                    }
                }
                x = 0;
                y = 150;
                for (let i = 256; i < 512; i++) {
                    this.ppu.renderTile(i * 16, x + 128, y, this.SCREEN_DEBUG, 0, 0);
                    x += 8;
                    if (x == 8 * 16) {
                        x = 0;
                        y += 8;
                    }
                }
            }
            //DRAW CURRENT PALETTES
            y = 285;
            for (let i = 0; i < 32; i++) {
                this.SCREEN_DEBUG.drawSquareOnBuffer(i * 10, y, 10, this.ppu.getPaletteColor(i));
            }
        }
        stepDebugMode() {
            if (this.nestestlogmode)
                this.compareNesTestLog();
            this.cpu.clock();
            //ppu is clocked at 3 times the speed of the cpu
            this.ppu.clock();
            // this.ppu.clock();
            // this.ppu.clock();
        }
        compareNesTestLog() {
            if (this.nestestlogmode) {
                this.nestestframecounter++;
                //only do 60 a frame rather than the usual 30,000 frame cycles
                if (this.nestestframecounter > 60) {
                    this.ppu.frame_complete = true;
                    this.nestestframecounter = 0;
                }
                //check address
                var compare1 = this.nestestlog[this.nestestcounter];
                var compare2 = this.cpu.PC.toString(16).toUpperCase();
                //pad with zeroes so it lines up
                if (compare2.length == 3)
                    compare2 = '0' + compare2;
                if (compare1 == compare2) {
                    console.log(this.nestestcounter + ') matches: ' + compare1 + ' ' + compare2);
                }
                else {
                    console.log('ADDRESS does not match epected(' + compare1 + ') received (' + compare2 + ')');
                    this.PAUSED = true;
                }
                //check status
                compare1 = this.nestestlogstatus[this.nestestcounter];
                compare2 = this.cpu.STATUS.toString(16).toUpperCase();
                if (compare1 == compare2) {
                    // this.nestestcounter++;
                    // console.log('matches: ' + compare1 + ' ' + compare2);
                }
                else {
                    console.log('STATUS does not match epected(' + compare1 + ') received (' + compare2 + ')');
                    this.PAUSED = true;
                }
                this.nestestcounter++;
            }
        }
        drawDebugInfo() {
            let program_current_location = 0x8000;
            let program = '';
            let memory = '';
            let stats = '';
            let soundStats = '';
            //draw memory
            // Program Counter
            // current_page = this.cpu.PC - (this.cpu.PC % 256);
            // for (let i = 0; i < 16; i++) {
            //     memory += '$' + current_page.toString(16) + ': ';
            //     for (let j = 0; j < 16; j++) {
            //         let byte = this.memory.read(current_page).toString(16) + ' ';
            //         if (byte.length == 2)
            //             byte = '0' + byte;
            //         if (current_page == this.cpu.PC)
            //             byte = "<b style='background-color: yellow;'>" + byte + '</b>';
            //         memory += byte;
            //         current_page++;;
            //     }
            //     memory += '<br>';
            // }
            // Zero Page
            program_current_location = this.debugMemPage;
            for (let i = 0; i < 16; i++) {
                if (program_current_location.toString(16).length == 1)
                    memory += '$0' + program_current_location.toString(16) + ': ';
                else
                    memory += '$' + program_current_location.toString(16) + ': ';
                for (let j = 0; j < 16; j++) {
                    let byte = this.memory.read(program_current_location).toString(16) + ' ';
                    if (byte.length == 2)
                        byte = '0' + byte;
                    if (program_current_location == this.cpu.PC)
                        byte = "<b style='background-color: yellow;'>" + byte + '</b>';
                    memory += byte;
                    program_current_location++;
                    ;
                }
                memory += '<br>';
            }
            //draw stats
            stats += 'PC: ' + this.cpu.PC.toString(16) + '<br>';
            stats += 'A: ' + this.cpu.A.toString(16) + '<br>';
            stats += 'X: ' + this.cpu.X.toString(16) + '<br>';
            stats += 'Y: ' + this.cpu.Y.toString(16) + '<br>';
            stats += 'Next Instruction: ' + this.cpu.next_op + '<br>';
            stats += 'Next Address Mode: ' + this.cpu.next_addressmode + '<br>';
            stats += 'STACK: ' + this.cpu.STACK.toString(16) + '<br>';
            stats += 'STATUS: C-' + this.cpu.getFlag(this.cpu.FLAG_C)
                + ' Z-' + this.cpu.getFlag(this.cpu.FLAG_Z)
                + ' I-' + this.cpu.getFlag(this.cpu.FLAG_I)
                + ' D-' + this.cpu.getFlag(this.cpu.FLAG_D)
                + ' B-' + this.cpu.getFlag(this.cpu.FLAG_B)
                + ' U-' + this.cpu.getFlag(this.cpu.FLAG_U)
                + ' V-' + this.cpu.getFlag(this.cpu.FLAG_V)
                + ' N-' + this.cpu.getFlag(this.cpu.FLAG_N) + '<BR>';
            stats += 'Scanline: ' + this.ppu.scanline + '<br>';
            stats += 'Tick: ' + this.ppu.tick + '<br>';
            // stats += 'Nametable X: ' + this.ppu.nametable_x + '<br>';
            // stats += 'Nametable Y: ' + this.ppu.nametable_y + '<br>';
            //don't crash on sound stats
            if (this.apu._soundDisabled == false) {
                let square1Equalizer = '';
                let square1Amount = 0;
                if (this.apu.square1.tone.volume.value > -100) {
                    let equalizerCount = Math.floor(this.apu.square1.debugCurrentFrequency / 50);
                    if (equalizerCount > 20)
                        equalizerCount = 20;
                    for (let i = 0; i < equalizerCount; i++)
                        square1Equalizer += '*';
                    square1Amount = Math.floor(this.apu.square1.debugCurrentFrequency / 2);
                    if (square1Amount > 400)
                        square1Amount = 400;
                }
                stats += 'Square1: ' + square1Equalizer + '<br>';
                let square2Equalizer = '';
                let square2Amount = 0;
                if (this.apu.square2.tone.volume.value > -100) {
                    let equalizerCount = Math.floor(this.apu.square2.debugCurrentFrequency / 50);
                    if (equalizerCount > 20)
                        equalizerCount = 20;
                    for (let i = 0; i < equalizerCount; i++)
                        square2Equalizer += '*';
                    square2Amount = Math.floor(this.apu.square2.debugCurrentFrequency / 2);
                    if (square2Amount > 400)
                        square2Amount = 400;
                }
                stats += 'Square2: ' + square2Equalizer + '<br>';
                let triangleEqualizer = '';
                let triangleAmount = 0;
                if (this.apu.triangle.tone.volume.value > -100) {
                    let equalizerCount = Math.floor(this.apu.triangle.debugCurrentFrequency / 50);
                    if (equalizerCount > 20)
                        equalizerCount = 20;
                    for (let i = 0; i < equalizerCount; i++)
                        triangleEqualizer += '*';
                    triangleAmount = Math.floor(this.apu.triangle.debugCurrentFrequency / 2);
                    if (triangleAmount > 400)
                        triangleAmount = 400;
                }
                stats += 'Triangl: ' + triangleEqualizer + '<br>';
                this.debugSquare1Visual = "<div style='border-color: black;background-color:lightskyblue;width:" +
                    square1Amount + "px;height:60px;'></div>";
                this.debugSquare2Visual = "<div style='border-color: black;background-color:lightskyblue;width:" +
                    square2Amount + "px;height:60px;'></div>";
                this.debugTriangleVisual = "<div style='border-color: black;background-color:lightskyblue;width:" +
                    triangleAmount + "px;height:60px;'></div>";
                let note1 = apu_1.Note.getNote(square1Amount);
                let note2 = apu_1.Note.getNote(square2Amount);
                let note3 = apu_1.Note.getNote(triangleAmount);
                if (note1 != '')
                    this.debugSquare1Note = note1;
                if (note2 != '')
                    this.debugSquare2Note = note2;
                if (note3 != '')
                    this.debugTriangleNote = note3;
                // soundStats = 
                //     'Square1 Frequency: ' + this.apu.square1.debugCurrentFrequency +'<br>' +
                //     'Square2 Frequency: ' + this.apu.square2.debugCurrentFrequency +'<br>' +
                //     'Triangl Frequency: ' + this.apu.triangle.debugCurrentFrequency +'<br>';
                // stats += 'Bank0offset: ' + this.memory.prgBank0offset + '<br>';
                // stats += 'Bank1offset: ' + this.memory.prgBank1offset + '<br>';
                // stats += 'Bank2offset: ' + this.memory.prgBank2offset + '<br>';
                // stats += 'Bank3offset: ' + this.memory.prgBank3offset + '<br>';
                let vol1 = this.apu.square1.volume;
                if (vol1 == -100)
                    vol1 = 0;
                else
                    vol1 = vol1 - this.apu.square1.SQUARE_VOLUME + 15;
                let vol2 = this.apu.square2.volume;
                if (vol2 == -100)
                    vol2 = 0;
                else
                    vol2 = vol2 - this.apu.square2.SQUARE_VOLUME + 15;
                let vol3 = this.apu.triangle.volume;
                if (vol3 == -100)
                    vol3 = 0;
                else
                    vol3 = 15;
                let vol4 = this.apu.noise.volume;
                if (vol4 == -100)
                    vol4 = 0;
                else
                    vol4 = vol4 - this.apu.noise.NOISE_VOLUME + 15;
                soundStats =
                    'Square1 Volume: ' + vol1 + '<br>' +
                        'Square1 Frequency: ' + this.apu.square1.debugCurrentFrequency + '<br>' +
                        'Square2 Volume: ' + vol2 + '<br>' +
                        'Square2 Frequency: ' + this.apu.square2.debugCurrentFrequency + '<br>' +
                        'Triangle Volume: ' + vol3 + '<br>' +
                        'Triangle Frequency: ' + this.apu.triangle.debugCurrentFrequency + '<br>' +
                        'Noise Volume: ' + vol4 + '<br>';
            }
            // stats += 'Sprite Size: ' + this.ppu.sprite_size + '<br>';
            // switch(this.cartridge.mirroring){
            //     case Mirroring.HORIZONTAL:
            //         stats += 'Mirroring: HORIZONTAL<br>'; break;
            //     case Mirroring.VERTICAL:
            //         stats += 'Mirroring: VERTICAL<br>'; break;
            // }
            // stats += 'Square1: ' + Math.floor(this.apu.square1.debugCurrentFrequency) + '<br>';
            // stats += 'Square2: ' + Math.floor(this.apu.square2.debugCurrentFrequency) + '<br>';
            // stats += 'Triangl: ' + Math.floor(this.apu.triangle.debugCurrentFrequency) + '<br>';
            // stats += 'Square2 Sweep Mode: ' + this.apu.square2.sweepMode + '<br>';
            // stats += 'Square2 Frequency: ' + Math.floor(this.apu.square2.debugCurrentFrequency) + '<br>';
            // stats += 'Square2 Length Counter Halt: ' + this.apu.square2.lengthCounterHalt + '<br>';
            // stats += 'Square2 Constant Volume: ' + this.apu.square2.constantVolume + '<br>';
            // stats += 'Square2 Length Counter: ' + this.apu.square2.lengthCounter + '<br>';
            // stats += 'Square2 Sweep Mode: ' + this.apu.square2.sweepMode + '<br>';
            // stats += 'Square2 Frequency: ' + Math.floor(this.apu.square2.debugCurrentFrequency) + '<br>';
            // stats += 'Sprite 0 X: ' + this.ppu.oam[3] + '<br>';
            // stats += 'Sprite 0 Y: ' + this.ppu.oam[0] + '<br>';
            // stats += 'greyscale: ' + this.ppu.greyscale + '<br>';
            // stats += 'show_background_leftmost: ' + this.ppu.show_background_leftmost + '<br>';
            // stats += 'show_sprites_leftmost: ' + this.ppu.show_sprites_leftmost + '<br>';
            // stats += 'show_background: ' + this.ppu.show_background + '<br>';
            // stats += 'show_sprites: ' + this.ppu.show_sprites + '<br>';
            // stats += 'emphasize_red: ' + this.ppu.emphasize_red + '<br>';
            // stats += 'emphasize_green: ' + this.ppu.emphasize_green + '<br>';
            // stats += 'emphasize_blue: ' + this.ppu.emphasize_blue + '<br>';
            // stats += 'Left: ' + this.inputController.Key_Left + '<br>';
            // stats += 'Right: ' + this.inputController.Key_Right + '<br>';
            // stats += 'Start: ' + this.inputController.Key_Action_Start + '<br>';
            // stats += 'NESTEST Counter: ' + this.nestestcounter + ' / ' + this.nestestlog.length + '<br>';
            // stats += 'Cycle Count: ' + this.cpu.allcyclecount + '<br>';
            // stats += 'Cycles Left: ' + this.cpu.cycles + '<br>';
            // stats += 'Last Address: ' + this.cpu.last_address + '<br>';
            // stats += 'Last Read: ' + this.cpu.last_read + '<br>';
            this.debugProgram = program;
            this.debugMemory = memory;
            this.debugStats = stats;
            this.debugSoundStats = soundStats;
        }
        startRecordingMusic() {
            console.log('recording started');
            this.recordMusicArray = [];
            this.recordMusicMode = true;
        }
        stopRecordingMusic() {
            this.recordMusicMode = false;
            localStorage.setItem('nes-music', this.recordMusicArray.toString());
            console.log('recording saved');
        }
        processRecordMusic() {
            if (this.recordMusicMode) {
                if (this.apu.square1.tone.volume.value > -100)
                    this.recordMusicArray.push(Math.floor(this.apu.square1.debugCurrentFrequency));
                else
                    this.recordMusicArray.push(0);
                if (this.apu.square2.tone.volume.value > -100)
                    this.recordMusicArray.push(Math.floor(this.apu.square2.debugCurrentFrequency));
                else
                    this.recordMusicArray.push(0);
                if (this.apu.triangle.tone.volume.value > -100)
                    this.recordMusicArray.push(Math.floor(this.apu.triangle.debugCurrentFrequency));
                else
                    this.recordMusicArray.push(0);
            }
            if (this.playBackMusicMode) {
                let square1note = this.recordMusicArray[this.playBackMusicCounter];
                let square2note = this.recordMusicArray[this.playBackMusicCounter + 1];
                let trianglenote = this.recordMusicArray[this.playBackMusicCounter + 2];
                this.apu.square1.tone.frequency.value = square1note;
                this.apu.square1.debugCurrentFrequency = square1note;
                if (square1note != 0) {
                    this.apu.square1.tone.volume.value = this.apu.square1.SQUARE_VOLUME;
                    this.apu.square1.start();
                }
                else
                    this.apu.square1.stop();
                this.apu.square2.tone.frequency.value = square2note;
                this.apu.square2.debugCurrentFrequency = square2note;
                if (square2note != 0) {
                    this.apu.square2.tone.volume.value = this.apu.square2.SQUARE_VOLUME;
                    this.apu.square2.start();
                }
                else
                    this.apu.square2.stop();
                this.apu.triangle.tone.frequency.value = trianglenote;
                this.apu.triangle.debugCurrentFrequency = trianglenote;
                if (trianglenote != 0) {
                    this.apu.triangle.tone.volume.value = this.apu.triangle.TRIANGLE_VOLUME;
                    this.apu.triangle.start();
                }
                else
                    this.apu.triangle.stop();
                this.playBackMusicCounter += 3;
                if (this.playBackMusicCounter == this.recordMusicArray.length)
                    this.stopPlaybackMusic();
            }
        }
        stopPlaybackMusic() {
            this.playBackMusicMode = false;
            this.apu.square1.stop();
            this.apu.square2.stop();
            this.apu.triangle.stop();
        }
        playRecordedMusic() {
            let musicString = localStorage.getItem('nes-music');
            let musicArray = musicString.split(',');
            let musicArrayNums = [];
            musicArray.forEach(note => {
                musicArrayNums.push(parseFloat(note));
            });
            this.recordMusicArray = musicArrayNums;
            this.playBackMusicMode = true;
            this.playBackMusicCounter = 0;
            this.apu.unMuteAll();
        }
    }
    exports.Nes = Nes;
});
//# sourceMappingURL=nes.js.map