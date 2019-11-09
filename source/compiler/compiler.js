if (typeof define !== 'function') { var define = require('amdefine')(module);}

define([
    './analyzer.js',
    './c6502.js',
    './cartridge.js',
    './directives.js'
    ], function(analyzer, c6502, cartridge, directives) {

    var compiler = function(){
        window["compiler"] = this;
    };

    var asm65_tokens = [
        //NEIL added constants, add/subtract modifiers

        {type:'T_INSTRUCTION', regex:/^(ADC|AND|ASL|BCC|BCS|BEQ|BIT|BMI|BNE|BPL|BRK|BVC|BVS|CLC|CLD|CLI|CLV|CMP|CPX|CPY|DEC|DEX|DEY|EOR|INC|INX|INY|JMP|JSR|LDA|LDX|LDY|LSR|NOP|ORA|PHA|PHP|PLA|PLP|ROL|ROR|RTI|RTS|SBC|SEC|SED|SEI|STA|STX|STY|TAX|TAY|TSX|TXA|TXS|TYA)[ \n\t\r]{1}/i, store:true},
        {type:'T_ADDRESS', regex:/^(\<?\$([\da-fA-F]{1,4}))/, store:true},
        {type:'T_HEX_NUMBER', regex:/^(\#\$([\da-fA-F]{2}))/, store:true},
        {type:'T_BINARY_NUMBER', regex:/^(\#?%([01]{8}))/, store:true},
        {type:'T_LABEL', regex:/^(([a-zA-Z_]{2}[a-zA-Z_\d]*)\:)/, store:true},
        {type:'T_CONSTANT', regex:/^([a-zA-Z_]{2}[a-zA-Z_\d]*\s*)=(\s*\$?\#?\%?([\da-fA-F]{1,8}))/, store:true},
        {type:'T_MARKER', regex:/^(\#?\<?[a-zA-Z_]{2}[a-zA-Z_\d]*)/, store:true},
        {type:'T_STRING', regex:/^("[^"]*")/, store:true},
        {type:'T_SEPARATOR', regex:/^(,)/, store:true},
        {type:'T_ACCUMULATOR', regex:/^(A|a)/, store:true},
        {type:'T_REGISTER', regex:/^(X|x|Y|y)/, store:true},
        {type:'T_MODIFIER', regex:/^(#LOW|#HIGH)/, store:true},
        {type:'T_ADDSUBTRACT_MODIFIER', regex:/^((\+|\-)([\d]+))/, store:true},
        {type:'T_OPEN', regex:/^(\()/, store:true},
        {type:'T_CLOSE', regex:/^(\))/, store:true},
        {type:'T_OPEN_SQUARE_BRACKETS', regex:/^(\[)/, store:true},
        {type:'T_CLOSE_SQUARE_BRACKETS', regex:/^(\])/, store:true},
        {type:'T_DIRECTIVE', regex:/^(\.[a-z]+)/, store:true},
        {type:'T_DECIMAL_ARGUMENT', regex:/^(\#?([\d]+))/, store:true}, //TODO change to DECIMAL ARGUMENT
        {type:'T_ENDLINE', regex:/^(\n)/, store:true},
        {type:'T_WHITESPACE', regex:/^([ \t\r]+)/, store:false},
        {type:'T_COMMENT', regex:/^(;[^\n]*)/, store:false}
    ];

    compiler.prototype.lexical = function(code){
        return analyzer.analyse(code, asm65_tokens);
    };

    function look_ahead(tokens, index, type, value){
        if (index > tokens.length - 1){
            return 0;
        }
        var token = tokens[index];
        if (token.type === type){
            if (value === undefined || token.value.toUpperCase() === value.toUpperCase()){
                return 1;
            }
        }
        return 0;
    }

    function t_instruction(tokens, index){
        return look_ahead(tokens, index, 'T_INSTRUCTION');
    }

    function t_hex_number(tokens, index){
        return look_ahead(tokens, index, 'T_HEX_NUMBER');
    }

    function t_binary_number(tokens, index){
        return look_ahead(tokens, index, 'T_BINARY_NUMBER');
    }

    function t_number(tokens, index){
        return OR([t_hex_number, t_binary_number, t_decimal_argument], tokens, index);
    }

    function t_relative(tokens, index){
        if (t_instruction(tokens, index)){
            var valid = [ 'BCC', 'BCS', 'BEQ', 'BNE', 'BMI', 'BPL', 'BVC', 'BVS'];
            for (var v in valid){
                if(tokens[index].value.toUpperCase() === valid[v]){
                    return 1;
                }
            }
        }
        return 0;
    }

    function t_label(tokens, index){
        return look_ahead(tokens, index, 'T_LABEL');
    }

    function t_marker(tokens, index){
        return look_ahead(tokens, index, 'T_MARKER');
    }

    function t_address_or_t_binary_number_or_t_decimal_argument(tokens, index) {
        return OR([t_address, t_binary_number, t_decimal_argument], tokens, index);
    }


    function t_address_or_t_marker(tokens, index){
        return OR([t_address, t_marker], tokens, index);
    }

    function t_address(tokens, index){
        return look_ahead(tokens, index, 'T_ADDRESS');
    }

    function t_zeropage(tokens, index){
        if (t_address(tokens,index) && tokens[index].value.length === 3){
            return 1;
        }
        return 0;
    }

    function t_separator(tokens, index){
        return look_ahead(tokens, index, 'T_SEPARATOR', ',');
    }

    function t_accumulator(tokens, index){
        return look_ahead(tokens, index, 'T_ACCUMULATOR', 'A');
    }

    function t_register_x(tokens, index){
        return look_ahead(tokens, index, 'T_REGISTER', 'X');
    }

    function t_register_y(tokens, index){
        return look_ahead(tokens, index, 'T_REGISTER', 'Y');
    }

    function t_open(tokens, index){
        return look_ahead(tokens, index, 'T_OPEN', '(');
    }

    function t_close(tokens, index){
        return look_ahead(tokens, index, 'T_CLOSE', ')');
    }

    function t_open_square_brackets(tokens, index){
        return look_ahead(tokens, index, 'T_OPEN_SQUARE_BRACKETS', '[');
    }

    function t_close_square_brackets(tokens, index){
        return look_ahead(tokens, index, 'T_CLOSE_SQUARE_BRACKETS', ']');
    }

    function t_nesasm_compatible_open(tokens, index){
        return OR([t_open, t_open_square_brackets], tokens, index);
    }

    function t_nesasm_compatible_close(tokens, index){
        return OR([t_close, t_close_square_brackets], tokens, index);
    }

    function t_endline(tokens, index){
        return look_ahead(tokens, index, 'T_ENDLINE', '\n');
    }

    function OR(args, tokens, index){
        for (var t in args){
            if (args[t](tokens, index)){
                return args[t](tokens, index);
            }
        }
        return 0;
    }

    function t_modifier(tokens, index){
        return look_ahead(tokens, index, 'T_MODIFIER');
    }


    function t_directive(tokens, index){
        return look_ahead(tokens, index, 'T_DIRECTIVE');
    }

    function t_directive_argument(tokens, index){
        return OR([t_list, t_address, t_binary_number, t_marker, t_decimal_argument, t_string], tokens, index);
    }

    function t_decimal_argument(tokens, index){
        return look_ahead(tokens, index, 'T_DECIMAL_ARGUMENT');
    }

    function t_string(tokens, index){
        return look_ahead(tokens, index, 'T_STRING');
    }

    function t_list(tokens, index){
        // if (index==1633){
        //     let debug=1;
        // }
        if ((t_address_or_t_binary_number_or_t_decimal_argument(tokens, index) || t_marker(tokens, index))  && t_separator(tokens, index+1)){
            var islist = 1;
            var arg = 0;
            while (islist){
                //NEIL added t_marker as an allowed t_list entry
                islist = islist & t_separator(tokens, index + (arg * 2) + 1);
                islist = islist & 
                    (t_address_or_t_binary_number_or_t_decimal_argument(tokens, index + (arg * 2) + 2) ||
                        t_marker(tokens, index + (arg * 2) + 2));
                if (t_endline(tokens, index + (arg * 2) + 3) || index + (arg * 2) + 3 === tokens.length){
                    break;
                }
                arg++;
            }
            if (islist){
                return ((arg+1) * 2) +1;
            }
        }
        return 0;
    }

    var asm65_bnf = [
        {type:'S_RS', bnf:[t_marker, t_directive, t_directive_argument]},
        {type:'S_DIRECTIVE', bnf:[t_directive, t_directive_argument]},
        {type:'S_RELATIVE', bnf:[t_relative, t_address_or_t_marker]},
        {type:'S_IMMEDIATE', bnf:[t_instruction, t_number]},
        {type:'S_IMMEDIATE_WITH_MODIFIER', bnf:[t_instruction, t_modifier, t_open, t_address_or_t_marker, t_close]}, //nesasm hack
        {type:'S_ACCUMULATOR', bnf:[t_instruction, t_accumulator]},
        {type:'S_ZEROPAGE_X', bnf:[t_instruction, t_zeropage, t_separator, t_register_x]},
        {type:'S_ZEROPAGE_Y', bnf:[t_instruction, t_zeropage, t_separator, t_register_y]},
        {type:'S_ZEROPAGE', bnf:[t_instruction, t_zeropage]},
        {type:'S_ABSOLUTE_X', bnf:[t_instruction, t_address_or_t_marker, t_separator, t_register_x]},
        {type:'S_ABSOLUTE_Y', bnf:[t_instruction, t_address_or_t_marker, t_separator, t_register_y]},
        {type:'S_ABSOLUTE', bnf:[t_instruction, t_address_or_t_marker]},
        {type:'S_INDIRECT_X', bnf:[t_instruction, t_nesasm_compatible_open, t_address_or_t_marker, t_separator, t_register_x, t_nesasm_compatible_close]},
        {type:'S_INDIRECT_Y', bnf:[t_instruction, t_nesasm_compatible_open, t_address_or_t_marker, t_nesasm_compatible_close, t_separator, t_register_y]},
        {type:'S_IMPLIED', bnf:[t_instruction]}
    ];

    compiler.prototype.syntax = function(tokens){
        var ast = [];
        var x = 0;
        var labels = [];
        var code = [];
        var erros = [];
        var move = false;
        var constants = [];

        //NEIL cleanup phase
        for (var i = 0; i<tokens.length;i++){
            // if (tokens[i].line==1564){
            //     let debug=1;
            // }
            if (tokens[i].type=="T_ADDSUBTRACT_MODIFIER"){
                if (tokens[i+1].type=="T_SEPARATOR")
                {
                    //try swapping it out to put it at the end
                    //for examples like
                    //LDA myvar+5,y
                    
                    var temp = tokens[i];
                    tokens[i]=tokens[i+1];
                    tokens[i+1]=tokens[i+2];
                    tokens[i+2]=temp;
                }
            }
            if (tokens[i].type=="T_CONSTANT")
            {
                var vals = tokens[i].value.split("=");
                constants[vals[0]] = vals[1];
            }
            if (tokens[i].type=="T_ADDRESS")
            {
                let marker = tokens[i].value;
                if (marker.startsWith("<")){
                    tokens[i].value = marker.substring(1)
                }                
            }
            if (tokens[i].type=="T_MARKER")
            {
                let marker = tokens[i].value;
                let isNumber = false;

                //remove < character
                if (marker.startsWith("<"))
                {
                    marker = marker.substring(1);
                }
                if (marker.startsWith("#"))
                {
                    isNumber = true;
                    marker = marker.substring(1);   
                }
                //decide if it's a constant
                if (constants[marker]!=undefined)
                {
                    if (isNumber)
                    {
                        if (constants[marker].startsWith("$"))
                        {
                            tokens[i].type = "T_HEX_NUMBER";
                            tokens[i].value = "#" + constants[marker];
                        }
                        else if (constants[marker].startsWith("%")){
                            tokens[i].type = "T_BINARY_NUMBER";
                            tokens[i].value = constants[marker];
                        }
                        else
                        {
                            tokens[i].type = "T_DECIMAL_ARGUMENT";
                            tokens[i].value = constants[marker];
                        }
                    }
                    else
                    {
                        tokens[i].type = "T_ADDRESS";
                        tokens[i].value = constants[marker];

                        //if encountering a binary number in a .db list
                        //then convert it to a hex number
                        if (constants[marker].startsWith("%")){
                            let num = constants[marker].substring(1);
                            num = parseInt(num, 2).toString(16);
                            tokens[i].value = "$" + num;
                        }
                    }
                }
                else{
                    //check for high/low modifiers
                    var tempMarker = ''
                    if (marker=="LOW"){
                        //convert it back to #LOW
                        tokens[i].type = "T_MODIFIER";
                        tokens[i].value = "#LOW";
                    }
                    if (marker=="HIGH"){
                        //convert it back to #HIGH
                        tokens[i].type = "T_MODIFIER";
                        tokens[i].value = "#HIGH";
                    }
                    if (marker.startsWith("LOW_"))
                    {
                        //part of a .db list
                        tempMarker = marker.substring(4);
                    }
                    if (marker.startsWith("HIGH_"))
                    {
                        //part of a .db list
                        tempMarker = marker.substring(5);
                    }
                    if (tempMarker!='' && constants[tempMarker]!=undefined){
                        //currently assuming it's 5 chars long - example: $0032
                        tokens[i].type = "T_ADDRESS";
                        var newMarker = constants[tempMarker];
                        if (marker.startsWith("LOW_"))
                            newMarker = "$" + newMarker.substring(3);
                        if (marker.startsWith("HIGH_"))
                            newMarker = newMarker.substring(0,3);
                        tokens[i].value = newMarker;

                        //Labels will be handled later in the directives.js class
                        //during the opcodes phase
                    }
                }
            }
        }
        //Main AST Loop
        while (x < tokens.length){
            // if (tokens[x].line==1562)
            // {
            //     let debug=1;
            // }


            if (tokens[x].type=="T_CONSTANT")
            {
                x++;
                continue;
            }
            if (tokens[x].type=="T_ADDSUBTRACT_MODIFIER")
            {
                //NEIL add or subtract based on the modifier
                let last_child = ast[ast.length-1].children[1];
                if (last_child.type=="T_ADDRESS")
                {
                    // last_child.value = "$" +
                    // eval(parseInt(last_child.value.substring(1))
                    //      + tokens[x].value);
                    last_child.addsubtract = tokens[x].value;
                    
                }
                if (last_child.type=="T_MARKER"){
                    //handle it later in the symantic phase
                    last_child.addsubtract = tokens[x].value;
                }

                x++;
                continue;
            }
            if (t_label(tokens,x)){
                labels.push(get_value(tokens[x]));
                x++;
            }else if (t_endline(tokens,x)){
                x++;
            } else {
                for (var bnf in asm65_bnf){
                    var leaf = {};
                    var look_ahead = 0;
                    move = false;
                    for (var i in asm65_bnf[bnf].bnf){
                        move = asm65_bnf[bnf].bnf[i](tokens, x + look_ahead);
                        if (!move){
                            break;
                        }
                        look_ahead++;
                    }
                    if (move){
                        if (labels.length > 0){
                            leaf.labels = labels;
                            labels = [];
                        }
                        var size = 0;
                        look_ahead = 0;
                        for (var b in asm65_bnf[bnf].bnf) {
                            size += asm65_bnf[bnf].bnf[b](tokens, x+look_ahead);
                            look_ahead++;
                        }
                        leaf.children = tokens.slice(x, x+size);
                        leaf.type = asm65_bnf[bnf].type;
                        ast.push(leaf);
                        x += size;
                        break;
                    }
                }
                if (!move){
                    var walk = 0;
                    while(!t_endline(tokens,x+walk) && x+walk < tokens.length){
                        walk++;
                    }
                    var erro = {};
                    erro.type = "Syntax Error";
                    erro.children = tokens.slice(x, x+walk);
                    erro.message = "Invalid syntax";
                    erros.push(erro);
                    x += walk;
                }
            }
        }
        //NEIL post cleanup
        for (var i=0;i<ast.length;i++){
            let token = ast[i];
            let debug=1;
            if (token.type=="S_ZEROPAGE_Y"){
                debug=1;
                //there is no zpy with lda,sta,ora opcodes
                //set it back to absolute y
                if (token.children[0].value=="LDA"){
                    token.type = "S_ABSOLUTE_Y";
                }
                if (token.children[0].value=="ORA"){
                    token.type = "S_ABSOLUTE_Y";
                }
                if (token.children[0].value=="STA"){
                    token.type = "S_ABSOLUTE_Y";
                }
                if (token.children[0].value=="ADC"){
                    token.type = "S_ABSOLUTE_Y";
                }
                if (token.children[0].value=="CMP"){
                    token.type = "S_ABSOLUTE_Y";
                }
            }
        }

        if (erros.length > 0){
            var e = new Error();
            e.name = "Syntax Error";
            e.message = "There were found " + erros.length + " erros:\n";
            e.ast = ast;
            e.erros = erros;
            throw e;
        }
        return ast;
    };

    function get_value(token, labels){
        var m;
        if (token.type === 'T_ADDRESS'){
            m = asm65_tokens[1].regex.exec(token.value);
            return parseInt(m[2], 16);
        }else if (token.type === 'T_HEX_NUMBER'){
            m = asm65_tokens[2].regex.exec(token.value);
            return parseInt(m[2], 16);
        }else if (token.type === 'T_BINARY_NUMBER'){
            m = asm65_tokens[3].regex.exec(token.value);
            return parseInt(m[2], 2);
        }else if (token.type === 'T_DECIMAL_ARGUMENT'){
            if (token.value.indexOf('#')>=0)
            {
                token.value = token.value.replace('#','');
            }
            return parseInt(token.value,10);
        }else if (token.type == 'T_LABEL'){
            m = asm65_tokens[4].regex.exec(token.value);
            return m[2];
        }else if (token.type === 'T_MARKER'){
            return labels[token.value];
        } else if (token.type === 'T_STRING'){
            return token.value.substr(1, token.value.length - 2);
        }
        throw "Could not get that value";
    }

    compiler.prototype.get_labels = function(ast){
        var labels = {};
        var address = 0;
        for (var la in ast){
            var leaf = ast[la];
            // if (leaf.children[0].line==1562){
            //     let debug=1;
            // }
            if (leaf.type === 'S_DIRECTIVE' && '.org' === leaf.children[0].value){
                address = parseInt(leaf.children[1].value.substr(1),16);
            }
            if (leaf.type === 'S_DIRECTIVE' && '.dw' === leaf.children[0].value){
                address += 2;
            }
            if (leaf.labels !== undefined){
                labels[leaf.labels[0]] = address;
            }
            if (leaf.type !== 'S_DIRECTIVE' && leaf.type !== 'S_RS'){
                var size = c6502.address_mode_def[leaf.type].size;
                address += size;
            } else if (leaf.type === 'S_DIRECTIVE' && '.db' === leaf.children[0].value){
                for (var i in leaf.children){
                    //NEIL added t_marker to account for correct address counting
                    if ('T_ADDRESS'===leaf.children[i].type || 'T_MARKER'===leaf.children[i].type 
                        || 'T_BINARY_NUMBER'===leaf.children[i].type){
                        address++;
                    }
                }
            } else if (leaf.type === 'S_DIRECTIVE' && '.incbin' === leaf.children[0].value){
                address += 4 * 1024; //TODO check file size;
            }
        }
        return labels;
    };

    compiler.prototype.semantic = function(ast, iNES){
        var cart = new cartridge.Cartridge();
        var labels = this.get_labels(ast);
        window["labels"] = labels;
        //find all labels o the symbol table
        var erros = [];
        var erro;
        //Translate opcodes
        var address = 0;
        for (var l in ast) {
            var leaf = ast[l];
            leaf.pc = cart.pc;
            // if (leaf.children[0].line==2690){
            //     let debug=1;
            // }
            // if (leaf.children[0].line==4364){
            //     let debug=1;
            // }
            if (leaf.type === 'S_RS'){
                //marker
                labels[leaf.children[0].value] = cart.rs;
                cart.rs += get_value(leaf.children[2]);

            } else if (leaf.type === 'S_DIRECTIVE'){
                var directive = leaf.children[0].value;
                var argument;
                if (leaf.children.length === 2){
                    argument = get_value(leaf.children[1], labels);
                } else {
                    argument = leaf.children.slice(1, leaf.children.length);
                }
                //NEIL passing in labels as a parameter to the directive function
                if (directives.directive_list[directive] !== undefined){
                    directives.directive_list[directive](argument, cart, labels);
                } else {
                    erro = {};
                    erro.type = "Unknow Directive";
                    erros.push(erro);
                }
            }else {
                var instruction;
                switch(leaf.type){
                    case 'S_IMPLIED':
                    case 'S_ACCUMULATOR':
                        instruction = leaf.children[0].value;
                        address = false;
                        break;
                    case 'S_RELATIVE':
                        instruction = leaf.children[0].value;
                        address = get_value(leaf.children[1], labels);
                        if (address==undefined)
                        {
                            erro = {};
                            erro.type = 'SEMANTIC ERROR';
                            erro.msg = 'invalid label';
                            erro.sentence = leaf;
                            erros.push(erro);
                        }
                        else
                        {
                            address = 126 + (address - cart.pc);
                            if (address === 128){
                                address = 0;
                            } else if (address < 128){
                                address = address | 128;
                            } else if (address > 128){
                                address = address & 127;
                            }
                        }

                        break;
                    case 'S_IMMEDIATE_WITH_MODIFIER':
                        instruction = leaf.children[0].value;
                        var modifier = leaf.children[1].value;
                        address = get_value(leaf.children[3], labels);
                        if ('#LOW' === modifier){
                            address = (address & 0x00ff);
                        } else if ('#HIGH' === modifier){
                            address = (address & 0xff00) >> 8;
                        }
                        break;
                    case 'S_IMMEDIATE':
                    case 'S_ZEROPAGE':
                    case 'S_ABSOLUTE':
                    case 'S_ZEROPAGE_X':
                    case 'S_ZEROPAGE_Y':
                    case 'S_ABSOLUTE_X':
                    case 'S_ABSOLUTE_Y':
                        instruction = leaf.children[0].value;
                        address = get_value(leaf.children[1], labels);
                        if (address==undefined)
                        {
                            erro = {};
                            erro.type = 'SEMANTIC ERROR2';
                            erro.msg = 'invalid label';
                            erro.sentence = leaf;
                            erros.push(erro);
                        }
                        else if (leaf.children[1].addsubtract!=null){
                            address = eval(address + leaf.children[1].addsubtract);
                        }
                        break;
                    case 'S_INDIRECT_X':
                    case 'S_INDIRECT_Y':
                        instruction = leaf.children[0].value;
                        address = get_value(leaf.children[2], labels);
                        break;
                }
                var address_mode = c6502.address_mode_def[leaf.type].short;
                var opcode = c6502.opcodes[instruction.toUpperCase()][address_mode];
                if (opcode === undefined){
                    erro = {};
                    erro.type = 'SEMANTIC ERROR3';
                    erro.msg = 'invalid opcode';
                    erro.sentence = leaf;
                    erros.push(erro);
                } else if (address_mode === 'sngl' || address_mode === 'acc'){
                    cart.append_code([opcode]);
                } else if (c6502.address_mode_def[leaf.type].size === 2){
                    cart.append_code([opcode, address]);
                } else {
                    var arg1 = (address & 0x00ff);
                    var arg2 = (address & 0xff00) >> 8;
                    cart.append_code([opcode, arg1, arg2]);
                }
            }
        }
        if (erros.length > 0){
            var e = new Error();
            e.name = "Semantic Error";
            e.message = "Semantic Error Message";
            e.erros = erros;
            throw e;
        }
        if (iNES){
            return cart.get_ines_code();
        } else {
            return cart.get_code();
        }
    };

    compiler.prototype.getTokensLinenumber = function(linenumber){
        var tokens = window["tokens"];
        var ast = window["ast"];
        var returnTokens = [];
        var returnAst = [];

        tokens.forEach(token => {
            if (token.line==linenumber)
                returnTokens.push(token);
        });

        ast.forEach(as => {
            var childMatch=false;
            as.children.forEach(child => {
                if (child.line==linenumber)
                    childMatch = true;
            });
            if (childMatch)
                returnAst.push(as);
        });        

        return { tokens:returnTokens, ast:returnAst };
    }

    compiler.prototype.nes_compiler = function(code){
        //NEIL this is the main compiler function
        //pause after 2 seconds
        if (code.startsWith(";UNIT TESTS ROM"))
        {
            setTimeout(() => {
                if (window["myApp"].nes.PAUSED==false){
                    window["myApp"].nes.PAUSED=true;
                    let result = window["myApp"].runUnitTests();
                    if (result){
                        toastr.success('Unit Tests Passed');
                    }else{
                        toastr.error('Unit Tests Failed');
                    }
                }
                
            }, 2000);


        }

        var tokens;
        var erros=[];
        try {
            tokens = this.lexical(code);
        } catch (e){
            tokens = e.tokens;
            erros = erros.concat(e.erros);
        }
        var ast;
        try {
            ast = this.syntax(tokens);
        } catch (e){
            ast = e.ast;
            erros = erros.concat(e.erros);
        }
        var opcodes;
        try {
            opcodes = this.semantic(ast, true);
        }catch (e){
            erros = erros.concat(e.erros);
        }
        window["tokens"] = tokens;
        window["ast"] = ast;
        if (erros.length > 0){
            throw erros;
        } else {
            return String.fromCharCode.apply(undefined,opcodes);
        }
    };

var _compiler = new compiler();
return _compiler;

});
