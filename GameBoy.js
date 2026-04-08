GameBoy = {
    bootstrap: function() {
        MMU._inbios = 0;
        Z80._reg.a = 0x01;
        Z80._reg.f = 0xB0;
        Z80._reg.b = 0x00;
        Z80._reg.c = 0x13;
        Z80._reg.d = 0x00;
        Z80._reg.e = 0xD8;
        Z80._reg.h = 0x01;
        Z80._reg.l = 0x4D;
        Z80._reg.sp = 0xFFFE;
        Z80._reg.pc = 0x0100;
        Z80._reg.ime = 0;

        MMU.wb(0xFF05, 0x00);
        MMU.wb(0xFF06, 0x00);
        MMU.wb(0xFF07, 0x00);
        MMU.wb(0xFF40, 0x91);
        MMU.wb(0xFF42, 0x00);
        MMU.wb(0xFF43, 0x00);
        MMU.wb(0xFF47, 0xFC);
        MMU.wb(0xFF48, 0xFF);
        MMU.wb(0xFF49, 0xFF);
        MMU._if = 0xE1;
        MMU._ie = 0x00;
    },

    reset: function(){
        console.log('GameBoy resetting...');
        GPU.reset();
        MMU.reset();
        Z80.reset();
        KEY.reset();
        if(typeof TIMER !== 'undefined' && TIMER && typeof TIMER.reset === 'function')
            TIMER.reset();
        
        // Skip BIOS and start directly at ROM entry point
        GameBoy.bootstrap();
        Z80._clock.m = 0;
        Z80._clock.t = 0;
        Z80._stepM = 0;
        Z80._stepT = 0;
        GameBoy._frameCount = 0;
        Z80._execCount = undefined;
        Z80._romStartLogged = false;
        console.log('Skipping BIOS, jumping to ROM entry at 0x0100');
        console.log('GameBoy reset complete');
    },

    frame: function(){
        if(!GameBoy._frameCount) GameBoy._frameCount = 0;
        var fclk = Z80._clock.t + 70224;
        do{
            Z80.exec();
            GPU.step();
        }
        while(Z80._clock.t < fclk);
        
        GameBoy._frameCount++;
    },
    
    _interval: null,

    run: function(){
        if(!GameBoy._interval){
            console.log('GameBoy.run() called, starting frame loop...');
            GameBoy._interval = setInterval(GameBoy.frame, 1);
            document.getElementById('run').innerHTML = 'Pause';
        }
        else{
            console.log('GameBoy.run() called, pausing...');
            clearInterval(GameBoy._interval);
            GameBoy._interval = null;
            document.getElementById('run').innerHTML = 'Run';

        }
    }
};

window.onload = function(){
    this.document.getElementById('reset').onclick = GameBoy.reset;
    this.document.getElementById('run').onclick = GameBoy.run;
    
    window.onkeydown = function(e) {
        KEY.keydown(e);
    };
    
    window.onkeyup = function(e) {
        KEY.keyup(e);
    };
    
    document.getElementById('romfile').onchange = function(e) {
        var file = e.target.files[0];
        if (file) {
            console.log('Loading ROM file: ' + file.name);
            var reader = new FileReader();
            reader.onload = function(e) {
                MMU._rom = e.target.result;
                MMU._carttype = MMU._rom.charCodeAt(0x0147);
                console.log('ROM loaded: ' + MMU._rom.length + ' bytes, cartridge type: 0x' + MMU._carttype.toString(16));
                GameBoy.reset();
                GameBoy.run();
                console.log('GameBoy started!');
            };
            reader.readAsBinaryString(file);
        }
    };
    
    GameBoy.reset();
};