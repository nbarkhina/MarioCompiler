define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //for debugging
    //don't rely on this for functionality, always use getFlag()
    class DEBUGVIEWERFL {
        constructor() {
            this.C = 0;
            this.Z = 0;
            this.I = 0;
            this.D = 0;
            this.B = 0;
            this.U = 0;
            this.V = 0;
            this.N = 0;
        }
    }
    exports.DEBUGVIEWERFL = DEBUGVIEWERFL;
    class Instruction {
        constructor() {
            this.id = 0;
            this.cyc = 0; //number of cycles required to execute instruction
            this.opcode_name = '';
            this.addressmode_name = '';
        }
    }
    exports.Instruction = Instruction;
    class CPU {
        // BITWISE OPERATORS CHEAT SHEET
        // AND         &
        // OR          |
        // NOT         ~
        // XOR         ^
        // Left shift  <<
        // Right shift >>
        //opcodes data sheets
        //https://www.masswerk.at/6502/6502_instruction_set.html#BRK
        //http://www.oxyron.de/html/opcodes02.html
        //http://archive.6502.org/datasheets/rockwell_r650x_r651x.pdf
        //best one with long explanations of opcodes - http://obelisk.me.uk/6502/reference.html#ROL
        //build a matrix so it will be easier to eyeball if i made a typo
        //based on the function, addressing mode, and number of cycles
        constructor(nes) {
            this.FLAG_C = 0; // Carry Bit
            this.FLAG_Z = 1; // Zero
            this.FLAG_I = 2; // Disable Interrupts
            this.FLAG_D = 3; // Decimal Mode (unused in this implementation)
            this.FLAG_B = 4; // Break
            this.FLAG_U = 5; // Unused
            this.FLAG_V = 6; // Overflow
            this.FLAG_N = 7; // Negative
            //Registers
            this.A = 0; // Accumulator Register
            this.X = 0; // X Register
            this.Y = 0; // Y Register
            this.STACK = 0; // Stack Pointer ($0100-$01FF) , Starts at 0xFD and counts down
            this.PC = 0x8000; // Program Counter (16 bit), hardcoded to start at 0x8000?
            this.STATUS = 0; // Status Register
            this.RESET_ADDRESS = 0xFFFC;
            this.IRQ_ADDRESS = 0xFFFE;
            this.NMI_ADDRESS = 0xFFFA;
            //variables
            this.address = 0; // address to get data based on addressing mode
            this.cycles = 0; // number of cpu cycles left for the current operation
            this.all_instructions = [];
            this.nmi_requested = false;
            this.irq_requested = false;
            this.debug_viewer_fl = new DEBUGVIEWERFL();
            this.debug_hex_values = {
                A: "",
                X: "",
                Y: "",
                P: "",
                SP: "",
                PC: ""
            };
            // last_instruction:string = '';
            // last_address:number = 0;
            // last_read:number = 0;
            this.next_op = '';
            this.next_addressmode = '';
            this.loggerCounter = 0;
            this.logger = '';
            this.startLogging = false;
            this.allCycles = 0;
            this.nes = nes;
            this.init_instructions();
        }
        clock() {
            // this.allcyclecount++;
            //EXPENSIVE
            //UNCOMMENT THIS IF DOING NESTESTLOGMODE
            // if (this.nes.PAUSED || this.nes.nestestlogmode) {
            // }
            // else
            // {
            if (this.cycles > 0) {
                this.cycles--;
                return;
            }
            // }
            //read in the opcode from the program counter
            let opcode = this.read(this.PC);
            //increment the program counter
            this.PC++;
            this.current_instruction = this.all_instructions[opcode];
            // if (this.current_instruction.opcode_name=="TAX"){
            //     let debug=1;
            // }
            //set number of cycles based on instruction
            this.cycles = this.current_instruction.cyc;
            //run address mode
            this.current_instruction.add();
            //FOR DEBUGGING
            // if (this.loggerCounter<100000 && this.startLogging){
            //     this.logger += this.loggerCounter + ") PC: " + this.PC.toString(16) + 
            //         " OP: " + opcode.toString(16) + " " +
            //         this.current_instruction.opcode_name + " " +
            //         this.current_instruction.addressmode_name + " " +
            //         " Address: " + this.address.toString(16) + "\r\n";
            //     if (this.nmi_requested){
            //         this.logger += "NMI\r\n";
            //     }
            //     if (this.irq_requested){
            //         this.logger += "IRQ\r\n";
            //     }
            //     this.loggerCounter++;
            // }
            // this.allCycles++;
            // if (this.PC==43038){
            //     let debug=1;
            // }
            // if (this.nes.smb3StartHack && this.PC==43038){
            //     this.nes.memory.ram[16]=150;
            //     this.nes.smb3hackCounter++;
            //     console.log('SMB3 Hack: ' + this.nes.smb3hackCounter);
            // }
            //execute instruction
            this.current_instruction.op();
            //TODO - move this to before the op?
            //handle NMI
            if (this.nmi_requested) {
                this.nmi();
                this.nmi_requested = false;
            }
            //handle IRQ
            if (this.irq_requested) {
                this.irq();
                this.irq_requested = false;
            }
            //decrement the cpu cycles counter;
            this.cycles--;
        }
        //OPCODE MATRIX
        init_instructions() {
            this.all_instructions = [
                //ROW 0
                { id: 0x00, op: this.BRK, add: this.IMP, cyc: 7 },
                { id: 0x01, op: this.ORA, add: this.IZX, cyc: 6 },
                { id: 0x02, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x03, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x04, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x05, op: this.ORA, add: this.ZP0, cyc: 3 },
                { id: 0x06, op: this.ASL, add: this.ZP0, cyc: 5 },
                { id: 0x07, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x08, op: this.PHP, add: this.IMP, cyc: 3 },
                { id: 0x09, op: this.ORA, add: this.IMM, cyc: 2 },
                { id: 0x0a, op: this.ASL, add: this.IMP, cyc: 2 },
                { id: 0x0b, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x0c, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x0d, op: this.ORA, add: this.ABS, cyc: 4 },
                { id: 0x0e, op: this.ASL, add: this.ABS, cyc: 6 },
                { id: 0x0f, op: this.XXX, add: this.XXX, cyc: 0 },
                //ROW 1
                { id: 0x10, op: this.BPL, add: this.REL, cyc: 2 },
                { id: 0x11, op: this.ORA, add: this.IZY, cyc: 5 },
                { id: 0x12, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x13, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x14, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x15, op: this.ORA, add: this.ZPX, cyc: 4 },
                { id: 0x16, op: this.ASL, add: this.ZPX, cyc: 6 },
                { id: 0x17, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x18, op: this.CLC, add: this.IMP, cyc: 2 },
                { id: 0x19, op: this.ORA, add: this.ABY, cyc: 4 },
                { id: 0x1a, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x1b, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x1c, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x1d, op: this.ORA, add: this.ABX, cyc: 4 },
                { id: 0x1e, op: this.ASL, add: this.ABX, cyc: 7 },
                { id: 0x1f, op: this.XXX, add: this.XXX, cyc: 0 },
                //ROW 2
                { id: 0x20, op: this.JSR, add: this.ABS, cyc: 6 },
                { id: 0x21, op: this.AND, add: this.IZX, cyc: 6 },
                { id: 0x22, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x23, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x24, op: this.BIT, add: this.ZP0, cyc: 3 },
                { id: 0x25, op: this.AND, add: this.ZP0, cyc: 3 },
                { id: 0x26, op: this.ROL, add: this.ZP0, cyc: 5 },
                { id: 0x27, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x28, op: this.PLP, add: this.IMP, cyc: 4 },
                { id: 0x29, op: this.AND, add: this.IMM, cyc: 2 },
                { id: 0x2a, op: this.ROL, add: this.IMP, cyc: 2 },
                { id: 0x2b, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x2c, op: this.BIT, add: this.ABS, cyc: 4 },
                { id: 0x2d, op: this.AND, add: this.ABS, cyc: 4 },
                { id: 0x2e, op: this.ROL, add: this.ABS, cyc: 6 },
                { id: 0x2f, op: this.XXX, add: this.XXX, cyc: 0 },
                //ROW 3
                { id: 0x30, op: this.BMI, add: this.REL, cyc: 2 },
                { id: 0x31, op: this.AND, add: this.IZY, cyc: 5 },
                { id: 0x32, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x33, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x34, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x35, op: this.AND, add: this.ZPX, cyc: 4 },
                { id: 0x36, op: this.ROL, add: this.ZPX, cyc: 6 },
                { id: 0x37, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x38, op: this.SEC, add: this.IMP, cyc: 2 },
                { id: 0x39, op: this.AND, add: this.ABY, cyc: 4 },
                { id: 0x3a, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x3b, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x3c, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x3d, op: this.AND, add: this.ABX, cyc: 4 },
                { id: 0x3e, op: this.ROL, add: this.ABX, cyc: 7 },
                { id: 0x3f, op: this.XXX, add: this.XXX, cyc: 0 },
                //ROW 4
                { id: 0x40, op: this.RTI, add: this.IMP, cyc: 6 },
                { id: 0x41, op: this.EOR, add: this.IZX, cyc: 6 },
                { id: 0x42, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x43, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x44, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x45, op: this.EOR, add: this.ZP0, cyc: 3 },
                { id: 0x46, op: this.LSR, add: this.ZP0, cyc: 5 },
                { id: 0x47, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x48, op: this.PHA, add: this.IMP, cyc: 3 },
                { id: 0x49, op: this.EOR, add: this.IMM, cyc: 2 },
                { id: 0x4a, op: this.LSR, add: this.IMP, cyc: 2 },
                { id: 0x4b, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x4c, op: this.JMP, add: this.ABS, cyc: 3 },
                { id: 0x4d, op: this.EOR, add: this.ABS, cyc: 4 },
                { id: 0x4e, op: this.LSR, add: this.ABS, cyc: 6 },
                { id: 0x4f, op: this.XXX, add: this.XXX, cyc: 0 },
                //ROW 5
                { id: 0x50, op: this.BVC, add: this.REL, cyc: 2 },
                { id: 0x51, op: this.EOR, add: this.IZY, cyc: 5 },
                { id: 0x52, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x53, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x54, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x55, op: this.EOR, add: this.ZPX, cyc: 4 },
                { id: 0x56, op: this.LSR, add: this.ZPX, cyc: 6 },
                { id: 0x57, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x58, op: this.CLI, add: this.IMP, cyc: 2 },
                { id: 0x59, op: this.EOR, add: this.ABY, cyc: 4 },
                { id: 0x5a, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x5b, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x5c, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x5d, op: this.EOR, add: this.ABX, cyc: 4 },
                { id: 0x5e, op: this.LSR, add: this.ABX, cyc: 7 },
                { id: 0x5f, op: this.XXX, add: this.XXX, cyc: 0 },
                //ROW 6
                { id: 0x60, op: this.RTS, add: this.IMP, cyc: 6 },
                { id: 0x61, op: this.ADC, add: this.IZX, cyc: 6 },
                { id: 0x62, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x63, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x64, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x65, op: this.ADC, add: this.ZP0, cyc: 3 },
                { id: 0x66, op: this.ROR, add: this.ZP0, cyc: 5 },
                { id: 0x67, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x68, op: this.PLA, add: this.IMP, cyc: 4 },
                { id: 0x69, op: this.ADC, add: this.IMM, cyc: 2 },
                { id: 0x6a, op: this.ROR, add: this.IMP, cyc: 2 },
                { id: 0x6b, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x6c, op: this.JMP, add: this.IND, cyc: 5 },
                { id: 0x6d, op: this.ADC, add: this.ABS, cyc: 4 },
                { id: 0x6e, op: this.ROR, add: this.ABS, cyc: 6 },
                { id: 0x6f, op: this.XXX, add: this.XXX, cyc: 0 },
                //ROW 7
                { id: 0x70, op: this.BVS, add: this.REL, cyc: 2 },
                { id: 0x71, op: this.ADC, add: this.IZY, cyc: 5 },
                { id: 0x72, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x73, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x74, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x75, op: this.ADC, add: this.ZPX, cyc: 4 },
                { id: 0x76, op: this.ROR, add: this.ZPX, cyc: 6 },
                { id: 0x77, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x78, op: this.SEI, add: this.IMP, cyc: 2 },
                { id: 0x79, op: this.ADC, add: this.ABY, cyc: 4 },
                { id: 0x7a, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x7b, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x7c, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x7d, op: this.ADC, add: this.ABX, cyc: 4 },
                { id: 0x7e, op: this.ROR, add: this.ABX, cyc: 7 },
                { id: 0x7f, op: this.XXX, add: this.XXX, cyc: 0 },
                //ROW 8
                { id: 0x80, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x81, op: this.STA, add: this.IZX, cyc: 6 },
                { id: 0x82, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x83, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x84, op: this.STY, add: this.ZP0, cyc: 3 },
                { id: 0x85, op: this.STA, add: this.ZP0, cyc: 3 },
                { id: 0x86, op: this.STX, add: this.ZP0, cyc: 3 },
                { id: 0x87, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x88, op: this.DEY, add: this.IMP, cyc: 2 },
                { id: 0x89, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x8a, op: this.TXA, add: this.IMP, cyc: 2 },
                { id: 0x8b, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x8c, op: this.STY, add: this.ABS, cyc: 4 },
                { id: 0x8d, op: this.STA, add: this.ABS, cyc: 4 },
                { id: 0x8e, op: this.STX, add: this.ABS, cyc: 4 },
                { id: 0x8f, op: this.XXX, add: this.XXX, cyc: 0 },
                //ROW 9
                { id: 0x90, op: this.BCC, add: this.REL, cyc: 2 },
                { id: 0x91, op: this.STA, add: this.IZY, cyc: 6 },
                { id: 0x92, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x93, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x94, op: this.STY, add: this.ZPX, cyc: 4 },
                { id: 0x95, op: this.STA, add: this.ZPX, cyc: 4 },
                { id: 0x96, op: this.STX, add: this.ZPY, cyc: 4 },
                { id: 0x97, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x98, op: this.TYA, add: this.IMP, cyc: 2 },
                { id: 0x99, op: this.STA, add: this.ABY, cyc: 5 },
                { id: 0x9a, op: this.TXS, add: this.IMP, cyc: 2 },
                { id: 0x9b, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x9c, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x9d, op: this.STA, add: this.ABX, cyc: 5 },
                { id: 0x9e, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0x9f, op: this.XXX, add: this.XXX, cyc: 0 },
                //ROW A
                { id: 0xa0, op: this.LDY, add: this.IMM, cyc: 2 },
                { id: 0xa1, op: this.LDA, add: this.IZX, cyc: 6 },
                { id: 0xa2, op: this.LDX, add: this.IMM, cyc: 2 },
                { id: 0xa3, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xa4, op: this.LDY, add: this.ZP0, cyc: 3 },
                { id: 0xa5, op: this.LDA, add: this.ZP0, cyc: 3 },
                { id: 0xa6, op: this.LDX, add: this.ZP0, cyc: 3 },
                { id: 0xa7, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xa8, op: this.TAY, add: this.IMP, cyc: 2 },
                { id: 0xa9, op: this.LDA, add: this.IMM, cyc: 2 },
                { id: 0xaa, op: this.TAX, add: this.IMP, cyc: 2 },
                { id: 0xab, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xac, op: this.LDY, add: this.ABS, cyc: 4 },
                { id: 0xad, op: this.LDA, add: this.ABS, cyc: 4 },
                { id: 0xae, op: this.LDX, add: this.ABS, cyc: 4 },
                { id: 0xaf, op: this.XXX, add: this.XXX, cyc: 0 },
                //ROW B
                { id: 0xb0, op: this.BCS, add: this.REL, cyc: 2 },
                { id: 0xb1, op: this.LDA, add: this.IZY, cyc: 5 },
                { id: 0xb2, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xb3, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xb4, op: this.LDY, add: this.ZPX, cyc: 4 },
                { id: 0xb5, op: this.LDA, add: this.ZPX, cyc: 4 },
                { id: 0xb6, op: this.LDX, add: this.ZPY, cyc: 4 },
                { id: 0xb7, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xb8, op: this.CLV, add: this.IMP, cyc: 2 },
                { id: 0xb9, op: this.LDA, add: this.ABY, cyc: 4 },
                { id: 0xba, op: this.TSX, add: this.IMP, cyc: 2 },
                { id: 0xbb, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xbc, op: this.LDY, add: this.ABX, cyc: 4 },
                { id: 0xbd, op: this.LDA, add: this.ABX, cyc: 4 },
                { id: 0xbe, op: this.LDX, add: this.ABY, cyc: 4 },
                { id: 0xbf, op: this.XXX, add: this.XXX, cyc: 0 },
                //ROW C
                { id: 0xc0, op: this.CPY, add: this.IMM, cyc: 2 },
                { id: 0xc1, op: this.CMP, add: this.IZX, cyc: 6 },
                { id: 0xc2, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xc3, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xc4, op: this.CPY, add: this.ZP0, cyc: 3 },
                { id: 0xc5, op: this.CMP, add: this.ZP0, cyc: 3 },
                { id: 0xc6, op: this.DEC, add: this.ZP0, cyc: 5 },
                { id: 0xc7, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xc8, op: this.INY, add: this.IMP, cyc: 2 },
                { id: 0xc9, op: this.CMP, add: this.IMM, cyc: 2 },
                { id: 0xca, op: this.DEX, add: this.IMP, cyc: 2 },
                { id: 0xcb, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xcc, op: this.CPY, add: this.ABS, cyc: 4 },
                { id: 0xcd, op: this.CMP, add: this.ABS, cyc: 4 },
                { id: 0xce, op: this.DEC, add: this.ABS, cyc: 6 },
                { id: 0xcf, op: this.XXX, add: this.XXX, cyc: 0 },
                //ROW D
                { id: 0xd0, op: this.BNE, add: this.REL, cyc: 2 },
                { id: 0xd1, op: this.CMP, add: this.IZY, cyc: 5 },
                { id: 0xd2, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xd3, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xd4, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xd5, op: this.CMP, add: this.ZPX, cyc: 4 },
                { id: 0xd6, op: this.DEC, add: this.ZPX, cyc: 6 },
                { id: 0xd7, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xd8, op: this.CLD, add: this.IMP, cyc: 2 },
                { id: 0xd9, op: this.CMP, add: this.ABY, cyc: 4 },
                { id: 0xda, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xdb, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xdc, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xdd, op: this.CMP, add: this.ABX, cyc: 4 },
                { id: 0xde, op: this.DEC, add: this.ABX, cyc: 7 },
                { id: 0xdf, op: this.XXX, add: this.XXX, cyc: 0 },
                //ROW E
                { id: 0xe0, op: this.CPX, add: this.IMM, cyc: 2 },
                { id: 0xe1, op: this.SBC, add: this.IZX, cyc: 6 },
                { id: 0xe2, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xe3, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xe4, op: this.CPX, add: this.ZP0, cyc: 3 },
                { id: 0xe5, op: this.SBC, add: this.ZP0, cyc: 3 },
                { id: 0xe6, op: this.INC, add: this.ZP0, cyc: 5 },
                { id: 0xe7, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xe8, op: this.INX, add: this.IMP, cyc: 2 },
                { id: 0xe9, op: this.SBC, add: this.IMM, cyc: 2 },
                { id: 0xea, op: this.NOP, add: this.IMP, cyc: 2 },
                { id: 0xeb, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xec, op: this.CPX, add: this.ABS, cyc: 4 },
                { id: 0xed, op: this.SBC, add: this.ABS, cyc: 4 },
                { id: 0xee, op: this.INC, add: this.ABS, cyc: 6 },
                { id: 0xef, op: this.XXX, add: this.XXX, cyc: 0 },
                //ROW F
                { id: 0xf0, op: this.BEQ, add: this.REL, cyc: 2 },
                { id: 0xf1, op: this.SBC, add: this.IZY, cyc: 5 },
                { id: 0xf2, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xf3, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xf4, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xf5, op: this.SBC, add: this.ZPX, cyc: 4 },
                { id: 0xf6, op: this.INC, add: this.ZPX, cyc: 6 },
                { id: 0xf7, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xf8, op: this.SED, add: this.IMP, cyc: 2 },
                { id: 0xf9, op: this.SBC, add: this.ABY, cyc: 4 },
                { id: 0xfa, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xfb, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xfc, op: this.XXX, add: this.XXX, cyc: 0 },
                { id: 0xfd, op: this.SBC, add: this.ABX, cyc: 4 },
                { id: 0xfe, op: this.INC, add: this.ABX, cyc: 7 },
                { id: 0xff, op: this.XXX, add: this.XXX, cyc: 0 },
            ];
            //otherwise the function pointers aren't bound to this class   
            this.all_instructions.forEach(instruction => {
                instruction.add = instruction.add.bind(this);
                instruction.op = instruction.op.bind(this);
                instruction.opcode_name = instruction.op.name.substr(6);
                instruction.addressmode_name = instruction.add.name.substr(6);
            });
        }
        getNextInstructionForDebug() {
            if (this.nes.DEBUGMODE) //EXPENSIVE
             {
                let next_opcode = this.read(this.PC);
                let next_instruction = this.getInstruction(next_opcode);
                try {
                    this.next_op = next_instruction.op.name.substr(6);
                    this.next_addressmode = next_instruction.add.name.substr(6);
                }
                catch (error) { }
            }
        }
        //cpu reset function sets the cpu to a known state
        reset() {
            this.A = 0;
            this.X = 0;
            this.Y = 0;
            this.STACK = 0xFD;
            this.STATUS = 0x24;
            this.updateFlagDebugViewer();
            //my own variables
            this.address = 0;
            //set the program counter to this hard coded address
            var lo = this.read(this.RESET_ADDRESS);
            var hi = this.read(this.RESET_ADDRESS + 1);
            this.PC = (hi << 8) | lo;
            this.cycles = 8;
            if (this.nes.DEBUGMODE)
                this.getNextInstructionForDebug();
        }
        //interrupt only if disable interrupt flag is clear
        //TODO currently not being used but will be used in APU and MMC3 Mapper later on
        irq() {
            if (this.getFlag(this.FLAG_I) == 0) {
                //write the program counter to the stack
                //lo and hi byte one at a time
                this.writeProgramCounterToStack();
                //write the status to stack
                this.writeStatusToStack();
                //set some flags
                this.setFlag(this.FLAG_B, 0);
                this.setFlag(this.FLAG_U, 1);
                this.setFlag(this.FLAG_I, 1);
                //set the program counter to this hard coded address
                var lo = this.read(this.IRQ_ADDRESS);
                var hi = this.read(this.IRQ_ADDRESS + 1);
                this.PC = (hi << 8) | lo;
                this.cycles = 7;
            }
        }
        //public interface for requesting nmi
        nmiRequest() {
            this.nmi_requested = true;
        }
        //public interface for requesting irq
        irqRequest() {
            this.irq_requested = true;
        }
        //same as IRQ but non maskable interrupt cannot be stopped
        //also the nmi_address is different
        nmi() {
            //write the program counter to the stack
            //lo and hi byte one at a time
            this.writeProgramCounterToStack();
            //write the status to stack
            this.writeStatusToStack();
            //set some flags
            this.setFlag(this.FLAG_B, 0);
            this.setFlag(this.FLAG_U, 1);
            this.setFlag(this.FLAG_I, 1);
            //set the program counter to this hard coded address
            var lo = this.read(this.NMI_ADDRESS);
            var hi = this.read(this.NMI_ADDRESS + 1);
            this.PC = (hi << 8) | lo;
            this.cycles = 8;
        }
        // HELPER FUNCTIONS
        read(address) {
            // this.last_read = data;
            return this.nes.memory.read(address);
        }
        write(address, value) {
            this.nes.memory.write(address, value);
        }
        //mask a number to 8 bits
        //since javascript only has floating point numbers
        mask255(data) {
            return data & 0xFF;
        }
        compare(data, comparer) {
            if (comparer >= data)
                this.setFlag(this.FLAG_C, 1);
            else
                this.setFlag(this.FLAG_C, 0);
            if (comparer == data)
                this.setFlag(this.FLAG_Z, 1);
            else
                this.setFlag(this.FLAG_Z, 0);
            if ((comparer - data) & 0x80)
                this.setFlag(this.FLAG_N, 1);
            else
                this.setFlag(this.FLAG_N, 0);
        }
        //write the program counter to the stack
        writeProgramCounterToStack() {
            this.write(0x0100 + this.STACK, (this.PC >> 8) & 0x00FF);
            this.STACK--;
            this.write(0x0100 + this.STACK, this.PC & 0x00FF);
            this.STACK--;
        }
        writeStatusToStack() {
            this.write(0x0100 + this.STACK, this.STATUS);
            this.STACK--;
        }
        getFlag(flag) {
            if (this.STATUS & (1 << flag))
                return 1;
            else
                return 0;
        }
        //value should be 0 or 1
        setFlag(flag, value) {
            this.STATUS = this.setBit(this.STATUS, flag, value);
            // this.updateFlagDebugViewer();
        }
        //call this manually whenever status gets updated
        updateFlagDebugViewer() {
            if (this.nes.DEBUGMODE) //EXPENSIVE
             {
                this.debug_viewer_fl.B = this.getFlag(this.FLAG_B);
                this.debug_viewer_fl.C = this.getFlag(this.FLAG_C);
                this.debug_viewer_fl.D = this.getFlag(this.FLAG_D);
                this.debug_viewer_fl.I = this.getFlag(this.FLAG_I);
                this.debug_viewer_fl.N = this.getFlag(this.FLAG_N);
                this.debug_viewer_fl.U = this.getFlag(this.FLAG_U);
                this.debug_viewer_fl.V = this.getFlag(this.FLAG_V);
                this.debug_viewer_fl.Z = this.getFlag(this.FLAG_Z);
            }
        }
        updateHexDebugValues() {
            if (this.nes.DEBUGMODE) //EXPENSIVE
             {
                this.debug_hex_values.A = this.A.toString(16);
                this.debug_hex_values.X = this.X.toString(16);
                this.debug_hex_values.Y = this.Y.toString(16);
                this.debug_hex_values.P = this.STATUS.toString(16);
                this.debug_hex_values.SP = this.STACK.toString(16);
                this.debug_hex_values.PC = this.PC.toString(16);
            }
        }
        getBit(byte, bit) {
            return (byte >> bit) & 1;
        }
        setBit(byte, bit, value) {
            if (value > 0)
                return byte | (1 << bit);
            else
                return byte & ~(1 << bit);
        }
        toggleBit(byte, bit) {
            return byte ^ (1 << bit);
        }
        getInstruction(opcode) {
            //EXPENSIVE
            // let instruction = this.all_instructions.find((ins) => {
            //     return ins.id == opcode;
            // })
            // if (instruction)
            //     return instruction;
            // else
            //     return this.not_implemented;
            return this.all_instructions[opcode];
        }
        getData() {
            return this.read(this.address);
        }
        setFlagsZandN(value) {
            let maskedValue = this.mask255(value);
            //set the zero flag if the value is zero
            if (maskedValue == 0)
                this.setFlag(this.FLAG_Z, 1);
            else
                this.setFlag(this.FLAG_Z, 0);
            //set the negative flag if the most significant bit is 1
            this.setFlag(this.FLAG_N, this.getBit(maskedValue, 7));
            // if (value & 0x80)
            //     this.setFlag(FLAG.N, 1);
            // else
            //     this.setFlag(FLAG.N, 0);
        }
        branch(do_branch) {
            if (do_branch) {
                this.cycles++;
                //move forward or backward for branching
                //based on what was determined in the 
                //relative addressing mode
                this.address = this.PC + this.address;
                //add a cycle if we cross a page boundary
                if ((this.address & 0xFF00) != (this.PC & 0xFF00))
                    this.cycles++;
                this.PC = this.address;
            }
        }
        // ADDRESSING MODES
        //TODO - my timing will be off unless i implement
        //all of the potential cycle adds based on page boundaries
        //and other scenarios. will probably affect my audio later
        //implied
        IMP() {
            //do nothing
        }
        //immediate
        IMM() {
            //get the data from the next literal byte in the program
            this.address = this.PC;
            this.PC++;
        }
        //zero page addressing
        ZP0() {
            //get the byte from the zero page
            this.address = this.read(this.PC) & 0x00FF;
            this.PC++;
        }
        //zero page with X register offset
        ZPX() {
            this.address = (this.read(this.PC) + this.X) & 0x00FF;
            // this.address += this.X;
            // this.address = this.address & 0x00FF;
            this.PC++;
        }
        ZPY() {
            this.address = (this.read(this.PC) + this.Y) & 0x00FF;
            // this.address += this.Y;
            // this.address = this.address & 0x00FF;
            this.PC++;
        }
        //absolute addressing
        //read the low and high byte of the 2 byte address
        ABS() {
            // var lo = this.read(this.PC);
            // var hi = this.read(this.PC + 1);
            // this.address = (this.nes.memory.read(this.PC + 1) << 8) | this.nes.memory.read(this.PC);
            this.address = (this.read(this.PC + 1) << 8) | this.read(this.PC);
            this.PC += 2;
        }
        //absolute with x register offset
        ABX() {
            var lo = this.read(this.PC);
            var hi = this.read(this.PC + 1);
            this.PC += 2;
            this.address = (hi << 8) | lo;
            this.address += this.X;
            //just in case its larger than 16 bit max
            this.address = this.address & 0xffff;
            //if we have crossed the page boundary
            //then add 1 cycle
            if (lo + this.X > 255)
                this.cycles += 1;
        }
        //absolute with y register offset
        ABY() {
            var lo = this.read(this.PC);
            var hi = this.read(this.PC + 1);
            this.PC += 2;
            this.address = (hi << 8) | lo;
            this.address += this.Y;
            //just in case its larger than 16 bit max
            this.address = this.address & 0xffff;
            //if we have crossed the page boundary
            //then add 1 cycle
            if (lo + this.Y > 255)
                this.cycles += 1;
        }
        //indirect addressing
        //6502 version of pointers
        IND() {
            var lo = this.read(this.PC);
            var hi = this.read(this.PC + 1);
            this.PC += 2;
            var pointer = (hi << 8) | lo;
            //simulate page boundary hardware bug (only if low byte is 255)
            //low byte at pointer and high byte at pointer+1
            if (lo == 255)
                this.address = (this.read(pointer & 0xFF00) << 8) | this.read(pointer);
            else
                this.address = (this.read(pointer + 1) << 8) | this.read(pointer);
        }
        //zero page indirect addressing with X offset
        IZX() {
            var num = this.read(this.PC);
            this.PC++;
            var lo_address = (num + this.X) & 0x00ff;
            var hi_address = (num + this.X + 1) & 0x00ff;
            var lo = this.read(lo_address);
            var hi = this.read(hi_address);
            this.address = (hi << 8) | lo;
        }
        //zero page indirect addressing with Y 
        //behaves differently than IZX in that it adds
        //Y to the final address rather than using
        //as an offset when reading the address
        IZY() {
            var num = this.read(this.PC);
            this.PC++;
            var lo_address = num & 0x00ff;
            var hi_address = (num + 1) & 0x00ff;
            var lo = this.read(lo_address);
            var hi = this.read(hi_address);
            //add a cycle if it crosses a page boundary
            if (lo + this.Y > 255)
                this.cycles += 1;
            this.address = (((hi << 8) | lo) + this.Y) & 0xffff;
        }
        //relative addressing
        //can only jump back -128 or forward 127
        //used in branching
        REL() {
            this.address = this.read(this.PC);
            //weirdly this is a signed number so if it's 128 or 
            //above it's actually considered a negative number
            //so we subtract 256 from it to get the correct value
            //example: 251 is actually -5 for branching purposes
            if (this.address >= 128)
                this.address -= 256;
            this.PC++;
        }
        // OPCODES
        //add M to A with carry
        ADC() {
            var data = this.getData();
            var temp = this.A + data + this.getFlag(this.FLAG_C);
            this.setFlagsZandN(temp);
            //set the carry bit 
            this.setFlag(this.FLAG_C, temp > 255 ? 1 : 0);
            //set the overflow flag based on a formula
            //just trust that it works
            if (((this.A ^ data) & 0x80) == 0 && ((this.A ^ temp) & 0x80) != 0)
                this.setFlag(this.FLAG_V, 1);
            else
                this.setFlag(this.FLAG_V, 0);
            //load the value back into the accumulator
            //make sure it's 8-bit
            this.A = this.mask255(temp);
        }
        //do an AND operation between accumulator and the data
        AND() {
            this.A = this.A & this.getData();
            this.setFlagsZandN(this.A);
        }
        //arithmetic shift left
        ASL() {
            var data;
            //if addressing mode is implied then
            //we are acting upon the accumulator
            //other write it back to the same address
            if (this.current_instruction.addressmode_name == "IMP") {
                data = this.A << 1;
                this.A = this.mask255(data);
            }
            else {
                data = this.getData() << 1;
                this.write(this.address, this.mask255(data));
            }
            if (data > 255)
                this.setFlag(this.FLAG_C, 1);
            else
                this.setFlag(this.FLAG_C, 0);
            this.setFlagsZandN(data);
        }
        //branch on carry clear
        BCC() {
            this.branch(this.getFlag(this.FLAG_C) == 0);
        }
        //branch if carry bit is set
        BCS() {
            this.branch(this.getFlag(this.FLAG_C) == 1);
        }
        //branch if zero
        BEQ() {
            this.branch(this.getFlag(this.FLAG_Z) == 1);
        }
        //test bits in M with A
        //set flag z with accumulator & data
        BIT() {
            var data = this.getData();
            var temp = this.A & data;
            if (this.mask255(temp) == 0)
                this.setFlag(this.FLAG_Z, 1);
            else
                this.setFlag(this.FLAG_Z, 0);
            this.setFlag(this.FLAG_N, data & (1 << 7));
            this.setFlag(this.FLAG_V, data & (1 << 6));
        }
        //branch if result is negative
        BMI() {
            this.branch(this.getFlag(this.FLAG_N) == 1);
        }
        //branch on result not zero
        BNE() {
            this.branch(this.getFlag(this.FLAG_Z) == 0);
        }
        //branch if result is positive
        BPL() {
            this.branch(this.getFlag(this.FLAG_N) == 0);
        }
        //break operation - perform an interrupt from the program
        BRK() {
            this.PC++;
            this.writeProgramCounterToStack();
            this.writeStatusToStack();
            this.setFlag(this.FLAG_B, 1); //SHOULD THIS GO AFTER WRITE?? 
            //set the program counter to this hard coded address
            var lo = this.read(this.IRQ_ADDRESS);
            var hi = this.read(this.IRQ_ADDRESS + 1);
            this.PC = (hi << 8) | lo;
        }
        //branch if overflow clear
        BVC() {
            this.branch(this.getFlag(this.FLAG_V) == 0);
        }
        //branch if oveflow set
        BVS() {
            this.branch(this.getFlag(this.FLAG_V) == 1);
        }
        //clear carry flag
        CLC() {
            this.setFlag(this.FLAG_C, 0);
        }
        //clear decimal flag
        CLD() {
            this.setFlag(this.FLAG_D, 0);
        }
        //clear interrupt flag
        CLI() {
            this.setFlag(this.FLAG_I, 0);
        }
        //clear overflow flag
        CLV() {
            this.setFlag(this.FLAG_V, 0);
        }
        //compare data to the accumulator
        CMP() {
            var data = this.getData();
            this.compare(data, this.A);
        }
        //compare data to X Register
        CPX() {
            var data = this.getData();
            this.compare(data, this.X);
        }
        //compare data to Y Register
        CPY() {
            var data = this.getData();
            this.compare(data, this.Y);
        }
        //decrement value at memory location
        DEC() {
            var data = this.getData();
            data--;
            this.setFlagsZandN(data);
            data = this.mask255(data);
            this.write(this.address, data);
        }
        //decrement X Register
        DEX() {
            this.X = this.mask255(this.X - 1);
            this.setFlagsZandN(this.X);
        }
        //decrement Y Register
        DEY() {
            this.Y = this.mask255(this.Y - 1);
            this.setFlagsZandN(this.Y);
        }
        //bitwise logic XOR
        EOR() {
            var data = this.getData();
            this.A = this.mask255(this.A ^ data);
            this.setFlagsZandN(this.A);
        }
        //increment value at memory location
        INC() {
            var data = this.getData();
            data++;
            this.setFlagsZandN(data);
            data = this.mask255(data);
            this.write(this.address, data);
        }
        //incremement X Register
        INX() {
            this.X++;
            this.setFlagsZandN(this.X);
            this.X = this.mask255(this.X);
        }
        //incremement Y Register
        INY() {
            this.Y++;
            this.setFlagsZandN(this.Y);
            this.Y = this.mask255(this.Y);
        }
        //jump to location
        JMP() {
            this.PC = this.address;
        }
        //jump to subroutine
        JSR() {
            this.PC--;
            this.writeProgramCounterToStack();
            this.PC = this.address;
        }
        //load the accumulator
        LDA() {
            this.A = this.getData();
            // this.A = 120;
            this.setFlagsZandN(this.A);
        }
        //load the X register
        LDX() {
            this.X = this.getData();
            this.setFlagsZandN(this.X);
        }
        //load the Y register
        LDY() {
            this.Y = this.getData();
            this.setFlagsZandN(this.Y);
        }
        //logical shift right
        //set the carry bit to the old bit 0
        LSR() {
            var data;
            //if addressing mode is implied then
            //we are acting upon the accumulator
            //other write it back to the same address
            if (this.current_instruction.addressmode_name == "IMP") {
                data = this.A;
                this.setFlag(this.FLAG_C, this.A & 1);
                data = data >> 1;
                this.A = this.mask255(data);
            }
            else {
                data = this.getData();
                this.setFlag(this.FLAG_C, data & 1);
                data = data >> 1;
                this.write(this.address, this.mask255(data));
            }
            this.setFlagsZandN(data);
        }
        //no operation
        NOP() {
        }
        //bitwise OR on accumulator
        ORA() {
            var data = this.getData();
            this.A = this.mask255(this.A | data);
            this.setFlagsZandN(this.A);
        }
        //push the accumulator onto the stack
        //on the 6502 the stack pointer decreases
        //as you push things onto it
        PHA() {
            this.write(0x0100 + this.STACK, this.A);
            this.STACK--; //decrease the stack pointer;
        }
        //push status register to stack
        //set break flag before push
        PHP() {
            // this.setFlag(this.FLAG_B, 1);
            this.write(0x0100 + this.STACK, this.STATUS);
            this.STACK--; //decrease the stack pointer;
        }
        //pop the stack and load it into the accumulator
        //0x0100 is a hard coded address from which the stack pointer starts
        PLA() {
            this.STACK++; //increase the stack pointer;
            this.A = this.read(0x0100 + this.STACK);
            this.setFlagsZandN(this.A);
        }
        //pop status register off stack
        PLP() {
            this.STACK++; //increase the stack pointer;
            this.STATUS = this.read(0x0100 + this.STACK);
            this.setFlag(this.FLAG_U, 1);
            this.setFlag(this.FLAG_B, 0); //??
        }
        //rotate left - shift all bits left by 1
        //Move each of the bits in either A or M 
        //one place to the left. Bit 0 is filled 
        //with the current value of the carry flag 
        //whilst the old bit 7 becomes the new carry flag value.
        ROL() {
            var data;
            if (this.current_instruction.addressmode_name == "IMP") {
                data = this.A << 1 | this.getFlag(this.FLAG_C);
                this.A = this.mask255(data);
            }
            else {
                data = this.getData() << 1 | this.getFlag(this.FLAG_C);
                this.write(this.address, this.mask255(data));
            }
            this.setFlag(this.FLAG_C, this.getBit(data, 8));
            this.setFlagsZandN(data);
        }
        //rotate right - shift all bits right by 1
        //Move each of the bits in either A or M one place to the right. 
        //Bit 7 is filled with the current value of the carry flag 
        //whilst the old bit 0 becomes the new carry flag value.
        ROR() {
            var data;
            if (this.current_instruction.addressmode_name == "IMP") {
                data = this.A >> 1 | (this.getFlag(this.FLAG_C) << 7);
                this.setFlag(this.FLAG_C, this.getBit(this.A, 0));
                this.A = this.mask255(data);
            }
            else {
                var fetched_data = this.getData();
                data = fetched_data >> 1 | (this.getFlag(this.FLAG_C) << 7);
                this.setFlag(this.FLAG_C, this.getBit(fetched_data, 0));
                this.write(this.address, this.mask255(data));
            }
            this.setFlagsZandN(data);
        }
        //restore the state of the program 
        //to before when the interrupt happened
        //by restoring the status and the program counter
        RTI() {
            //restore status
            this.STACK++; //increase the stack pointer;
            this.STATUS = this.read(0x0100 + this.STACK);
            this.setFlag(this.FLAG_U, 1);
            this.updateFlagDebugViewer();
            //restore program counter
            this.STACK++;
            var lo = this.read(0x0100 + this.STACK);
            this.STACK++;
            var hi = this.read(0x0100 + this.STACK);
            this.PC = (hi << 8) | lo;
        }
        //return from subroutine
        //The RTS instruction is used at the end of a subroutine 
        //to return to the calling routine. It pulls the 
        //program counter (minus one) from the stack.
        RTS() {
            //restore program counter
            this.STACK++;
            var lo = this.read(0x0100 + this.STACK);
            this.STACK++;
            var hi = this.read(0x0100 + this.STACK);
            this.PC = (hi << 8) | lo;
            this.PC++;
        }
        //subtract with carry
        //so weirdly if the carry bit is not set it will be one less than you expect
        //so 10 - 5 = 4 unless you set the carry bit
        //https://stackoverflow.com/questions/48971814/i-dont-understand-whats-going-on-with-sbc
        SBC() {
            var data = this.getData();
            var temp = this.A - data - (1 - this.getFlag(this.FLAG_C));
            this.setFlagsZandN(temp);
            //set the carry bit 
            this.setFlag(this.FLAG_C, temp < 0 ? 0 : 1);
            //set the overflow flag based on a formula
            //just trust that it works
            if (((this.A ^ data) & 0x80) != 0 && ((this.A ^ temp) & 0x80) != 0)
                this.setFlag(this.FLAG_V, 1);
            else
                this.setFlag(this.FLAG_V, 0);
            //load the value back into the accumulator
            //make sure it's 8-bit
            this.A = temp & 0xFF;
        }
        //set the carry flag to 1
        SEC() {
            this.setFlag(this.FLAG_C, 1);
        }
        //set the decimal flag to 1
        SED() {
            this.setFlag(this.FLAG_D, 1);
        }
        //set the interrupt flag to 1
        SEI() {
            this.setFlag(this.FLAG_I, 1);
        }
        //store A register
        STA() {
            this.write(this.address, this.A);
        }
        //store X Register
        STX() {
            this.write(this.address, this.X);
        }
        //store Y register
        STY() {
            this.write(this.address, this.Y);
        }
        //transfer accumulator to X
        //Copies the current contents of the accumulator into the 
        //X register and sets the zero and negative flags as appropriate.
        TAX() {
            this.X = this.A;
            this.setFlagsZandN(this.X);
        }
        //transfer accumulator to Y
        TAY() {
            this.Y = this.A;
            this.setFlagsZandN(this.Y);
        }
        //transfer stack pointer to X
        TSX() {
            this.X = this.STACK;
            this.setFlagsZandN(this.X);
        }
        //transfer X to accumulator
        TXA() {
            this.A = this.X;
            this.setFlagsZandN(this.A);
        }
        //transfer X to Stack Pointer
        //don't look at flags z and n
        TXS() {
            this.STACK = this.X;
        }
        //transfer Y to accumulator
        TYA() {
            this.A = this.Y;
            this.setFlagsZandN(this.A);
        }
        XXX() {
            //illegal opcode
        }
    }
    exports.CPU = CPU;
});
//# sourceMappingURL=cpu.js.map