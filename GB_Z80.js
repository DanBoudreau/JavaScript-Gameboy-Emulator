Z80 = {

    // internal state sets
    // Time clock types
    _clock: {m:0, t:0},

    // register set
    _reg: {
            a:0, b:0, c:0, d:0, e:0, h:0, l:0, f:0,         // 8-bit registers
            pc:0, sp:0,                                     // 16-bit registers
            m:0, T:0                                        // clock for last instruction

    },

    // Reset routine for CPU, sets all registers to 0
    reset: function() {
            Z80._r.a = 0; Z80._r.b = 0; Z80._r.c = 0; Z80._r.d = 0;
            Z80._r.e = 0; Z80._r.h = 0; Z80._r.l = 0; Z80._r.f = 0;
            Z80._r.sp = 0;
            Z80._r.pc = 0;                                      // Start execution at 0

            Z80._clock.m = 0; Z80._clock.t = 0;
    },


    /*
     * Flags(F) for GameBoy Z80 CPU 
     * Zero         (0x80)
     * Operation    (0x40)
     * Half-carry   (0x20)
     * Carry        (0x10)
     */

    _ops: {

        // Add A to A, leaves result in A (ADD A, A)
        ADDr_a: function() {
            Z80._reg.a += Z80._reg.a;                           // perform addition
            Z80._reg.f = 0;                                     // clear flags
            if(!(Z80._reg.a & 255)) Z80._reg.f |= 0x80;         // check for zero
            if(Z80._reg.a > 255) Z80._reg.f |= 0x10;            // check for carry
            Z80._reg.a &= 255;                                  // mask to 8-bits
            Z80._reg.m = 1;  Z80._reg.t = 4;                    // 1 M - time taken

        },

        // Add B to A, leaves result in A (ADD A, B)
        ADDr_b: function() {
            Z80._reg.a += Z80._reg.b;                           // perform addition
            Z80._reg.f = 0;                                     // clear flags
            if(!(Z80._reg.a & 255)) Z80._reg.f |= 0x80;         // check for zero
            if(Z80._reg.a > 255) Z80._reg.f |= 0x10;            // check for carry
            Z80._reg.a &= 255;                                  // mask to 8-bits
            Z80._reg.m = 1;  Z80._reg.t = 4;                    // 1 M - time taken

        },

        // Add C to A, leaves result in A (ADD A, C)
        ADDr_c: function() {
            Z80._reg.a += Z80._reg.c;                           // perform addition
            Z80._reg.f = 0;                                     // clear flags
            if(!(Z80._reg.a & 255)) Z80._reg.f |= 0x80;         // check for zero
            if(Z80._reg.a > 255) Z80._reg.f |= 0x10;            // check for carry
            Z80._reg.a &= 255;                                  // mask to 8-bits
            Z80._reg.m = 1;  Z80._reg.t = 4;                    // 1 M - time taken

        },

        // Add D to A, leaves result in A (ADD A, D)
        ADDr_d: function() {
            Z80._reg.a += Z80._reg.d;                           // perform addition
            Z80._reg.f = 0;                                     // clear flags
            if(!(Z80._reg.a & 255)) Z80._reg.f |= 0x80;         // check for zero
            if(Z80._reg.a > 255) Z80._reg.f |= 0x10;            // check for carry
            Z80._reg.a &= 255;                                  // mask to 8-bits
            Z80._reg.m = 1;  Z80._reg.t = 4;                    // 1 M - time taken

        },

        // Add E to A, leaves result in A (ADD A, E)
        ADDr_e: function() {
            Z80._reg.a += Z80._reg.e;                           // perform addition
            Z80._reg.f = 0;                                     // clear flags
            if(!(Z80._reg.a & 255)) Z80._reg.f |= 0x80;         // check for zero
            if(Z80._reg.a > 255) Z80._reg.f |= 0x10;            // check for carry
            Z80._reg.a &= 255;                                  // mask to 8-bits
            Z80._reg.m = 1;  Z80._reg.t = 4;                    // 1 M - time taken

        },

        // Add H to A, leaves result in A (ADD A, H)
        ADDr_h: function() {
            Z80._reg.a += Z80._reg.h;                           // perform addition
            Z80._reg.f = 0;                                     // clear flags
            if(!(Z80._reg.a & 255)) Z80._reg.f |= 0x80;         // check for zero
            if(Z80._reg.a > 255) Z80._reg.f |= 0x10;            // check for carry
            Z80._reg.a &= 255;                                  // mask to 8-bits
            Z80._reg.m = 1;  Z80._reg.t = 4;                    // 1 M - time taken

        },

        // Add L to A, leaves result in A (ADD A, L)
        ADDr_l: function() {
            Z80._reg.a += Z80._reg.l;                           // perform addition
            Z80._reg.f = 0;                                     // clear flags
            if(!(Z80._reg.a & 255)) Z80._reg.f |= 0x80;         // check for zero
            if(Z80._reg.a > 255) Z80._reg.f |= 0x10;            // check for carry
            Z80._reg.a &= 255;                                  // mask to 8-bits
            Z80._reg.m = 1;  Z80._reg.t = 4;                    // 1 M - time taken

        },

        // Compare A to A, setting flags (CP A, A)
        CPr_a: function() {
            
            var i = Z80._reg.a;                                 // temporary copy of A
            i -= Z80._reg.a;                                    // subtract B
            Z80._reg.f |= 0x40;                                 // set subtraction flag
            if(!(i & 255)) Z80._reg.f |= 0x80;                  // check for zero
            if(i < 0) Z80._reg.f |= 0x10;                       // check for underflow
            Z80._reg.m = 1; Z80._reg.t = 4;                     // 1 M - time taken

        },

        // Compare B to A, setting flags (CP A, B)
        CPr_b: function() {
            
            var i = Z80._reg.a;                                 // temporary copy of A
            i -= Z80._reg.b;                                    // subtract B
            Z80._reg.f |= 0x40;                                 // set subtraction flag
            if(!(i & 255)) Z80._reg.f |= 0x80;                  // check for zero
            if(i < 0) Z80._reg.f |= 0x10;                       // check for underflow
            Z80._reg.m = 1; Z80._reg.t = 4;                     // 1 M - time taken

        },

        // Compare C to A, setting flags (CP A, C)
        CPr_c: function() {
            
            var i = Z80._reg.a;                                 // temporary copy of A
            i -= Z80._reg.c;                                    // subtract C
            Z80._reg.f |= 0x40;                                 // set subtraction flag
            if(!(i & 255)) Z80._reg.f |= 0x80;                  // check for zero
            if(i < 0) Z80._reg.f |= 0x10;                       // check for underflow
            Z80._reg.m = 1; Z80._reg.t = 4;                     // 1 M - time taken

        },

        // Compare D to A, setting flags (CP A, D)
        CPr_d: function() {
            
            var i = Z80._reg.a;                                 // temporary copy of A
            i -= Z80._reg.d;                                    // subtract D
            Z80._reg.f |= 0x40;                                 // set subtraction flag
            if(!(i & 255)) Z80._reg.f |= 0x80;                  // check for zero
            if(i < 0) Z80._reg.f |= 0x10;                       // check for underflow
            Z80._reg.m = 1; Z80._reg.t = 4;                     // 1 M - time taken

        },

        // Compare E to A, setting flags (CP A, E)
        CPr_e: function() {
            
            var i = Z80._reg.a;                                 // temporary copy of A
            i -= Z80._reg.e;                                    // subtract E
            Z80._reg.f |= 0x40;                                 // set subtraction flag
            if(!(i & 255)) Z80._reg.f |= 0x80;                  // check for zero
            if(i < 0) Z80._reg.f |= 0x10;                       // check for underflow
            Z80._reg.m = 1; Z80._reg.t = 4;                     // 1 M - time taken

        },

        // Compare H to A, setting flags (CP A, H)
        CPr_h: function() {
            
            var i = Z80._reg.a;                                 // temporary copy of A
            i -= Z80._reg.h;                                    // subtract H
            Z80._reg.f |= 0x40;                                 // set subtraction flag
            if(!(i & 255)) Z80._reg.f |= 0x80;                  // check for zero
            if(i < 0) Z80._reg.f |= 0x10;                       // check for underflow
            Z80._reg.m = 1; Z80._reg.t = 4;                     // 1 M - time taken

        },

        // Compare L to A, setting flags (CP A, L)
        CPr_l: function() {
            
            var i = Z80._reg.a;                                 // temporary copy of A
            i -= Z80._reg.l;                                    // subtract L
            Z80._reg.f |= 0x40;                                 // set subtraction flag
            if(!(i & 255)) Z80._reg.f |= 0x80;                  // check for zero
            if(i < 0) Z80._reg.f |= 0x10;                       // check for underflow
            Z80._reg.m = 1; Z80._reg.t = 4;                     // 1 M - time taken

        },

        // No opperation
        NOP: function() {
            Z80._reg.m = 1;  Z80._reg.t = 4;                    // 1 M - time taken
        },


        // Push registers B and C to the stack
        PUSHBC: function() {
            Z80._reg.sp--;                                      // Drop through the stack
            MMU.wb(Z80._reg.sp, Z80._reg.b);                    // Write B
            Z80._reg.sp--;                                      // Drop through the stack
            MMU.wb(Z80._reg.sp, Z80._reg.c);                    // Write C
            Z80._reg.m = 3; Z80._reg.t = 12;                    // 3 M-times taken

        },

        //Pop registers H and L from the stack
        POPHL: function() {
            Z80._reg.l = MMU.rb(Z80._reg.sp);                   // Read L
            Z80._reg.sp++;                                      // Move back up the stack
            Z80._reg.l = MMU.rb(Z80._reg.sp);                   // Read H
            Z80._reg.sp++;                                      // Move back up the stack
            Z80._reg.m = 3; Z80._reg.t = 12;                    // 3 M-times taken

        },

        //Read a byte from absolute location into A
        LDAmm: function() {
            var addr = MMU.rw(Z80._reg.pc);                    // Get address from instruction
            Z80._reg.px += 2;                                  // Advance pc
            Z80._reg.a = MMU.rb(Addr);                         // Read from address
            Z80._reg.m = 4; Z80._reg.t = 16;                   // 4 M-times taken

        },

        
    },

    

};

// Dispatch loop
    while(true){
        var op = MMU.rb(Z80._reg.pc++);                     // Fetch instruction
        Z80._map[op]();                                     // Dispatch
        Z80._reg.pc &= 65535;                               // mask PC to 16 bits
        Z80._clock.m += Z80._reg.m;                         // Add time to CPU clock
        Z80._clock.t += Z80._reg.t;

        GPU.step();
    };