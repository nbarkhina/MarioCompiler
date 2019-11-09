import { Nes } from "./nes";
import { BitHelper } from "./bithelper";
import { VideoScreen } from "./video";
import { Mirroring } from "./cartridge";

export class PPU {

    nes: Nes;
    palette: Color[] = [];
    vram: Uint8Array;
    scanline = -1;  //y coordinate of scanline
    tick = 0;       //x coordinate of scanline
    frame_complete = false;

    //control register 0x2000
    nametable_x = 0; //which nametable gets drawn first
    nametable_y = 0; //which nametable gets drawn first
    increment_mode = 0; //ppu to increment address by 1 or 32
    pattern_sprite = 0; //tells you whether to read sprite tiles from chr page 1 or 2
    pattern_background = 0; //tells you whether to read background tiles from chr page 1 or 2
    sprite_size = 0;
    slave_mode = 0; // unused
    enable_nmi = 0;

    //mask register 0x2001
    greyscale = 0;
    show_background_leftmost = 0;
    show_sprites_leftmost = 0;
    show_background = 0;
    show_sprites = 0;
    emphasize_red = 0;
    emphasize_green = 0;
    emphasize_blue = 0;

    //status register 0x2002
    sprite_overflow = 0;
    sprite_zero_hit = 0;
    vertical_blank = 0; //period when tv laser is off screen

    //oam register 0x2003 and 0x2004
    oam:Uint8Array;
    oamAddress = 0;

    //scroll register 0x2005
    scroll_x = 0; //ScrollX offset
    scroll_y = 0; //scrollY offset
    scroll_last = 0; //for address latch alternation
    
    //specific timing of scroll_x and nametable_x
    //for spritehit0 in mario bros and other games
    marioHack = false;

    //the scanline at which to do rendering
    renderScanline = 120;

    //used during rendering
    sprite_color = new Color(0,0,0);

    //used for IRQ in MMC3 Mapper
    isMMC3 = false;

    //for cpu reading/writing to the vram
    ppu_data:number = 0;
    ppu_data_delay:number = 0; //reading from the ppu by the cpu is delayed by one cycle
    ppu_address:number = 0;



    constructor(nes: Nes) {
        this.nes = nes;
        this.initPalette();

        //16 kb addressable range (0x4000 = 16*1024)
        //though most of this array is unnecessary
        //as the first 8kb is on the cartridge rom
        this.vram = new Uint8Array(0x4000);

        //is this correct as an initial state?
        //will need to check
        for (let i = 0; i < this.vram.length; i++)
            this.vram[i] = 0x00;

        this.oam = new Uint8Array(256);
        for (let i = 0; i < this.oam.length; i++)
            this.oam[i] = 0x00;

    }



    clock() {

        //for performance, can skip most of this function if tick!=3
        if (this.tick!=3)
        {
            this.incrementTickAndScanline();
            return;
        }

        if (this.scanline==-1)
        {
            //reset vblank
            this.vertical_blank = 0;
        }

        //sprite hit 0 hack
        if (this.scanline==this.oam[0])
        {
            // if (this.tick==sprite_0_x)
                this.sprite_zero_hit = 1;
        }

        //scanline counter for MMC3 Mapper once a frame
        //without this double dragon 2 doesn't play music
        //during the first stage, also double dragon 3
        //won't get past the title screen
        //also bucky ohare just crashes at title
        if (this.isMMC3){
            if (this.scanline<241){
                this.nes.memory.clockScanlineCounter();
            }
        }

        //when to start rendering
        //current default is 120
        //unless overridden via hack
        if (this.scanline==this.renderScanline)
        {
            this.nes.render();
        }


        if (this.scanline==241)
        {
            //vblank
            this.vertical_blank = 1;

            //nmi
            if (this.enable_nmi)
                this.nes.cpu.nmiRequest();
        }

        this.incrementTickAndScanline();
        

    }

    incrementTickAndScanline(){
        this.tick+=3;
        if (this.tick == 342)
        {
            this.tick = 0;
            this.scanline++;

            //this is a hack to get it cycle accurate to what
            //i had before i switched it to running the 
            //ppu clock function 1 time instead of 3 in main loop
            if (this.scanline==259)
            {
                this.tick = -81;
            }
            if (this.scanline > 259)
            {
                this.scanline = -1;
                this.frame_complete = true;
            }
        }
    }




    // PPU MEMORY MAP
    // Address range	Size	Description
    // $0000-$0FFF	$1000	Pattern table 0
    // $1000-$1FFF	$1000	Pattern table 1
    // $2000-$23FF	$0400	Nametable 0
    // $2400-$27FF	$0400	Nametable 1
    // $2800-$2BFF	$0400	Nametable 2
    // $2C00-$2FFF	$0400	Nametable 3
    // $3000-$3EFF	$0F00	Mirrors of $2000-$2EFF
    // $3F00-$3F1F	$0020	Palette RAM indexes
    // $3F20-$3FFF	$00E0	Mirrors of $3F00-$3F1F


    //i am currently storing the ppu registers in 
    //regular cpu ram out of convenience though 
    //that's not really where they should live
    //I should move this to a different structure
    readRegister(address: number) {

        switch (address) {
            case 0x2000: // Control
                this.assembleControlRegister();
                break;
            case 0x2001: // Mask
                this.assembleMaskRegister();
                break;
            case 0x2002: // Status
                this.assembleStatusRegister();
                this.vertical_blank = 0; //reading from the status register clears vertical blank
                this.ppu_address_lo_high = 0; //same for lo/hi counter
                this.sprite_zero_hit = 0;
                break;
            case 0x2003: // OAM Address
                break;
            case 0x2004: // OAM Data
                break;
            case 0x2005: // Scroll
                break;
            case 0x2006: // PPU Address
                break;
            case 0x2007: // PPU Data
                //reading from ppu is delayed by 1 cycle
                this.ppu_data = this.ppu_data_delay;
                this.ppu_data_delay = this.readVRAM(this.ppu_address);
                //special case for palette's - they don't need to be delayed
                if (address > 0x3f00)
                {
                    this.ppu_data = this.readVRAM(this.ppu_address);
                }
                //it auto increments the address on every read/write
                if (this.increment_mode==0)
                    this.ppu_address++; 
                else
                    this.ppu_address+=32;
                return this.ppu_data;
                break;
        }

        return this.nes.memory.ram[address];
    }

    //writing to the ppu address takes 2 writes
    //first you write the hi byte then the lo byte
    //so each write alternates this variable between 0/1
    ppu_address_lo_high = 0;

    writeRegister(address: number, value: number) {

        switch (address) {
            case 0x2000: // Control
                this.parseControlRegister(value);
                break;
            case 0x2001: // Mask
                this.parseMaskRegister(value);
                break;
            case 0x2002: // Status
                this.parseStatusRegister(value);
                break;
            case 0x2003: // OAM Address
                this.oamAddress = value;
                break;
            case 0x2004: // OAM Data
                this.writeOAM(value);
                break;
            case 0x2005: // Scroll
                if (this.scroll_last==0)
                {
                    if (this.marioHack){ //mario hack
                        if (this.scanline<200)
                            this.scroll_x = value;
                    }
                    else
                        this.scroll_x = value;
                        
                    this.scroll_last = 1;
                }
                //then the lo byte
                else
                {
                    this.scroll_y = value;
                    this.scroll_last = 0;
                }
                break;
            case 0x2006: // PPU Address
                //first the hi byte
                if (this.ppu_address_lo_high==0)
                {
                    this.ppu_address = (this.ppu_address & 0x00FF) | (value<<8);
                    this.ppu_address_lo_high = 1;
                }
                //then the lo byte
                else
                {
                    this.ppu_address_lo_high = 0;
                    this.ppu_address = (this.ppu_address & 0xFF00) | value;
                }
                break;
            case 0x2007: // PPU Data
                this.writeVRAM(this.ppu_address,value);
                //it auto increments the address on every read/write
                if (this.increment_mode==0)
                    this.ppu_address++; 
                else
                    this.ppu_address+=32;
                break;
        }

        this.nes.memory.ram[address] = value;

    }

    readVRAM(address: number) {

        //cartridge
        if (address >= 0x0000 && address <= 0x1FFF) {
            return this.nes.cartridge.chrData[address];
        }
        //nametable
        else if (address >= 0x2000 && address <= 0x3EFF) {
            //TODO mirroring of $2000-$27FF to $2800-$2BFF (NameTable 0,1 mirrored to 2,3)
            //TODO mirroring $2000-$2EFF to $3000-$3EFF

            if (this.nes.cartridge.mirroring==Mirroring.VERTICAL)
            {
                if (address >= 0x2800)
                    address -= 0x800;
            }
            else if (this.nes.cartridge.mirroring==Mirroring.HORIZONTAL)
            {
                if (address>=0x2400 && address<0x2800)
                {
                    address -= 0x400;
                }
                if (address>=0x2C00)
                {
                    address -= 0x400;
                }
            }
            return this.vram[address];
        }
        //palette
        else if (address >= 0x3F00 && address <= 0x3FFF) {
            //mirroring $3F00-$3F1F to $3F20-$3FFF
            let mirrored_address = (address &= 0x001F) + 0x3F00;
            if (mirrored_address==0x3F10) mirrored_address = 0x3F00;
            if (mirrored_address==0x3F14) mirrored_address = 0x3F04;
            if (mirrored_address==0x3F18) mirrored_address = 0x3F08;
            if (mirrored_address==0x3F1C) mirrored_address = 0x3F0C;
            return this.vram[mirrored_address];
        }

    }

    writeVRAM(address: number, value: number) {

        //cartridge
        if (address >= 0x0000 && address <= 0x1FFF) {
            //can we write to the cartridge?
            //apparently we can - used to populate chr in zelda
            //since cartridge reports 0 chr banks
            this.nes.cartridge.chrData[address] = value;
        }
        //nametable
        else if (address >= 0x2000 && address <= 0x3EFF) {


            if (this.nes.cartridge.mirroring==Mirroring.VERTICAL)
            {
                if (address >= 0x2800)
                    address -= 0x800;
            }
            else if (this.nes.cartridge.mirroring==Mirroring.HORIZONTAL)
            {
                if (address>=0x2400 && address<0x2800)
                {
                    address -= 0x400;
                }
                if (address>=0x2C00)
                {
                    address -= 0x400;
                }
            }

            this.vram[address] = value;
        }
        //palette
        else if (address >= 0x3F00 && address <= 0x3FFF) {
            let mirrored_address = (address &= 0x001F) + 0x3F00;
            if (mirrored_address==0x3F10) mirrored_address = 0x3F00;
            if (mirrored_address==0x3F14) mirrored_address = 0x3F04;
            if (mirrored_address==0x3F18) mirrored_address = 0x3F08;
            if (mirrored_address==0x3F1C) mirrored_address = 0x3F0C;
            this.vram[mirrored_address] = value;
        }

    }

    getPaletteColor(index:number):Color{
        //background color is mirrored
        if (index%4==0)
            index=0;
        let pallete_number = this.readVRAM(0x3F00+index);
        pallete_number = pallete_number % 64;
        return this.palette[pallete_number];
    }

    //REGISTER WRAPPERS

    parseControlRegister(value:number){
        
        if (this.marioHack){ //mario hack
            if (this.scanline<200)
                this.nametable_x = BitHelper.getBit(value,0);
        }
        else
            this.nametable_x = BitHelper.getBit(value,0);

        this.nametable_y = BitHelper.getBit(value,1);
        this.increment_mode = BitHelper.getBit(value,2);
        this.pattern_sprite = BitHelper.getBit(value,3);
        this.pattern_background = BitHelper.getBit(value,4);
        this.sprite_size = BitHelper.getBit(value,5);
        this.slave_mode = BitHelper.getBit(value,6);
        this.enable_nmi = BitHelper.getBit(value,7);

        // console.log('Scanline) ' + this.scanline + ' Sprites) ' + this.pattern_sprite);
    }

    parseMaskRegister(value:number){
        this.greyscale = BitHelper.getBit(value,0);
        this.show_background_leftmost = BitHelper.getBit(value,1);
        this.show_sprites_leftmost = BitHelper.getBit(value,2);
        this.show_background = BitHelper.getBit(value,3);
        this.show_sprites = BitHelper.getBit(value,4);
        this.emphasize_red = BitHelper.getBit(value,5);
        this.emphasize_green = BitHelper.getBit(value,6);
        this.emphasize_blue = BitHelper.getBit(value,7);
    }

    parseStatusRegister(value:number){
        this.sprite_overflow = BitHelper.getBit(value,5);
        this.sprite_zero_hit = BitHelper.getBit(value,6);
        this.vertical_blank = BitHelper.getBit(value,7);
    }

    assembleControlRegister(){
        this.nes.memory.ram[0x2000] = BitHelper.setBit(this.nes.memory.ram[0x2000],0,this.nametable_x);
        this.nes.memory.ram[0x2000] = BitHelper.setBit(this.nes.memory.ram[0x2000],1,this.nametable_y);
        this.nes.memory.ram[0x2000] = BitHelper.setBit(this.nes.memory.ram[0x2000],2,this.increment_mode);
        this.nes.memory.ram[0x2000] = BitHelper.setBit(this.nes.memory.ram[0x2000],3,this.pattern_sprite);
        this.nes.memory.ram[0x2000] = BitHelper.setBit(this.nes.memory.ram[0x2000],4,this.pattern_background);
        this.nes.memory.ram[0x2000] = BitHelper.setBit(this.nes.memory.ram[0x2000],5,this.sprite_size);
        this.nes.memory.ram[0x2000] = BitHelper.setBit(this.nes.memory.ram[0x2000],6,this.slave_mode);
        this.nes.memory.ram[0x2000] = BitHelper.setBit(this.nes.memory.ram[0x2000],7,this.enable_nmi);
    }

    assembleMaskRegister(){
        this.nes.memory.ram[0x2001] = BitHelper.setBit(this.nes.memory.ram[0x2001],0,this.greyscale);
        this.nes.memory.ram[0x2001] = BitHelper.setBit(this.nes.memory.ram[0x2001],1,this.show_background_leftmost);
        this.nes.memory.ram[0x2001] = BitHelper.setBit(this.nes.memory.ram[0x2001],2,this.show_sprites_leftmost);
        this.nes.memory.ram[0x2001] = BitHelper.setBit(this.nes.memory.ram[0x2001],3,this.show_background);
        this.nes.memory.ram[0x2001] = BitHelper.setBit(this.nes.memory.ram[0x2001],4,this.show_sprites);
        this.nes.memory.ram[0x2001] = BitHelper.setBit(this.nes.memory.ram[0x2001],5,this.emphasize_red);
        this.nes.memory.ram[0x2001] = BitHelper.setBit(this.nes.memory.ram[0x2001],6,this.emphasize_green);
        this.nes.memory.ram[0x2001] = BitHelper.setBit(this.nes.memory.ram[0x2001],7,this.emphasize_blue);
    }

    assembleStatusRegister(){
        this.nes.memory.ram[0x2002] = BitHelper.setBit(this.nes.memory.ram[0x2002],5,this.sprite_overflow);
        this.nes.memory.ram[0x2002] = BitHelper.setBit(this.nes.memory.ram[0x2002],6,this.sprite_zero_hit);
        this.nes.memory.ram[0x2002] = BitHelper.setBit(this.nes.memory.ram[0x2002],7,this.vertical_blank);
    }

    //used for visualizing current chr data
    //with available palettes
    testUsePallete = false;
    testCurrentPalette = -1;
    testCurrentColor0:Color;
    testCurrentColor1:Color;
    testCurrentColor2:Color;
    testCurrentColor3:Color;
    paletteSwapTest(){
        this.testUsePallete = true;
        this.testCurrentPalette++;
        if (this.testCurrentPalette>7)
            this.testCurrentPalette = 0;
        this.testCurrentColor0 = this.nes.ppu.getPaletteColor( (this.testCurrentPalette*4) + 0);
        this.testCurrentColor1 = this.nes.ppu.getPaletteColor( (this.testCurrentPalette*4) + 1);
        this.testCurrentColor2 = this.nes.ppu.getPaletteColor( (this.testCurrentPalette*4) + 2);
        this.testCurrentColor3 = this.nes.ppu.getPaletteColor( (this.testCurrentPalette*4) + 3);
    }


    renderTile(address:number,x_screen:number,y_screen:number,
        screen:VideoScreen,scrolladjust_x:number,scrolladjust_y:number,
        nameTableIndex?:number,nameTableGrid?:number,spriteAttributes?:number) {

        let realPalColor0:Color = null;
        let realPalColor1:Color = null;
        let realPalColor2:Color = null;
        let realPalColor3:Color = null;
        let transparent = false;
        let flip_horizontal = false;
        let flip_vertical = false;
        if (nameTableIndex!=null)
        {
            //determine megatile
            //divide by 32 and do math_floor to determine the Y coordinate 
            //mod by 32 to determine the X coordinate

            // scrolling test
            // let temp_x_screen = x_screen;
            // let temp_y_screen = y_screen;

            // if (nameTableGrid==1) //currently assuming horizontal mirroring
            // {
            //     temp_y_screen-=240;
            // }

            // let x_tile = (temp_x_screen/8);
            // let y_tile = (temp_y_screen/8);

            let x_tile = (x_screen/8);
            let y_tile = (y_screen/8);

            let x_large = Math.floor(x_tile/4); //1
            let y_large = Math.floor(y_tile/4); //0

            let attribute_offset = (y_large*8)+x_large;

            //second nametable
            if (nameTableGrid==1)
            {
                if (this.nes.cartridge.mirroring==Mirroring.VERTICAL)
                    attribute_offset +=0x400;
                else
                    attribute_offset +=0x800;
            }
            
            let attribute_byte = this.nes.ppu.readVRAM(0x2000+960+attribute_offset);

            let quadrant_position = 0;

            if (x_tile%4>1)
                quadrant_position+=1;
            if (y_tile%4>1)
                quadrant_position+=2;
            
            attribute_byte = attribute_byte >> (quadrant_position*2)

            let bit0 = BitHelper.getBit(attribute_byte,0);
            let bit1 = BitHelper.getBit(attribute_byte,1);
            let pal_index = bit0 + (bit1*2);
            let pallete_number = (pal_index*4);
            realPalColor0 = this.nes.ppu.getPaletteColor(pallete_number + 0);
            realPalColor1 = this.nes.ppu.getPaletteColor(pallete_number + 1);
            realPalColor2 = this.nes.ppu.getPaletteColor(pallete_number + 2);
            realPalColor3 = this.nes.ppu.getPaletteColor(pallete_number + 3);

        }
        else if (spriteAttributes!=null){
            let bit0 = BitHelper.getBit(spriteAttributes,0);
            let bit1 = BitHelper.getBit(spriteAttributes,1);
            let pal_index = bit0 + (bit1*2) + 4;
            let pallete_number = (pal_index*4);
            realPalColor0 = this.nes.ppu.getPaletteColor(pallete_number + 0);
            realPalColor1 = this.nes.ppu.getPaletteColor(pallete_number + 1);
            realPalColor2 = this.nes.ppu.getPaletteColor(pallete_number + 2);
            realPalColor3 = this.nes.ppu.getPaletteColor(pallete_number + 3);

            let flip_h = BitHelper.getBit(spriteAttributes,6);
            if (flip_h)
                flip_horizontal = true;

            let flip_v = BitHelper.getBit(spriteAttributes,7);
            if (flip_v)
                flip_vertical = true;
        }
        
        let val1 = 0;
        let val2 = 0;
        let color = 0;
        let palColor:Color;
        let byte1 = 0;
        let byte2 = 0;
        x_screen += scrolladjust_x;
        y_screen += scrolladjust_y;
        
        //code below will be called 61,000 times a frame
        //so keep it super efficient
		for (let y = 0; y < 8; y++) {

			byte1 = this.nes.cartridge.chrData[y+address];
			byte2 = this.nes.cartridge.chrData[y+address+8];
			for (let x = 0; x < 8; x++) {
			
				val1 = byte1 & 128;
				val2 = byte2 & 128;
                color = (val1 >> 7) + (val2 >> 6);
                
				// if (val1) color = 1;
                // if (val2) color += 2;
                
                //make nametable2 grayscale for debugging purposes
                // if (nameTableGrid==1)
                //     realPalColor0 = null;

                if (realPalColor0!=null)
                {
                    if (color==0) palColor = realPalColor0;
                    else if (color==1) palColor = realPalColor1;
                    else if (color==2) palColor = realPalColor2;
                    else palColor = realPalColor3;
                    this.sprite_color.red = palColor.red;
                    this.sprite_color.green = palColor.green;
                    this.sprite_color.blue = palColor.blue;
                    if (spriteAttributes!=null && color==0)
                        transparent = true;
                    else
                        transparent = false;
                }
                //used for visualizing the chr data
                //using available palettes
                else if (this.testUsePallete)
                {
                    let palColor:Color;
                    if (color==0) palColor = this.testCurrentColor0;
                    if (color==1) palColor = this.testCurrentColor1;
                    if (color==2) palColor = this.testCurrentColor2;
                    if (color==3) palColor = this.testCurrentColor3;
                    this.sprite_color.red = palColor.red;
                    this.sprite_color.green = palColor.green;
                    this.sprite_color.blue = palColor.blue;
                }
                else
                {
                    color *= 70;
                    this.sprite_color.red = color;
                    this.sprite_color.green = color;
                    this.sprite_color.blue = color
                }

				byte1 = byte1 << 1;
                byte2 = byte2 << 1;


                //scrolling calculation - MOVED OUT FOR PERFORMANCE
                
                
                if (flip_horizontal==false && flip_vertical==false)
                    screen.setPixel(x_screen+x,y_screen+y,this.sprite_color,transparent);
                else if (flip_horizontal==true && flip_vertical == false)
                    screen.setPixel(x_screen+(7-x),y_screen+y,this.sprite_color,transparent);
                else if (flip_horizontal==false && flip_vertical == true)
                    screen.setPixel(x_screen+x,y_screen+(7-y),this.sprite_color,transparent);
                else
                    screen.setPixel(x_screen+(7-x),y_screen+(7-y),this.sprite_color,transparent);

                
			}
		}
    }

    
    OAM_DMA_Copy(page:number){
        //TODO Secondary OAM - what does it do? 
        //I think it's just used for sprites on the current scanline - more than 8 flickering bug
        let address = 256*page;
        for(let i = 0;i<256;i++){
            this.oam[i] = this.nes.memory.ram[address];
            address++;
        }
    }

    

    writeOAM( value ) {
        if ( this.vertical_blank ) {
            this.oam[ this.oamAddress ] = value;
            this.oamAddress++; //increment oam
        }
    }


    initPalette() {
        for (let i = 0; i < 64; i++) {
            this.palette.push(new Color(0, 0, 0));
        }

        this.palette[0x00] = new Color(84, 84, 84);
        this.palette[0x01] = new Color(0, 30, 116);
        this.palette[0x02] = new Color(8, 16, 144);
        this.palette[0x03] = new Color(48, 0, 136);
        this.palette[0x04] = new Color(68, 0, 100);
        this.palette[0x05] = new Color(92, 0, 48);
        this.palette[0x06] = new Color(84, 4, 0);
        this.palette[0x07] = new Color(60, 24, 0);
        this.palette[0x08] = new Color(32, 42, 0);
        this.palette[0x09] = new Color(8, 58, 0);
        this.palette[0x0A] = new Color(0, 64, 0);
        this.palette[0x0B] = new Color(0, 60, 0);
        this.palette[0x0C] = new Color(0, 50, 60);
        this.palette[0x0D] = new Color(0, 0, 0);
        this.palette[0x0E] = new Color(0, 0, 0);
        this.palette[0x0F] = new Color(0, 0, 0);

        this.palette[0x10] = new Color(152, 150, 152);
        this.palette[0x11] = new Color(8, 76, 196);
        this.palette[0x12] = new Color(48, 50, 236);
        this.palette[0x13] = new Color(92, 30, 228);
        this.palette[0x14] = new Color(136, 20, 176);
        this.palette[0x15] = new Color(160, 20, 100);
        this.palette[0x16] = new Color(152, 34, 32);
        this.palette[0x17] = new Color(120, 60, 0);
        this.palette[0x18] = new Color(84, 90, 0);
        this.palette[0x19] = new Color(40, 114, 0);
        this.palette[0x1A] = new Color(8, 124, 0);
        this.palette[0x1B] = new Color(0, 118, 40);
        this.palette[0x1C] = new Color(0, 102, 120);
        this.palette[0x1D] = new Color(0, 0, 0);
        this.palette[0x1E] = new Color(0, 0, 0);
        this.palette[0x1F] = new Color(0, 0, 0);

        this.palette[0x20] = new Color(236, 238, 236);
        this.palette[0x21] = new Color(76, 154, 236);
        this.palette[0x22] = new Color(120, 124, 236);
        this.palette[0x23] = new Color(176, 98, 236);
        this.palette[0x24] = new Color(228, 84, 236);
        this.palette[0x25] = new Color(236, 88, 180);
        this.palette[0x26] = new Color(236, 106, 100);
        this.palette[0x27] = new Color(212, 136, 32);
        this.palette[0x28] = new Color(160, 170, 0);
        this.palette[0x29] = new Color(116, 196, 0);
        this.palette[0x2A] = new Color(76, 208, 32);
        this.palette[0x2B] = new Color(56, 204, 108);
        this.palette[0x2C] = new Color(56, 180, 204);
        this.palette[0x2D] = new Color(60, 60, 60);
        this.palette[0x2E] = new Color(0, 0, 0);
        this.palette[0x2F] = new Color(0, 0, 0);

        this.palette[0x30] = new Color(236, 238, 236);
        this.palette[0x31] = new Color(168, 204, 236);
        this.palette[0x32] = new Color(188, 188, 236);
        this.palette[0x33] = new Color(212, 178, 236);
        this.palette[0x34] = new Color(236, 174, 236);
        this.palette[0x35] = new Color(236, 174, 212);
        this.palette[0x36] = new Color(236, 180, 176);
        this.palette[0x37] = new Color(228, 196, 144);
        this.palette[0x38] = new Color(204, 210, 120);
        this.palette[0x39] = new Color(180, 222, 120);
        this.palette[0x3A] = new Color(168, 226, 144);
        this.palette[0x3B] = new Color(152, 226, 180);
        this.palette[0x3C] = new Color(160, 214, 228);
        this.palette[0x3D] = new Color(160, 162, 160);
        this.palette[0x3E] = new Color(0, 0, 0);
        this.palette[0x3F] = new Color(0, 0, 0);

    }
}

export class Color {
    red: number = 0;
    green: number = 0;
    blue: number = 0;
    alpha: number = 255;
    constructor(red: number, green: number, blue: number) {
        this.red = red;
        this.green = green;
        this.blue = blue;
    }
}