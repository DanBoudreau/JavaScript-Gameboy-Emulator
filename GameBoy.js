GameBoy = {
    reset: function(){
        GPU.reset();
        MMU.reset();
        Z80.reset();

        MMU.load('test.gb');
    },

    frame: function(){
        var fclk = Z80._clock.t + 70224;
        do{
            Z80._map[MMU.rb(Z80._r.pc++)]();
            Z80._r.pc &= 65535;
            Z80._clock.m += Z80._r.m;
            Z80._clock.t += Z80._r.t;
            GPU.step();
        }
        while(Z80._clock.t < fclk);
    },
    
    _interval: null,

    run: function(){
        if(!GameBoy._interval){
            GameBoy._interval = setTimeout(GameBoy.frame, 1);
            document.getElementById('run').innerHTML = 'Pause';
        }
        else{
            clearInterval(GameBoy._interval)
            GameBoy._interval = null;
            document.getElementById('run').innerHTML = 'Run';

        }
    }
};

window.onload = function(){
    this.document.getElementById('reset').onclick = GameBoy.reset;
    this.document.getElementById('run').onclick = GameBoy.run;
    GameBoy.reset();
};