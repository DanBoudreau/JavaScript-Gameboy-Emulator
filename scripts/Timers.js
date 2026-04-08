TIMER = {
    _clock: {
        main: 0,
        sub: 0,
        div: 0,
    },

    _reg: {
        div: 0,
        tima: 0,
        tma: 0,
        tac: 0,
    },

    reset: function() {
        TIMER._clock.main = 0;
        TIMER._clock.sub = 0;
        TIMER._clock.div = 0;
        TIMER._reg.div = 0;
        TIMER._reg.tima = 0;
        TIMER._reg.tma = 0;
        TIMER._reg.tac = 0;
    },

    inc: function() {
        // Increment by the last opcode's time
        TIMER._clock.sub += Z80._stepM || Z80._reg.m;

        //no opcodes are longer than 4 M-times, only need to check for overflow once
        if (TIMER._clock.sub >= 4) {
            TIMER._clock.main++;
            TIMER._clock.sub -= 4;

            //div register increments at 16th the speed of the main clock
            TIMER._clock.div++;
            if (TIMER._clock.div == 16) {
                TIMER._reg.div = (TIMER._reg.div + 1) & 255;
                TIMER._clock.div = 0;
            }
        }
        //check whether a step neds to be made in the timer
        TIMER.check();
    },

    check: function() {
        if ((TIMER._reg.tac & 4)) {
            var threshold;
            switch (TIMER._reg.tac & 3) {
                case 0: threshold = 64; break; // 4K
                case 1: threshold = 1; break;  // 256K
                case 2: threshold = 4; break;  // 64K
                case 3: threshold = 16; break; // 16K
            }

            if (TIMER._clock.main >= threshold) {
                TIMER.step();
            }
        }
    },

    step: function() {
        // step the timer up by one
        TIMER._clock.main = 0;
        TIMER._reg.tima++;

        // check for overflow
        if (TIMER._reg.tima > 255) {
            //if overflow, refill with modulo and request interrupt
            TIMER._reg.tima = TIMER._reg.tma;

            // flag a timer interrup to the dispatcher
            MMU._if |= 4;
        }
    },

    rb: function(addr)
    {
	    switch(addr)
	    {
	        case 0xFF04: return TIMER._reg.div;
	        case 0xFF05: return TIMER._reg.tima;
    	    case 0xFF06: return TIMER._reg.tma;
	        case 0xFF07: return TIMER._reg.tac;
	    }
    },

    wb: function(addr, val)
    {
	    switch(addr)
    	{
	        case 0xFF04: TIMER._reg.div = 0; break;
	        case 0xFF05: TIMER._reg.tima = val; break;
    	    case 0xFF06: TIMER._reg.tma = val; break;
	        case 0xFF07: TIMER._reg.tac = val & 7; break;
	    }
    }
}