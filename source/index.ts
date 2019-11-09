import { InputController, KeyMappings } from "./input_controller";
import { Nes } from "./nes";

declare var rivets, $, NoSleep,  toastr, compiler;

export class Rom {
    name: string = '';
    url: string = '';
}

//this is a good technique
//so i don't need to keep casting from window.app
var app: MyApp;

export class MyApp {
    inputController: InputController;
    rom_name: string = '';
    canvasSize: number = 400;
    lblStatus: string = '';
    mobileMode: boolean = false;
    platform: string = '';
    useragent: string = '';
    dblist: string[] = [];
    remapDefault = true;
    remapWait = false;
    romList: Rom[] = [];
    audioContext: AudioContext;
    nes: Nes;
    chkDebugChecked = false;
    chkSound = true;
    romdevMode = false;
    lblCompiler = '';
    smbMode = true;




    constructor() {

        try {
            this.platform = navigator.platform.toLocaleLowerCase();
            this.useragent = navigator.userAgent.toLocaleLowerCase();
        } catch (err) {
            console.log('could not detect platform');
        }
        document.getElementById('file-upload').addEventListener('change', this.uploadRom.bind(this));

        this.nes = new Nes();

        this.createDB();
        this.initRivets();
        this.detectMobile();
        this.calculateInitialHeight();
        this.setHeight();
        this.finishedLoading();




    }

    runUnitTests(): boolean {
        let testsPassed = true;
        let result = 0;

        //test0
        result = this.nes.memory.ram[0x400]
        console.log('test0 result: ' + result);
        if (result != 2) {
            console.log('test0 failed');
            testsPassed = false;
        }

        //test1
        result = this.nes.memory.ram[0x401]
        console.log('test1 result: ' + result);
        if (result != 0x20) {
            console.log('test1 failed');
            testsPassed = false;
        }

        //test2
        result = this.nes.memory.ram[0x402]
        console.log('test2 result: ' + result);
        if (result != 0x14) {
            console.log('test2 failed');
            testsPassed = false;
        }

        //test3
        result = this.nes.memory.ram[0x403]
        console.log('test3 result: ' + result);
        if (result != 14) {
            console.log('test3 failed');
            testsPassed = false;
        }

        //test4
        result = this.nes.memory.ram[0x404]
        console.log('test4 result: ' + result);
        if (result != 30) {
            console.log('test4 failed');
            testsPassed = false;
        }

        //test5
        result = this.nes.memory.ram[0x405]
        console.log('test5 result: ' + result);
        if (result != 0x12) {
            console.log('test5 failed');
            testsPassed = false;
        }

        //test 6
        result = this.nes.memory.ram[0x406]
        console.log('test6 result: ' + result);
        if (result != 0x30) {
            console.log('test6 failed');
            testsPassed = false;
        }

        //test 7
        result = this.nes.memory.ram[0x407]
        console.log('test7 result: ' + result);
        if (result != 0xE0) {
            console.log('test7 failed');
            testsPassed = false;
        }

        //test 8
        result = this.nes.memory.ram[0x408]
        console.log('test8 result: ' + result);
        if (result != 0x23) {
            console.log('test8 failed');
            testsPassed = false;
        }

        //test 9
        result = this.nes.memory.ram[0x409]
        console.log('test9 result: ' + result);
        if (result != 0x14) {
            console.log('test9 failed');
            testsPassed = false;
        }

        //test 10
        result = this.nes.memory.ram[0x40A]
        console.log('test10 result: ' + result);
        if (result != 0x15) {
            console.log('test10 failed');
            testsPassed = false;
        }

        //test 11
        result = this.nes.memory.ram[0x40B]
        console.log('test11 result: ' + result);
        if (result != 0x0D) {
            console.log('test11 failed');
            testsPassed = false;
        }

        //test 12
        result = this.nes.memory.ram[0x40C]
        console.log('test12 result: ' + result);
        if (result != 0x14) {
            console.log('test12 failed');
            testsPassed = false;
        }

        //test 13
        result = this.nes.memory.ram[0x40D]
        console.log('test13 result: ' + result);
        if (result != 0x40) {
            console.log('test13 failed');
            testsPassed = false;
        }

        //test 14
        result = this.nes.memory.ram[0x40E]
        console.log('test14 result: ' + result);
        if (result != 3) {
            console.log('test14 failed');
            testsPassed = false;
        }

        //test 15
        result = this.nes.memory.ram[0x40F]
        console.log('test15 result: ' + result);
        if (result != 0x15) {
            console.log('test15 failed');
            testsPassed = false;
        }

        //test 16
        result = this.nes.memory.ram[0x410]
        console.log('test16 result: ' + result);
        if (result != 0x40) {
            console.log('test16 failed');
            testsPassed = false;
        }

        //test 17
        result = this.nes.memory.ram[0x411]
        console.log('test17 result: ' + result);
        if (result != 4) {
            console.log('test17 failed');
            testsPassed = false;
        }

        //test 18
        result = this.nes.memory.ram[0x412]
        console.log('test18 result: ' + result);
        if (result != 0x1B) {
            console.log('test18 failed');
            testsPassed = false;
        }

        //test 19
        result = this.nes.memory.ram[0x413]
        console.log('test19 result: ' + result);
        if (result != 9) {
            console.log('test19 failed');
            testsPassed = false;
        }

        //test 20
        result = this.nes.memory.ram[0x414]
        console.log('test20 result: ' + result);
        if (result != 0x80) {
            console.log('test20 failed');
            testsPassed = false;
        }

        //test 21
        result = this.nes.memory.ram[0x415]
        console.log('test21 result: ' + result);
        if (result != 0x80) {
            console.log('test21 failed');
            testsPassed = false;
        }

        //test 22
        result = this.nes.memory.ram[0x416]
        console.log('test22 result: ' + result);
        if (result != 0x40) {
            console.log('test22 failed');
            testsPassed = false;
        }

        //test 23
        result = this.nes.memory.ram[0x417]
        console.log('test23 result: ' + result);
        if (result != 0x40) {
            console.log('test23 failed');
            testsPassed = false;
        }

        //test 24
        result = this.nes.memory.ram[0x418]
        console.log('test24 result: ' + result);
        if (result != 0x2C) {
            console.log('test24 failed');
            testsPassed = false;
        }

        //test 25
        result = this.nes.memory.ram[0x419]
        console.log('test25 result: ' + result);
        if (result != 0x12) {
            console.log('test25 failed');
            testsPassed = false;
        }

        //test 26
        result = this.nes.memory.ram[0x41A]
        console.log('test26 result: ' + result);
        if (result != 0x12) {
            console.log('test26 failed');
            testsPassed = false;
        }

        //test 27
        result = this.nes.memory.ram[0x41B]
        console.log('test27 result: ' + result);
        if (result != 17) {
            console.log('test27 failed');
            testsPassed = false;
        }

        //test 28
        result = this.nes.memory.ram[0x41C]
        console.log('test28 result: ' + result);
        if (result != 2) {
            console.log('test28 failed');
            testsPassed = false;
        }

        //test 29
        result = this.nes.memory.ram[0x41D]
        console.log('test29 result: ' + result);
        if (result != 0x40) {
            console.log('test29 failed');
            testsPassed = false;
        }

        //test 30
        result = this.nes.memory.ram[0x41E]
        console.log('test30 result: ' + result);
        if (result != 0x7) {
            console.log('test30 failed');
            testsPassed = false;
        }


        return testsPassed;

    }


    saveASM() {
        localStorage.setItem('nes-compiler-asm', window["myEditor"].getValue());
        toastr.success("ASM Saved");
    }

    clearASM() {
        localStorage.removeItem('nes-compiler-asm');
        // toastr.success("ASM Cleared");
        this.newRom();
    }



    initialLoad() {
        this.configEmulator();
        this.rom_name = 'app.nes';

        this.logApp();

        //try to load from localStorage
        if (this.smbMode){
            $.get('source/disassembly.asm', (data) => {
                window["myEditor"].setValue(data);
                this.compile();
            })
        }else{
            $.get('source/myasm.asm', (data) => {
                window["myEditor"].setValue(data);
                this.compile();
            })
        }


    }



    myasmSRC(){
        $.get('source/myasm.asm', (data) => {
            window["myEditor"].setValue(data);
            this.compile();
        })
    }

    marioSRC(){
        $.get('source/disassembly.asm', (data) => {
            window["myEditor"].setValue(data);
            this.compile();
        })
    }

    nesLoaded: boolean = false;

    compile() {
        try {
            let compiled_data = '';

            let asm_code = window["myEditor"].getValue();
            compiled_data = compiler.nes_compiler(asm_code);
            

            if (this.nesLoaded == false) {
                app.nes_load_upload('canvas', compiled_data);
                this.nesLoaded = true;
            }
            else {
                //compile was successful
                app.nes.reload_rom_data = compiled_data;
                app.nes.reloadState();

                if (this.nes.PAUSED) {
                    if (this.chkSound)
                        this.nes.apu.unMuteAll();
                    this.nes.PAUSED = false;
                }
                if (this.mobileMode)
                    this.btnHideMenu();
            }
            app.lblCompiler = '';
            $("#lblCompiler").hide();
        }
        catch (error) {
            //TODO show number of errors
            console.log('an error');
            var errorString = '';
            error.forEach(err => {

                try {
                    if (err.children == null) {
                        var lineNumber = err.line;
                        errorString += '<b>Line: ' + lineNumber + ' - </b> ' + JSON.stringify(err) + '<br>';
                    } else {
                        var lineNumber = err.children[0].line;
                        errorString += '<b>Line: ' + lineNumber + ' - </b> ' + JSON.stringify(err) + '<br>';
                    }
                } catch (error2) {
                    errorString += '<b>No Line Number - </b> ' + JSON.stringify(err) + '<br>';
                }

            });
            errorString += '<br><b>' + error.length + ' ERROR';
            if (error.length > 1)
                errorString += 'S';
            errorString += '</b>'
            app.lblCompiler = errorString;
            $("#lblCompiler").show();
            this.nes.PAUSED = true;
        }
    }

    //put compile function into it's own function



    min_height: number = 400;
    height: number = 0;
    calculateInitialHeight() {


        this.height = window.innerHeight - 300;
        if (this.height < this.min_height)
            this.height = this.min_height;

    }

    setHeight() {
        document.getElementById('monContainer').style['min-height'] = this.height + 'px';
        document.getElementById('monContainer').style['max-height'] = this.height + 'px';
    }

    initRivets() {
        //init rivets
        rivets.formatters.ev = function (value, arg) {
            // console.log('eval: ' + value + arg);
            return eval(value + arg);
        }
        rivets.formatters.ev_string = function (value, arg) {
            let eval_string = "'" + value + "'" + arg;
            // console.log('eval: ' + eval_string);
            return eval(eval_string);
        }
        rivets.bind(document.getElementsByTagName('body')[0], { data: this });
    }


    saveState() {
        app.nes.saveState();
        if (this.mobileMode)
            this.btnHideMenu();
    }

    loadState() {
        app.nes.loadState();
        if (this.mobileMode)
            this.btnHideMenu();
    }




    finishedLoading() {
        $('#loadingDiv').hide();
        $('#btnLoadRom').prop("disabled", false);
        $('#btnUploadRom').prop("disabled", false);
        $('#btnLoadDB').prop("disabled", false);
    }


    //needs to be called after
    //user input or button click
    getAudioContext() {
        try {
            this.audioContext = new AudioContext();

        } catch (error) {
            try {
                //try for mobile
                this.audioContext = new window['webkitAudioContext']();
                (this.audioContext as AudioContext).resume();
                console.log('found mobile audio');

                //disable phone locking on mobile devices
                // app.lblStatus = 'No Sleep Enabled';

            } catch (error2) {
                console.log('could not initialize audio');
            }
        }

        if (this.mobileMode) {
            var noSleep = new NoSleep();
            noSleep.enable();
        }

        // if (this.chkSound) {
            this.enableSound();
        // }

    }

    enableSound() {
        this.nes.apu.unMuteAll();
        this.nes.apu.initialize(this.audioContext);
    }

    detectMobile() {
        if (window.innerWidth < 600 || this.useragent.includes('iphone') ||
            this.useragent.includes('ipad') || this.useragent.includes('android')) {
            this.mobileMode = true;
        }

        //on second thought if it's a big
        //screen then don't do mobile mode
        if (window.innerWidth > 600)
            this.mobileMode = false;

        if (this.mobileMode){
            $("#cardDiv").width("18rem");
        }

    }

    configEmulator() {
        this.getAudioContext();

        if (this.chkDebugChecked)
            this.mobileMode = false;

    }



    uploadBrowse() {
        document.getElementById('file-upload').click();
    }

    configureEditor(){
        
        $('#divMonOuter').show();
        $('#hideAfterLoad').hide();
        // $('#githubLink2').show();
        

        require(["compiler/compiler"],function(){


            window["myApp"].nes.PAUSED = false;

            if (window["myApp"].mobileMode)
            {
                document.getElementById('divMonOuter').classList.replace("col-sm-8","col-sm-12")
            }
            

            require(['vs/editor/editor.main'], function (monaco) {

                var options:any = {};
                options.value = "Loading...";
                options.language = 'scheme';
                options.theme = 'vs-light';
                options.automaticLayout = true;
                options.mouseWheelZoom = true;
                window["myEditor"] = monaco.editor.create(document.getElementById('monContainer'), options);
                window["myEditor"].addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, function(){
                    window["myApp"].compile();
                });
    
                window["myEditor"].addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_P, function(){
                    window["myApp"].btnPause();
                });
                window["myApp"].initialLoad();
    
            });
            
    
        });
    }

    useTestRom(){
        this.smbMode = false;
        app.configureEditor();
    }

    fileSize = 0;

    uploadRom(event: Event) {
        this.lblStatus = 'Uploading...';

        var file = (event.currentTarget as any).files[0] as File;
        console.log(file);
        this.rom_name = file.name;
        var reader = new FileReader();
        reader.onprogress = function (e) {
            console.log('loaded: ' + e.loaded);
        };
        reader.onload = function (e) {
            console.log('finished loading');

            app.lblStatus = '';
            app.nes.cartridge.loadChr(this.result as string);
            app.smbMode = true;
            app.fileSize = (this.result as string).length;
            app.configureEditor();
            // app.nes_load_upload('canvas', this.result);

            // let romString = this.result as string;
            // var ia = new TextEncoder().encode(romString);
            // app.saveToDatabase(ia);

        };
        // reader.readAsArrayBuffer(file);
        reader.readAsBinaryString(file)
    }

    saveToDatabase(data: Uint8Array) {

        if (!window["indexedDB"] == undefined) {
            console.log('indexedDB not available');
            return;
        }

        console.log('save to database called: ', data.length);

        var request = indexedDB.open('NeilNESDB');
        request.onsuccess = function (ev: any) {
            var db = ev.target.result as IDBDatabase;
            var romStore = db.transaction("NESROMS", "readwrite").objectStore("NESROMS");
            var addRequest = romStore.put(data, app.rom_name);
            addRequest.onsuccess = function (event) {
                console.log('data added');
            };
            addRequest.onerror = function (event) {
                console.log('error adding data');
                console.log(event);
            };
        }
    }

    clearDatabase() {

        var request = indexedDB.deleteDatabase('NeilNESDB');
        request.onerror = function (event) {
            console.log("Error deleting database.");
            app.lblStatus = "Error deleting database.";
        };

        request.onsuccess = function (event) {
            console.log("Database deleted successfully");
            app.lblStatus = "Database deleted successfully";
            app.newRom();
        };


    }

    newRom() {
        window.location.reload();
    }

    showCanvasAndInput() {


        //hide controls no longer needed
        $('#showAfterLoad').show();

        //height of most games
        // this.canvas.height=224;

        if (this.mobileMode) {
            $("#mobileDiv").show();
            $('#canvas').width(window.innerWidth);
            $('#canvas').appendTo("#mobileCanvas");
            if (this.nes.DEBUGMODE)
                $('#debugpanel').appendTo("#mobileCanvas");
            $("#mainCard").hide();
            $("#mainContainer").hide();
            $("#btnFullScreen").hide();
            $("#btnRemap").hide();
            // $("#divZoom").hide();
            $("#btnHidePanel").show();
            $("#btnTurboButtons").show();

            let halfWidth = (window.innerWidth / 2) - 35;
            document.getElementById("menuDiv").style.left = halfWidth + "px";
            this.inputController = new InputController('divTouchSurface');




            // if (this.nes.DEBUGMODE == false) {
            //     document.getElementById('canvas').addEventListener('touchstart', function (e) { e.preventDefault(); }, false);
            //     document.getElementById('canvas').addEventListener('touchend', function (e) { e.preventDefault(); }, false);
            //     document.getElementById('canvas').addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
            // }

        }
        else {
            this.inputController = new InputController('canvas');
            let size = localStorage.getItem('nes-size');
            if (size) {
                console.log('size found');
                let sizeNum = parseInt(size);
                this.canvasSize = sizeNum;
            }
            this.resizeCanvas();
        }

        //try to load keymappings from localstorage
        try {
            let keymappings = localStorage.getItem('nes_mappings');
            if (keymappings) {
                let keymappings_object = JSON.parse(keymappings);

                //check that it's not the old mappings file
                if (keymappings_object.Joy_Mapping_Action_Start)
                    keymappings = keymappings_object;
            }
        } catch (error) { }

        this.inputController.setupGamePad();
        this.inputController.loop();

        this.nes.inputController = this.inputController;

        $('#mainCard').css("visibility", "visible");
    }

    logApp(){
        if (document.location.href.toLocaleLowerCase().indexOf('neilb.net')>1)
        {
            let referrer = document.referrer;
            if(referrer==null || referrer=="")
                referrer = "NONE";
            let mode = 'smb';
            if (this.smbMode==false)
                mode = 'myasm';
            let stats = 'Filesize: ' + this.fileSize;
            $.get('https://neilb.net/tetrisjsbackend/api/compiler/addmariocompiler?mode=' + mode + '&stats=' + stats + '&referrer=' + referrer);   
        }
    }

    frameLimiter() {
        if (this.nes.fps_controller.frame_limiter_enabled)
            this.nes.fps_controller.frame_limiter_enabled = false;
        else
            this.nes.fps_controller.frame_limiter_enabled = true;
    }


    canvasDebugSize = 400;

    canvasDebugClick() {
        if (this.canvasDebugSize == 400)
            this.canvasDebugSize = 600;
        else
            this.canvasDebugSize = 400;

        $('#canvasDebug').width(this.canvasDebugSize);
    }

    btnTurboButtons() {
        if (this.nes.inputController.TurboButtons)
            this.nes.inputController.TurboButtons = false;
        else
            this.nes.inputController.TurboButtons = true;

        this.btnHideMenu();
    }

    btnMemPrev() {
        this.nes.debugMemPage -= 256;
    }

    btnMemNext() {
        this.nes.debugMemPage += 256;
    }

    btnPause() {
        if (this.nes.PAUSED) {
            if (this.chkSound)
                this.nes.apu.unMuteAll();
            this.nes.PAUSED = false;
        }
        else {
            if (this.chkSound)
                this.nes.apu.muteAll();
            this.nes.PAUSED = true;
        }
    }


    fullScreen() {
        // if (this.nes.DEBUGMODE)
        //     this.nes.canvasDebug.requestFullscreen();
        // else
        this.nes.canvas.requestFullscreen();
    }

    resizeCanvas() {
        console.log('canvas resized');
        $('#canvas').width(this.canvasSize);
        // $('#canvasDebug').width(this.canvasSize);
    }

    btnHideMenu() {
        $('#mainContainer').hide();
        $('#menuDiv').show();
    }

    zoomOut() {

        this.canvasSize -= 50;
        localStorage.setItem('nes-size', this.canvasSize.toString());
        this.resizeCanvas();
    }

    zoomIn() {
        this.canvasSize += 50;
        localStorage.setItem('nes-size', this.canvasSize.toString());
        this.resizeCanvas();
    }

    pressStart() {
        app.nes.inputController.Key_Action_Start = true;
        setTimeout(() => {
            app.nes.inputController.Key_Action_Start = false;
        }, 300);
    }

    square1Enable() {
        if (this.nes.apu.square1.enabled)
            this.nes.apu.square1.disable();
        else
            this.nes.apu.square1.enable();
    }

    square2Enable() {
        if (this.nes.apu.square2.enabled)
            this.nes.apu.square2.disable();
        else
            this.nes.apu.square2.enable();
    }

    triangleEnable() {
        if (this.nes.apu.triangle.enabled)
            this.nes.apu.triangle.disable();
        else
            this.nes.apu.triangle.enable();
    }

    noiseEnable() {
        if (this.nes.apu.noise.enabled)
            this.nes.apu.noise.disable();
        else
            this.nes.apu.noise.enable();
    }

    soundStats() {
        if (this.nes.debugSoundMode)
            this.nes.debugSoundMode = false;
        else
            this.nes.debugSoundMode = true;
    }

    recMusic() {
        if (this.nes.recordMusicMode == false)
            this.nes.startRecordingMusic();
        else
            this.nes.stopRecordingMusic();
    }

    stopRec() {
        this.nes.stopRecordingMusic();
    }

    playRec() {
        if (this.nes.playBackMusicMode == false)
            this.nes.playRecordedMusic();
        else
            this.nes.stopPlaybackMusic();
    }


    createDB() {

        if (window["indexedDB"] == undefined) {
            console.log('indexedDB not available');
            return;
        }

        var request = indexedDB.open('NeilNESDB');
        request.onupgradeneeded = function (ev: any) {
            console.log('upgrade needed');
            let db = ev.target.result as IDBDatabase;
            let objectStore = db.createObjectStore('NESROMS', { autoIncrement: true });
            objectStore.transaction.oncomplete = function (event) {
                console.log('db created');
            };
        }

        request.onsuccess = function (ev: any) {
            var db = ev.target.result as IDBDatabase;
            var romStore = db.transaction("NESROMS", "readwrite").objectStore("NESROMS");
            try {
                //rewrote using cursor instead of getAllKeys
                //for compatibility with MS EDGE
                romStore.openCursor().onsuccess = function (ev: any) {
                    var cursor = ev.target.result as IDBCursor;
                    if (cursor) {
                        let rom = cursor.key.toString();
                        if (!rom.endsWith('sav'))
                            app.dblist.push(rom);
                        cursor.continue();
                    }
                    else {
                        if (app.dblist.length > 0) {
                            // let romselect = document.getElementById('dbselect') as HTMLSelectElement;
                            // romselect.selectedIndex = 0;
                            // $('#dbContainer').show();
                            // $('#btnLoadDB').show();
                        }
                    }
                }

            } catch (error) {
                console.log('error reading keys');
                console.log(error);
            }

        }

    }

    btnDebugViewChr() {
        this.nes.SCREEN_DEBUG.clearScreen();
        this.nes.debug_view_chr = true;
        this.nes.debug_view_nametable = false;
    }

    btnDebugViewNametable() {
        this.nes.SCREEN_DEBUG.clearScreen();
        this.nes.debug_view_chr = false;
        this.nes.debug_view_nametable = true;
    }

    btnSwapNametable() {
        if (this.nes.debugNametable == 0)
            this.nes.debugNametable = 1;
        else
            this.nes.debugNametable = 0;
    }

    btnDisableSprites() {
        if (this.nes.debugDisableSprites)
            this.nes.debugDisableSprites = false;
        else
            this.nes.debugDisableSprites = true;
    }


    remappings: KeyMappings;
    remapMode = '';
    currKey: number;
    currJoy: number;
    chkUseJoypad = false;

    showRemapModal() {
        if (this.inputController.Gamepad_Process_Axis)
            // (document.getElementById('chkUseJoypad') as any).checked = true;
            this.chkUseJoypad = true;
        this.remappings = JSON.parse(JSON.stringify(this.inputController.KeyMappings));
        this.remapDefault = true;
        this.remapWait = false;
        $("#buttonsModal").modal();
    }

    saveRemap() {
        // if ((document.getElementById('chkUseJoypad') as any).checked)
        if (this.chkUseJoypad)
            this.inputController.Gamepad_Process_Axis = true;
        else
            this.inputController.Gamepad_Process_Axis = false;

        this.inputController.KeyMappings = JSON.parse(JSON.stringify(this.remappings));
        this.inputController.setGamePadButtons();
        localStorage.setItem('nes_mappings', JSON.stringify(this.remappings));
        $("#buttonsModal").modal('hide');
    }

    btnRemapKey(keynum: number) {
        this.currKey = keynum;
        this.remapMode = 'Key';
        this.readyRemap();
    }

    btnRemapJoy(joynum: number) {
        this.currJoy = joynum;
        this.remapMode = 'Button';
        this.readyRemap();
    }

    readyRemap() {
        this.remapDefault = false;
        this.remapWait = true;
        this.inputController.Key_Last = '';
        this.inputController.Joy_Last = null;
        this.inputController.Remap_Check = true;
    }

    remapPressed() {
        if (this.remapMode == 'Key') {
            var keyLast = this.inputController.Key_Last;
            if (this.currKey == 1) this.remappings.Mapping_Up = keyLast;
            if (this.currKey == 2) this.remappings.Mapping_Down = keyLast;
            if (this.currKey == 3) this.remappings.Mapping_Left = keyLast;
            if (this.currKey == 4) this.remappings.Mapping_Right = keyLast;
            if (this.currKey == 5) this.remappings.Mapping_Action_A = keyLast;
            if (this.currKey == 6) this.remappings.Mapping_Action_B = keyLast;
            if (this.currKey == 8) this.remappings.Mapping_Action_Start = keyLast;
            if (this.currKey == 7) this.remappings.Mapping_Action_Select = keyLast;
        }
        if (this.remapMode == 'Button') {
            var joyLast = this.inputController.Joy_Last;
            if (this.currJoy == 1) this.remappings.Joy_Mapping_Up = joyLast;
            if (this.currJoy == 2) this.remappings.Joy_Mapping_Down = joyLast;
            if (this.currJoy == 3) this.remappings.Joy_Mapping_Left = joyLast;
            if (this.currJoy == 4) this.remappings.Joy_Mapping_Right = joyLast;
            if (this.currJoy == 5) this.remappings.Joy_Mapping_Action_A = joyLast;
            if (this.currJoy == 6) this.remappings.Joy_Mapping_Action_B = joyLast;
            if (this.currJoy == 8) this.remappings.Joy_Mapping_Action_Start = joyLast;
            if (this.currJoy == 7) this.remappings.Joy_Mapping_Action_Select = joyLast;
        }
        this.remapDefault = true;
        this.remapWait = false;
    }

    nes_init() {

        if (this.chkDebugChecked)
            app.nes.DEBUGMODE = true;
        else
            app.nes.DEBUGMODE = false;
        app.nes.initCanvases();

    }


    onAnimationFrame() {

        window.requestAnimationFrame(app.onAnimationFrame);

        //run a single frame
        app.nes.frame();

    }

    nes_boot(rom_data) {

        app.showCanvasAndInput();
        app.nes.loadROM(rom_data, this.rom_name);



        window.requestAnimationFrame(app.onAnimationFrame);
    }

    nes_load_upload(canvas_id, rom_data) {
        app.nes_init();
        app.nes_boot(rom_data);
    }

    nes_load_url(canvas_id, path) {
        app.nes_init();
        console.log('loading ' + path);
        var req = new XMLHttpRequest();
        req.open("GET", path);
        req.overrideMimeType("text/plain; charset=x-user-defined");
        req.onerror = () => console.log(`Error loading ${path}: ${req.statusText}`);

        req.onload = function () {
            if (this.status === 200) {
                app.nes_boot(this.responseText);
            } else if (this.status === 0) {
                // Aborted, so ignore error
            } else {
                // req.onerror();
                // console.log('error');
            }
        };

        req.send();
    }

}




app = new MyApp();

window["myApp"] = app;

