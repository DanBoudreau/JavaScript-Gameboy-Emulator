Z80 = {

    // internal state sets
    // Time clock types
    _clock: {m:0, t:0},

    _halt: 0,
    _stop: 0,
    _map:[],
    _cbmap:[],
    _stepM: 0,
    _stepT: 0,
    _imePending: 0,

    // register set
    _reg: {
            a:0, b:0, c:0, d:0, e:0, h:0, l:0, f:0,         // 8-bit registers
            pc:0, sp:0,                                     // 16-bit registers
            m:0, t:0, r:0,                                   // clock and refresh register
            ime: 0,

    },

    // Reset routine for CPU, sets all registers to 0
    reset: function() {
            Z80._reg.a = 0; Z80._reg.b = 0; Z80._reg.c = 0; Z80._reg.d = 0;
            Z80._reg.e = 0; Z80._reg.h = 0; Z80._reg.l = 0; Z80._reg.f = 0;
            Z80._reg.sp = 0;
            Z80._reg.pc = 0;                                      // Start execution at 0
            Z80._reg.r = 0;
            Z80._reg.ime = 0;
            Z80._clock.m = 0; Z80._clock.t = 0;
            Z80._halt = 0;
            Z80._stop = 0;
                Z80._imePending = 0;
            Z80.build();
            
    },

    // disable IME
    DI: function() {
        Z80._reg.ime = 0;
        Z80._reg.m += 1;
        Z80._reg.t += 4;
    },

    // enable IME
    EI: function() {
        Z80._reg.ime = 1;
        Z80._reg.m += 1;
        Z80._reg.t += 4;
    },

    build: function() {
            for(var i = 0; i < 256; i++)
                    Z80._map[i] = null;

            Z80._map[0x00] = Z80._ops.NOP;
            Z80._map[0x04] = Z80._ops.INC_B;
            Z80._map[0x05] = Z80._ops.DEC_B;
            Z80._map[0x0C] = Z80._ops.INC_C;
            Z80._map[0x0D] = Z80._ops.DEC_C;
            Z80._map[0x14] = Z80._ops.INC_D;
            Z80._map[0x15] = Z80._ops.DEC_D;
            Z80._map[0x19] = Z80._ops.ADD_HL_DE;
            Z80._map[0x1C] = Z80._ops.INC_E;
            Z80._map[0x1D] = Z80._ops.DEC_E;
            Z80._map[0x24] = Z80._ops.INC_H;
            Z80._map[0x25] = Z80._ops.DEC_H;
            Z80._map[0x29] = Z80._ops.ADD_HL_HL;
            Z80._map[0x2C] = Z80._ops.INC_L;
            Z80._map[0x2D] = Z80._ops.DEC_L;
            Z80._map[0x09] = Z80._ops.ADD_HL_BC;
            Z80._map[0x39] = Z80._ops.ADD_HL_SP;
            Z80._map[0xC5] = Z80._ops.PUSHBC;
            Z80._map[0xD5] = Z80._ops.PUSHDE;
            Z80._map[0xE5] = Z80._ops.PUSHHL;
            Z80._map[0xF5] = Z80._ops.PUSHAF;
            Z80._map[0xC1] = Z80._ops.POPBC;
            Z80._map[0xD1] = Z80._ops.POPDE;
            Z80._map[0xE1] = Z80._ops.POPHL;
            Z80._map[0xF1] = Z80._ops.POPAF;
            Z80._map[0x87] = Z80._ops.ADDr_a;
            Z80._map[0x80] = Z80._ops.ADDr_b;
            Z80._map[0x81] = Z80._ops.ADDr_c;
            Z80._map[0x82] = Z80._ops.ADDr_d;
            Z80._map[0x83] = Z80._ops.ADDr_e;
            Z80._map[0x84] = Z80._ops.ADDr_h;
            Z80._map[0x85] = Z80._ops.ADDr_l;
            Z80._map[0x86] = Z80._ops.ADD_A_HLm;
            Z80._map[0x87] = Z80._ops.ADDr_a;
            Z80._map[0x90] = Z80._ops.SUB_A_B;
            Z80._map[0x91] = Z80._ops.SUB_A_C;
            Z80._map[0x92] = Z80._ops.SUB_A_D;
            Z80._map[0x93] = Z80._ops.SUB_A_E;
            Z80._map[0x94] = Z80._ops.SUB_A_H;
            Z80._map[0x95] = Z80._ops.SUB_A_L;
            Z80._map[0x96] = Z80._ops.SUB_A_HLm;
            Z80._map[0x97] = Z80._ops.SUB_A_A;
            Z80._map[0xBF] = Z80._ops.CPr_a;
            Z80._map[0xB8] = Z80._ops.CPr_b;
            Z80._map[0xB9] = Z80._ops.CPr_c;
            Z80._map[0xBA] = Z80._ops.CPr_d;
            Z80._map[0xBB] = Z80._ops.CPr_e;
            Z80._map[0xBC] = Z80._ops.CPr_h;
            Z80._map[0xBD] = Z80._ops.CPr_l;
            Z80._map[0x3E] = Z80._ops.LD_A_n;
            Z80._map[0x06] = Z80._ops.LD_B_n;
            Z80._map[0x07] = Z80._ops.RLCA;
            Z80._map[0x0E] = Z80._ops.LD_C_n;
            Z80._map[0x0F] = Z80._ops.RRCA;
            Z80._map[0x08] = Z80._ops.LD_a16_SP;
            Z80._map[0x16] = Z80._ops.LD_D_n;
            Z80._map[0x17] = Z80._ops.RLA;
            Z80._map[0x1E] = Z80._ops.LD_E_n;
            Z80._map[0x1F] = Z80._ops.RRA;
            Z80._map[0x26] = Z80._ops.LD_H_n;
            Z80._map[0x2E] = Z80._ops.LD_L_n;
            Z80._map[0x01] = Z80._ops.LD_BC_nn;
            Z80._map[0x11] = Z80._ops.LD_DE_nn;
            Z80._map[0x21] = Z80._ops.LD_HL_nn;
            Z80._map[0x31] = Z80._ops.LD_SP_nn;
            Z80._map[0x3C] = Z80._ops.INC_A;
            Z80._map[0x3D] = Z80._ops.DEC_A;
            Z80._map[0x77] = Z80._ops.LD_HLm_A;
            Z80._map[0x7E] = Z80._ops.LD_A_HLm;
            Z80._map[0x23] = Z80._ops.INC_HL;
            Z80._map[0x2B] = Z80._ops.DEC_HL;
            Z80._map[0xAF] = Z80._ops.XORa;
            Z80._map[0xC3] = Z80._ops.JP_a16;
            Z80._map[0x18] = Z80._ops.JR_r8;
            Z80._map[0x20] = Z80._ops.JR_NZ_r8;
            Z80._map[0x28] = Z80._ops.JR_Z_r8;
            Z80._map[0xFA] = Z80._ops.LDAmm;
            Z80._map[0xEA] = Z80._ops.LD_mma_A;
            Z80._map[0xC6] = Z80._ops.ADD_A_n;
            Z80._map[0xCE] = Z80._ops.ADC_A_n;
            Z80._map[0xD6] = Z80._ops.SUB_A_n;
            Z80._map[0xDE] = Z80._ops.SBC_A_n;
            Z80._map[0xE6] = Z80._ops.AND_A_n;
            Z80._map[0xEE] = Z80._ops.XOR_A_n;
            Z80._map[0xF6] = Z80._ops.OR_A_n;
            Z80._map[0xFE] = Z80._ops.CP_A_n;
            Z80._map[0x36] = Z80._ops.LD_HLm_n;
            Z80._map[0x46] = Z80._ops.LD_B_HLm;
            Z80._map[0x4E] = Z80._ops.LD_C_HLm;
            Z80._map[0x56] = Z80._ops.LD_D_HLm;
            Z80._map[0x5E] = Z80._ops.LD_E_HLm;
            Z80._map[0x66] = Z80._ops.LD_H_HLm;
            Z80._map[0x6E] = Z80._ops.LD_L_HLm;
            Z80._map[0x70] = Z80._ops.LD_HLm_B;
            Z80._map[0x71] = Z80._ops.LD_HLm_C;
            Z80._map[0x72] = Z80._ops.LD_HLm_D;
            Z80._map[0x73] = Z80._ops.LD_HLm_E;
            Z80._map[0x74] = Z80._ops.LD_HLm_H;
            Z80._map[0x75] = Z80._ops.LD_HLm_L;
            Z80._map[0x76] = Z80._ops.HALT;
            Z80._map[0xE0] = Z80._ops.LDH_a8_A;
            Z80._map[0xF0] = Z80._ops.LDH_A_a8;
            Z80._map[0xE2] = Z80._ops.LDH_C_A;
            Z80._map[0xF2] = Z80._ops.LDH_A_C;
            Z80._map[0x03] = Z80._ops.INC_BC;
            Z80._map[0x13] = Z80._ops.INC_DE;
            Z80._map[0x33] = Z80._ops.INC_SP;
            Z80._map[0x0B] = Z80._ops.DEC_BC;
            Z80._map[0x1B] = Z80._ops.DEC_DE;
            Z80._map[0x3B] = Z80._ops.DEC_SP;
            Z80._map[0x34] = Z80._ops.INC_HLm;
            Z80._map[0x35] = Z80._ops.DEC_HLm;
            Z80._map[0x88] = Z80._ops.ADC_A_B;
            Z80._map[0x89] = Z80._ops.ADC_A_C;
            Z80._map[0x8A] = Z80._ops.ADC_A_D;
            Z80._map[0x8B] = Z80._ops.ADC_A_E;
            Z80._map[0x8C] = Z80._ops.ADC_A_H;
            Z80._map[0x8D] = Z80._ops.ADC_A_L;
            Z80._map[0x8E] = Z80._ops.ADC_A_HLm;
            Z80._map[0x8F] = Z80._ops.ADC_A_A;
            Z80._map[0x98] = Z80._ops.SBC_A_B;
            Z80._map[0x99] = Z80._ops.SBC_A_C;
            Z80._map[0x9A] = Z80._ops.SBC_A_D;
            Z80._map[0x9B] = Z80._ops.SBC_A_E;
            Z80._map[0x9C] = Z80._ops.SBC_A_H;
            Z80._map[0x9D] = Z80._ops.SBC_A_L;
            Z80._map[0x9E] = Z80._ops.SBC_A_HLm;
            Z80._map[0x9F] = Z80._ops.SBC_A_A;
            Z80._map[0xA0] = Z80._ops.AND_A_B;
            Z80._map[0xA1] = Z80._ops.AND_A_C;
            Z80._map[0xA2] = Z80._ops.AND_A_D;
            Z80._map[0xA3] = Z80._ops.AND_A_E;
            Z80._map[0xA4] = Z80._ops.AND_A_H;
            Z80._map[0xA5] = Z80._ops.AND_A_L;
            Z80._map[0xA6] = Z80._ops.AND_A_HLm;
            Z80._map[0xA7] = Z80._ops.AND_A_A;
            Z80._map[0xA8] = Z80._ops.XOR_A_B;
            Z80._map[0xA9] = Z80._ops.XOR_A_C;
            Z80._map[0xAA] = Z80._ops.XOR_A_D;
            Z80._map[0xAB] = Z80._ops.XOR_A_E;
            Z80._map[0xAC] = Z80._ops.XOR_A_H;
            Z80._map[0xAD] = Z80._ops.XOR_A_L;
            Z80._map[0xAE] = Z80._ops.XOR_A_HLm;
            Z80._map[0xAF] = Z80._ops.XOR_A_A;
            Z80._map[0xB0] = Z80._ops.OR_A_B;
            Z80._map[0xB1] = Z80._ops.OR_A_C;
            Z80._map[0xB2] = Z80._ops.OR_A_D;
            Z80._map[0xB3] = Z80._ops.OR_A_E;
            Z80._map[0xB4] = Z80._ops.OR_A_H;
            Z80._map[0xB5] = Z80._ops.OR_A_L;
            Z80._map[0xB6] = Z80._ops.OR_A_HLm;
            Z80._map[0xB7] = Z80._ops.OR_A_A;
            Z80._map[0xBE] = Z80._ops.CP_A_HLm;
            Z80._map[0xE9] = Z80._ops.JP_HL;
            Z80._map[0xF9] = Z80._ops.LD_SP_HL;
            Z80._map[0xE8] = Z80._ops.ADD_SP_r8;
            Z80._map[0xF8] = Z80._ops.LD_HL_SP_r8;
            Z80._map[0xF3] = Z80._ops.DI;
            Z80._map[0xFB] = Z80._ops.EI;
            Z80._map[0x10] = Z80._ops.STOP;
            Z80._map[0x3F] = Z80._ops.CCF;
            Z80._map[0x37] = Z80._ops.SCF;
            Z80._map[0x2F] = Z80._ops.CPL;
            Z80._map[0x27] = Z80._ops.DAA;
            Z80._map[0xC7] = Z80._ops.RST_00;
            Z80._map[0xCF] = Z80._ops.RST_08;
            Z80._map[0xD7] = Z80._ops.RST_10;
            Z80._map[0xDF] = Z80._ops.RST_18;
            Z80._map[0xE7] = Z80._ops.RST_20;
            Z80._map[0xEF] = Z80._ops.RST_28;
            Z80._map[0xF7] = Z80._ops.RST_30;
            Z80._map[0xFF] = Z80._ops.RST_38;
            Z80._map[0xC0] = Z80._ops.RET_NZ;
            Z80._map[0xC8] = Z80._ops.RET_Z;
            Z80._map[0xD0] = Z80._ops.RET_NC;
            Z80._map[0xD8] = Z80._ops.RET_C;
            Z80._map[0xD9] = Z80._ops.RETI;
            Z80._map[0xC4] = Z80._ops.CALL_NZ;
            Z80._map[0xCC] = Z80._ops.CALL_Z;
            Z80._map[0xD4] = Z80._ops.CALL_NC;
            Z80._map[0xDC] = Z80._ops.CALL_C;
            
            // Register-to-register loads (0x40-0x7F)
            Z80._map[0x40] = Z80._ops.LD_B_B;
            Z80._map[0x41] = Z80._ops.LD_B_C;
            Z80._map[0x42] = Z80._ops.LD_B_D;
            Z80._map[0x43] = Z80._ops.LD_B_E;
            Z80._map[0x44] = Z80._ops.LD_B_H;
            Z80._map[0x45] = Z80._ops.LD_B_L;
            Z80._map[0x47] = Z80._ops.LD_B_A;
            Z80._map[0x48] = Z80._ops.LD_C_B;
            Z80._map[0x49] = Z80._ops.LD_C_C;
            Z80._map[0x4A] = Z80._ops.LD_C_D;
            Z80._map[0x4B] = Z80._ops.LD_C_E;
            Z80._map[0x4C] = Z80._ops.LD_C_H;
            Z80._map[0x4D] = Z80._ops.LD_C_L;
            Z80._map[0x4F] = Z80._ops.LD_C_A;
            Z80._map[0x50] = Z80._ops.LD_D_B;
            Z80._map[0x51] = Z80._ops.LD_D_C;
            Z80._map[0x52] = Z80._ops.LD_D_D;
            Z80._map[0x53] = Z80._ops.LD_D_E;
            Z80._map[0x54] = Z80._ops.LD_D_H;
            Z80._map[0x55] = Z80._ops.LD_D_L;
            Z80._map[0x57] = Z80._ops.LD_D_A;
            Z80._map[0x58] = Z80._ops.LD_E_B;
            Z80._map[0x59] = Z80._ops.LD_E_C;
            Z80._map[0x5A] = Z80._ops.LD_E_D;
            Z80._map[0x5B] = Z80._ops.LD_E_E;
            Z80._map[0x5C] = Z80._ops.LD_E_H;
            Z80._map[0x5D] = Z80._ops.LD_E_L;
            Z80._map[0x5F] = Z80._ops.LD_E_A;
            Z80._map[0x60] = Z80._ops.LD_H_B;
            Z80._map[0x61] = Z80._ops.LD_H_C;
            Z80._map[0x62] = Z80._ops.LD_H_D;
            Z80._map[0x63] = Z80._ops.LD_H_E;
            Z80._map[0x64] = Z80._ops.LD_H_H;
            Z80._map[0x65] = Z80._ops.LD_H_L;
            Z80._map[0x67] = Z80._ops.LD_H_A;
            Z80._map[0x68] = Z80._ops.LD_L_B;
            Z80._map[0x69] = Z80._ops.LD_L_C;
            Z80._map[0x6A] = Z80._ops.LD_L_D;
            Z80._map[0x6B] = Z80._ops.LD_L_E;
            Z80._map[0x6C] = Z80._ops.LD_L_H;
            Z80._map[0x6D] = Z80._ops.LD_L_L;
            Z80._map[0x6F] = Z80._ops.LD_L_A;
            Z80._map[0x78] = Z80._ops.LD_A_B;
            Z80._map[0x79] = Z80._ops.LD_A_C;
            Z80._map[0x7A] = Z80._ops.LD_A_D;
            Z80._map[0x7B] = Z80._ops.LD_A_E;
            Z80._map[0x7C] = Z80._ops.LD_A_H;
            Z80._map[0x7D] = Z80._ops.LD_A_L;
            Z80._map[0x7F] = Z80._ops.LD_A_A;
            
            // Memory loads
            Z80._map[0x0A] = Z80._ops.LD_A_BC;
            Z80._map[0x1A] = Z80._ops.LD_A_DE;
            Z80._map[0x02] = Z80._ops.LD_BC_A;
            Z80._map[0x12] = Z80._ops.LD_DE_A;
            Z80._map[0x3A] = Z80._ops.LDD_A_HL;
            Z80._map[0x2A] = Z80._ops.LDI_A_HL;
            Z80._map[0x32] = Z80._ops.LDD_HL_A;
            Z80._map[0x22] = Z80._ops.LDI_HL_A;
            
            // Control flow
            Z80._map[0xC9] = Z80._ops.RET;
            Z80._map[0xCD] = Z80._ops.CALL;
            Z80._map[0x30] = Z80._ops.JR_NC_r8;
            Z80._map[0x38] = Z80._ops.JR_C_r8;
            Z80._map[0xC2] = Z80._ops.JP_NZ_a16;
            Z80._map[0xCA] = Z80._ops.JP_Z_a16;
            Z80._map[0xD2] = Z80._ops.JP_NC_a16;
            Z80._map[0xDA] = Z80._ops.JP_C_a16;
            
            // Initialize CB map
            for(var i = 0; i < 256; i++)
                Z80._cbmap[i] = null;
            
            // CB opcodes: rotates and shifts (0x00-0x3F)
            for(var reg = 0; reg < 8; reg++) {
                Z80._cbmap[0x00 + reg] = Z80._ops.RLC.bind(null, reg);
                Z80._cbmap[0x08 + reg] = Z80._ops.RRC.bind(null, reg);
                Z80._cbmap[0x10 + reg] = Z80._ops.RL.bind(null, reg);
                Z80._cbmap[0x18 + reg] = Z80._ops.RR.bind(null, reg);
                Z80._cbmap[0x20 + reg] = Z80._ops.SLA.bind(null, reg);
                Z80._cbmap[0x28 + reg] = Z80._ops.SRA.bind(null, reg);
                Z80._cbmap[0x30 + reg] = Z80._ops.SWAP.bind(null, reg);
                Z80._cbmap[0x38 + reg] = Z80._ops.SRL.bind(null, reg);
            }
            
            // CB opcodes: BIT (0x40-0x7F)
            for(var bit = 0; bit < 8; bit++) {
                for(var reg = 0; reg < 8; reg++) {
                    Z80._cbmap[0x40 + (bit * 8) + reg] = Z80._ops.BIT.bind(null, bit, reg);
                }
            }
            
            // CB opcodes: RES (0x80-0xBF)
            for(var bit = 0; bit < 8; bit++) {
                for(var reg = 0; reg < 8; reg++) {
                    Z80._cbmap[0x80 + (bit * 8) + reg] = Z80._ops.RES.bind(null, bit, reg);
                }
            }
            
            // CB opcodes: SET (0xC0-0xFF)
            for(var bit = 0; bit < 8; bit++) {
                for(var reg = 0; reg < 8; reg++) {
                    Z80._cbmap[0xC0 + (bit * 8) + reg] = Z80._ops.SET.bind(null, bit, reg);
                }
            }
    },

    exec: function() {
            if(Z80._halt) {
                Z80._reg.m = 1;
                Z80._reg.t = 4;
                Z80._stepM = 1;
                Z80._stepT = 4;

                if(MMU._ie & MMU._if)
                    Z80._halt = 0;

                if(Z80._imePending) {
                    Z80._imePending--;
                    if(!Z80._imePending)
                        Z80._reg.ime = 1;
                }

                Z80.handleInterrupts();
                Z80._clock.m += Z80._stepM;
                Z80._clock.t += Z80._stepT;
                if(typeof TIMER !== 'undefined' && TIMER && typeof TIMER.inc === 'function')
                    TIMER.inc();
                return;
            }

            Z80._reg.r = (Z80._reg.r + 1) & 127;
            var pc = Z80._reg.pc;
            var opcode = MMU.rb(pc);
            Z80._reg.pc = (Z80._reg.pc + 1) & 0xFFFF;
            if(typeof opcode !== 'number' || isNaN(opcode)) {
                console.error('Invalid opcode read at PC 0x' + pc.toString(16).toUpperCase() + ', treating as 0x00');
                opcode = 0;
            }
            
            if(opcode === 0xCB) {
                // CB prefix - read next byte as opcode
                var cb_opcode = MMU.rb(Z80._reg.pc);
                Z80._reg.pc = (Z80._reg.pc + 1) & 0xFFFF;
                if(typeof cb_opcode !== 'number' || isNaN(cb_opcode)) {
                    console.error('Invalid CB opcode read at PC 0x' + pc.toString(16).toUpperCase() + ', treating as 0x00');
                    cb_opcode = 0;
                }
                if(!Z80._cbmap[cb_opcode]) {
                    var hex = cb_opcode.toString(16).toUpperCase();
                    if(hex.length === 1) hex = '0' + hex;
                    console.error('Unimplemented CB opcode 0x' + hex + ' at PC 0x' + pc.toString(16).toUpperCase());
                    Z80._reg.m = 1; Z80._reg.t = 4;
                } else {
                    Z80._cbmap[cb_opcode]();
                }
            } else if(!Z80._map[opcode]) {
                var hex = opcode.toString(16).toUpperCase();
                if(hex.length === 1) hex = '0' + hex;
                console.error('Unimplemented opcode 0x' + hex + ' at PC 0x' + pc.toString(16).toUpperCase());
                Z80._reg.m = 1; Z80._reg.t = 4;
            } else {
                Z80._map[opcode]();
            }
            Z80._reg.pc &= 65535;
            Z80._stepM = Z80._reg.m;
            Z80._stepT = Z80._reg.t;
            if(Z80._imePending) {
                Z80._imePending--;
                if(!Z80._imePending)
                    Z80._reg.ime = 1;
            }
            Z80.handleInterrupts();
            Z80._clock.m += Z80._stepM;
            Z80._clock.t += Z80._stepT;
            if(typeof TIMER !== 'undefined' && TIMER && typeof TIMER.inc === 'function')
                TIMER.inc();
            
            // Log PC progression at key points
            if(Z80._lastLoggedPC !== pc) {
                if(pc === 0x00FE || pc === 0x00FF || pc === 0x0100 || pc === 0x0101) {
                    console.log('PC progression: 0x' + pc.toString(16) + ' -> 0x' + Z80._reg.pc.toString(16) + ', InBios: ' + MMU._inbios);
                    Z80._lastLoggedPC = Z80._reg.pc;
                }
            }
            
            if(!MMU._inbios && !Z80._romStartLogged)
                Z80._romStartLogged = true;
            
            // Log first 20 instructions after BIOS
            if(Z80._execCount === undefined && !MMU._inbios) {
                Z80._execCount = 0;
            }
            if(Z80._execCount !== undefined) {
                Z80._execCount++;
                if(Z80._execCount > 100)
                    Z80._execCount = undefined;
            }
    },

    handleInterrupts: function() {
            if(!Z80._reg.ime)
                return;

            var fired = MMU._ie & MMU._if;
            if(!fired)
                return;

            var vector = null;

            if(fired & 0x01) {
                MMU._if &= 0xFE;
                vector = 0x40;
            }
            else if(fired & 0x02) {
                MMU._if &= 0xFD;
                vector = 0x48;
            }
            else if(fired & 0x04) {
                MMU._if &= 0xFB;
                vector = 0x50;
            }
            else if(fired & 0x08) {
                MMU._if &= 0xF7;
                vector = 0x58;
            }
            else if(fired & 0x10) {
                MMU._if &= 0xEF;
                vector = 0x60;
            }

            if(vector === null)
                return;

            Z80._reg.ime = 0;
            Z80._halt = 0;
            Z80._reg.sp = (Z80._reg.sp - 2) & 0xFFFF;
            MMU.ww(Z80._reg.sp, Z80._reg.pc);
            Z80._reg.pc = vector;
            Z80._stepM += 5;
            Z80._stepT += 20;
    },


    /*
     * Flags(F) for GameBoy Z80 CPU 
     * Zero         (0x80)
     * Operation    (0x40)
     * Half-carry   (0x20)
     * Carry        (0x10)
     */

    _ops: {

        _addA: function(value) {
            var a = Z80._reg.a;
            var result = a + value;
            Z80._reg.f = 0;
            if((result & 0xFF) === 0) Z80._reg.f |= 0x80;
            if(((a & 0x0F) + (value & 0x0F)) > 0x0F) Z80._reg.f |= 0x20;
            if(result > 0xFF) Z80._reg.f |= 0x10;
            Z80._reg.a = result & 0xFF;
        },

        // Add A to A, leaves result in A (ADD A, A)
        ADDr_a: function() {
            Z80._ops._addA(Z80._reg.a);
            Z80._reg.m = 1;  Z80._reg.t = 4;

        },

        // Add B to A, leaves result in A (ADD A, B)
        ADDr_b: function() {
            Z80._ops._addA(Z80._reg.b);
            Z80._reg.m = 1;  Z80._reg.t = 4;

        },

        // Add C to A, leaves result in A (ADD A, C)
        ADDr_c: function() {
            Z80._ops._addA(Z80._reg.c);
            Z80._reg.m = 1;  Z80._reg.t = 4;

        },

        // Add D to A, leaves result in A (ADD A, D)
        ADDr_d: function() {
            Z80._ops._addA(Z80._reg.d);
            Z80._reg.m = 1;  Z80._reg.t = 4;

        },

        // Add E to A, leaves result in A (ADD A, E)
        ADDr_e: function() {
            Z80._ops._addA(Z80._reg.e);
            Z80._reg.m = 1;  Z80._reg.t = 4;

        },

        // Add H to A, leaves result in A (ADD A, H)
        ADDr_h: function() {
            Z80._ops._addA(Z80._reg.h);
            Z80._reg.m = 1;  Z80._reg.t = 4;

        },

        // Add L to A, leaves result in A (ADD A, L)
        ADDr_l: function() {
            Z80._ops._addA(Z80._reg.l);
            Z80._reg.m = 1;  Z80._reg.t = 4;

        },

        // Compare A to A, setting flags (CP A, A)
        CPr_a: function() {
            Z80._ops.CPr_n(Z80._reg.a);
            Z80._reg.m = 1; Z80._reg.t = 4;

        },

        // Compare B to A, setting flags (CP A, B)
        CPr_b: function() {
            Z80._ops.CPr_n(Z80._reg.b);
            Z80._reg.m = 1; Z80._reg.t = 4;

        },

        // Compare C to A, setting flags (CP A, C)
        CPr_c: function() {
            Z80._ops.CPr_n(Z80._reg.c);
            Z80._reg.m = 1; Z80._reg.t = 4;

        },

        // Compare D to A, setting flags (CP A, D)
        CPr_d: function() {
            Z80._ops.CPr_n(Z80._reg.d);
            Z80._reg.m = 1; Z80._reg.t = 4;

        },

        // Compare E to A, setting flags (CP A, E)
        CPr_e: function() {
            Z80._ops.CPr_n(Z80._reg.e);
            Z80._reg.m = 1; Z80._reg.t = 4;

        },

        // Compare H to A, setting flags (CP A, H)
        CPr_h: function() {
            Z80._ops.CPr_n(Z80._reg.h);
            Z80._reg.m = 1; Z80._reg.t = 4;

        },

        // Compare L to A, setting flags (CP A, L)
        CPr_l: function() {
            Z80._ops.CPr_n(Z80._reg.l);
            Z80._reg.m = 1; Z80._reg.t = 4;

        },

        // No opperation
        NOP: function() {
            Z80._reg.m = 1;  Z80._reg.t = 4;                    // 1 M - time taken
        },

        XORa: function() {
            Z80._reg.a ^= Z80._reg.a;
            Z80._reg.f = 0x80;                                 // zero flag set, no carry
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        LD_B_n: function() {
            Z80._reg.b = MMU.rb(Z80._reg.pc++);
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        LD_C_n: function() {
            Z80._reg.c = MMU.rb(Z80._reg.pc++);
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        LD_D_n: function() {
            Z80._reg.d = MMU.rb(Z80._reg.pc++);
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        LD_E_n: function() {
            Z80._reg.e = MMU.rb(Z80._reg.pc++);
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        LD_H_n: function() {
            Z80._reg.h = MMU.rb(Z80._reg.pc++);
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        LD_L_n: function() {
            Z80._reg.l = MMU.rb(Z80._reg.pc++);
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        LD_A_n: function() {
            Z80._reg.a = MMU.rb(Z80._reg.pc++);
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        LD_BC_nn: function() {
            Z80._reg.c = MMU.rb(Z80._reg.pc++);
            Z80._reg.b = MMU.rb(Z80._reg.pc++);
            Z80._reg.m = 3; Z80._reg.t = 12;
        },

        LD_DE_nn: function() {
            Z80._reg.e = MMU.rb(Z80._reg.pc++);
            Z80._reg.d = MMU.rb(Z80._reg.pc++);
            Z80._reg.m = 3; Z80._reg.t = 12;
        },

        LD_HL_nn: function() {
            Z80._reg.l = MMU.rb(Z80._reg.pc++);
            Z80._reg.h = MMU.rb(Z80._reg.pc++);
            Z80._reg.m = 3; Z80._reg.t = 12;
        },

        LD_SP_nn: function() {
            Z80._reg.sp = MMU.rw(Z80._reg.pc);
            Z80._reg.pc += 2;
            Z80._reg.m = 3; Z80._reg.t = 12;
        },

        LD_a16_SP: function() {
            var addr = MMU.rw(Z80._reg.pc);
            Z80._reg.pc += 2;
            MMU.ww(addr, Z80._reg.sp);
            Z80._reg.m = 5; Z80._reg.t = 20;
        },

        LD_HLm_A: function() {
            var addr = (Z80._reg.h << 8) | Z80._reg.l;
            MMU.wb(addr, Z80._reg.a);
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        INC_A: function() {
            var value = (Z80._reg.a + 1) & 0xFF;
            var carry = Z80._reg.f & 0x10;
            Z80._reg.f = carry;
            if(value === 0)
                Z80._reg.f |= 0x80;
            if((Z80._reg.a & 0x0F) + 1 > 0x0F)
                Z80._reg.f |= 0x20;
            Z80._reg.a = value;
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        DEC_A: function() {
            var value = (Z80._reg.a - 1) & 0xFF;
            var carry = Z80._reg.f & 0x10;
            Z80._reg.f = carry | 0x40;
            if(value === 0)
                Z80._reg.f |= 0x80;
            if((Z80._reg.a & 0x0F) === 0)
                Z80._reg.f |= 0x20;
            Z80._reg.a = value;
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        _addHL: function(value) {
            var hl = (Z80._reg.h << 8) | Z80._reg.l;
            var result = hl + value;
            var zero = Z80._reg.f & 0x80;
            Z80._reg.f = zero;
            if(((hl & 0x0FFF) + (value & 0x0FFF)) > 0x0FFF)
                Z80._reg.f |= 0x20;
            if(result > 0xFFFF)
                Z80._reg.f |= 0x10;
            result &= 0xFFFF;
            Z80._reg.h = (result >> 8) & 0xFF;
            Z80._reg.l = result & 0xFF;
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        _inc8: function(value) {
            var result = (value + 1) & 0xFF;
            var flags = Z80._reg.f & 0x10;
            if(result === 0)
                flags |= 0x80;
            if((value & 0x0F) === 0x0F)
                flags |= 0x20;
            Z80._reg.f = flags;
            return result;
        },

        _dec8: function(value) {
            var result = (value - 1) & 0xFF;
            var flags = (Z80._reg.f & 0x10) | 0x40;
            if(result === 0)
                flags |= 0x80;
            if((value & 0x0F) === 0)
                flags |= 0x20;
            Z80._reg.f = flags;
            return result;
        },

        ADD_HL_BC: function() {
            Z80._ops._addHL((Z80._reg.b << 8) | Z80._reg.c);
        },

        ADD_HL_DE: function() {
            Z80._ops._addHL((Z80._reg.d << 8) | Z80._reg.e);
        },

        ADD_HL_HL: function() {
            Z80._ops._addHL((Z80._reg.h << 8) | Z80._reg.l);
        },

        ADD_HL_SP: function() {
            Z80._ops._addHL(Z80._reg.sp);
        },

        INC_HL: function() {
            var hl = ((Z80._reg.h << 8) | Z80._reg.l) + 1;
            hl &= 0xFFFF;
            Z80._reg.h = (hl >> 8) & 0xFF;
            Z80._reg.l = hl & 0xFF;
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        JP_a16: function() {
            Z80._reg.pc = MMU.rw(Z80._reg.pc);
            Z80._reg.m = 4; Z80._reg.t = 16;
        },

        JR_r8: function() {
            var offset = MMU.rb(Z80._reg.pc++);
            if(offset & 0x80) offset -= 0x100;
            Z80._reg.pc = (Z80._reg.pc + offset) & 0xFFFF;
            Z80._reg.m = 3; Z80._reg.t = 12;
        },

        JR_NZ_r8: function() {
            var offset = MMU.rb(Z80._reg.pc++);
            if(!(Z80._reg.f & 0x80)){
                if(offset & 0x80) offset -= 0x100;
                Z80._reg.pc = (Z80._reg.pc + offset) & 0xFFFF;
                Z80._reg.m = 3; Z80._reg.t = 12;
                return;
            }
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        JR_Z_r8: function() {
            var offset = MMU.rb(Z80._reg.pc++);
            if(Z80._reg.f & 0x80){
                if(offset & 0x80) offset -= 0x100;
                Z80._reg.pc = (Z80._reg.pc + offset) & 0xFFFF;
                Z80._reg.m = 3; Z80._reg.t = 12;
                return;
            }
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        LD_A_HLm: function() {
            var addr = (Z80._reg.h << 8) | Z80._reg.l;
            Z80._reg.a = MMU.rb(addr);
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        LD_mma_A: function() {
            var addr = MMU.rw(Z80._reg.pc);
            Z80._reg.pc += 2;
            MMU.wb(addr, Z80._reg.a);
            Z80._reg.m = 4; Z80._reg.t = 16;
        },

        LD_HLm_n: function() {
            var addr = (Z80._reg.h << 8) | Z80._reg.l;
            MMU.wb(addr, MMU.rb(Z80._reg.pc++));
            Z80._reg.m = 3; Z80._reg.t = 12;
        },

        LD_B_HLm: function() { Z80._reg.b = MMU.rb((Z80._reg.h << 8) | Z80._reg.l); Z80._reg.m = 2; Z80._reg.t = 8; },
        LD_C_HLm: function() { Z80._reg.c = MMU.rb((Z80._reg.h << 8) | Z80._reg.l); Z80._reg.m = 2; Z80._reg.t = 8; },
        LD_D_HLm: function() { Z80._reg.d = MMU.rb((Z80._reg.h << 8) | Z80._reg.l); Z80._reg.m = 2; Z80._reg.t = 8; },
        LD_E_HLm: function() { Z80._reg.e = MMU.rb((Z80._reg.h << 8) | Z80._reg.l); Z80._reg.m = 2; Z80._reg.t = 8; },
        LD_H_HLm: function() { Z80._reg.h = MMU.rb((Z80._reg.h << 8) | Z80._reg.l); Z80._reg.m = 2; Z80._reg.t = 8; },
        LD_L_HLm: function() { Z80._reg.l = MMU.rb((Z80._reg.h << 8) | Z80._reg.l); Z80._reg.m = 2; Z80._reg.t = 8; },

        LD_HLm_B: function() { MMU.wb((Z80._reg.h << 8) | Z80._reg.l, Z80._reg.b); Z80._reg.m = 2; Z80._reg.t = 8; },
        LD_HLm_C: function() { MMU.wb((Z80._reg.h << 8) | Z80._reg.l, Z80._reg.c); Z80._reg.m = 2; Z80._reg.t = 8; },
        LD_HLm_D: function() { MMU.wb((Z80._reg.h << 8) | Z80._reg.l, Z80._reg.d); Z80._reg.m = 2; Z80._reg.t = 8; },
        LD_HLm_E: function() { MMU.wb((Z80._reg.h << 8) | Z80._reg.l, Z80._reg.e); Z80._reg.m = 2; Z80._reg.t = 8; },
        LD_HLm_H: function() { MMU.wb((Z80._reg.h << 8) | Z80._reg.l, Z80._reg.h); Z80._reg.m = 2; Z80._reg.t = 8; },
        LD_HLm_L: function() { MMU.wb((Z80._reg.h << 8) | Z80._reg.l, Z80._reg.l); Z80._reg.m = 2; Z80._reg.t = 8; },

        ADD_A_n: function() {
            Z80._ops._addA(MMU.rb(Z80._reg.pc++));
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        ADC_A_n: function() {
            var value = MMU.rb(Z80._reg.pc++);
            var carry = (Z80._reg.f & 0x10) ? 1 : 0;
            var result = Z80._reg.a + value + carry;
            Z80._reg.f = 0;
            if(!(result & 0xFF)) Z80._reg.f |= 0x80;
            if((Z80._reg.a & 0x0F) + (value & 0x0F) + carry > 0x0F) Z80._reg.f |= 0x20;
            if(result > 0xFF) Z80._reg.f |= 0x10;
            Z80._reg.a = result & 0xFF;
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        SUB_A_n: function() {
            Z80._ops.SUB(MMU.rb(Z80._reg.pc++));
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        SBC_A_n: function() {
            var value = MMU.rb(Z80._reg.pc++);
            var carry = (Z80._reg.f & 0x10) ? 1 : 0;
            Z80._ops.SUB(value + carry);
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        ADC_A_r: function(value) {
            var carry = (Z80._reg.f & 0x10) ? 1 : 0;
            var result = Z80._reg.a + value + carry;
            Z80._reg.f = 0;
            if(!(result & 0xFF)) Z80._reg.f |= 0x80;
            if((Z80._reg.a & 0x0F) + (value & 0x0F) + carry > 0x0F) Z80._reg.f |= 0x20;
            if(result > 0xFF) Z80._reg.f |= 0x10;
            Z80._reg.a = result & 0xFF;
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        ADC_A_B: function() { Z80._ops.ADC_A_r(Z80._reg.b); },
        ADC_A_C: function() { Z80._ops.ADC_A_r(Z80._reg.c); },
        ADC_A_D: function() { Z80._ops.ADC_A_r(Z80._reg.d); },
        ADC_A_E: function() { Z80._ops.ADC_A_r(Z80._reg.e); },
        ADC_A_H: function() { Z80._ops.ADC_A_r(Z80._reg.h); },
        ADC_A_L: function() { Z80._ops.ADC_A_r(Z80._reg.l); },
        ADC_A_A: function() { Z80._ops.ADC_A_r(Z80._reg.a); },
        ADC_A_HLm: function() { var addr = (Z80._reg.h << 8) | Z80._reg.l; Z80._ops.ADC_A_r(MMU.rb(addr)); Z80._reg.m = 2; Z80._reg.t = 8; },

        SBC_A_r: function(value) {
            var carry = (Z80._reg.f & 0x10) ? 1 : 0;
            Z80._ops.SUB(value + carry);
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        SBC_A_B: function() { Z80._ops.SBC_A_r(Z80._reg.b); },
        SBC_A_C: function() { Z80._ops.SBC_A_r(Z80._reg.c); },
        SBC_A_D: function() { Z80._ops.SBC_A_r(Z80._reg.d); },
        SBC_A_E: function() { Z80._ops.SBC_A_r(Z80._reg.e); },
        SBC_A_H: function() { Z80._ops.SBC_A_r(Z80._reg.h); },
        SBC_A_L: function() { Z80._ops.SBC_A_r(Z80._reg.l); },
        SBC_A_A: function() { Z80._ops.SBC_A_r(Z80._reg.a); },
        SBC_A_HLm: function() { var addr = (Z80._reg.h << 8) | Z80._reg.l; Z80._ops.SBC_A_r(MMU.rb(addr)); Z80._reg.m = 2; Z80._reg.t = 8; },

        AND_A_r: function(value) {
            Z80._reg.a &= value;
            Z80._reg.f = Z80._reg.a ? 0 : 0x80;
            Z80._reg.f |= 0x20;
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        AND_A_B: function() { Z80._ops.AND_A_r(Z80._reg.b); },
        AND_A_C: function() { Z80._ops.AND_A_r(Z80._reg.c); },
        AND_A_D: function() { Z80._ops.AND_A_r(Z80._reg.d); },
        AND_A_E: function() { Z80._ops.AND_A_r(Z80._reg.e); },
        AND_A_H: function() { Z80._ops.AND_A_r(Z80._reg.h); },
        AND_A_L: function() { Z80._ops.AND_A_r(Z80._reg.l); },
        AND_A_A: function() { Z80._ops.AND_A_r(Z80._reg.a); },
        AND_A_HLm: function() { var addr = (Z80._reg.h << 8) | Z80._reg.l; Z80._ops.AND_A_r(MMU.rb(addr)); Z80._reg.m = 2; Z80._reg.t = 8; },

        XOR_A_r: function(value) {
            Z80._reg.a ^= value;
            Z80._reg.f = Z80._reg.a ? 0 : 0x80;
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        XOR_A_B: function() { Z80._ops.XOR_A_r(Z80._reg.b); },
        XOR_A_C: function() { Z80._ops.XOR_A_r(Z80._reg.c); },
        XOR_A_D: function() { Z80._ops.XOR_A_r(Z80._reg.d); },
        XOR_A_E: function() { Z80._ops.XOR_A_r(Z80._reg.e); },
        XOR_A_H: function() { Z80._ops.XOR_A_r(Z80._reg.h); },
        XOR_A_L: function() { Z80._ops.XOR_A_r(Z80._reg.l); },
        XOR_A_A: function() { Z80._ops.XOR_A_r(Z80._reg.a); },
        XOR_A_HLm: function() { var addr = (Z80._reg.h << 8) | Z80._reg.l; Z80._ops.XOR_A_r(MMU.rb(addr)); Z80._reg.m = 2; Z80._reg.t = 8; },

        OR_A_r: function(value) {
            Z80._reg.a |= value;
            Z80._reg.f = Z80._reg.a ? 0 : 0x80;
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        OR_A_B: function() { Z80._ops.OR_A_r(Z80._reg.b); },
        OR_A_C: function() { Z80._ops.OR_A_r(Z80._reg.c); },
        OR_A_D: function() { Z80._ops.OR_A_r(Z80._reg.d); },
        OR_A_E: function() { Z80._ops.OR_A_r(Z80._reg.e); },
        OR_A_H: function() { Z80._ops.OR_A_r(Z80._reg.h); },
        OR_A_L: function() { Z80._ops.OR_A_r(Z80._reg.l); },
        OR_A_A: function() { Z80._ops.OR_A_r(Z80._reg.a); },
        OR_A_HLm: function() { var addr = (Z80._reg.h << 8) | Z80._reg.l; Z80._ops.OR_A_r(MMU.rb(addr)); Z80._reg.m = 2; Z80._reg.t = 8; },

        CP_A_r: function(value) {
            Z80._ops.CPr_n(value);
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        CP_A_B: function() { Z80._ops.CP_A_r(Z80._reg.b); },
        CP_A_C: function() { Z80._ops.CP_A_r(Z80._reg.c); },
        CP_A_D: function() { Z80._ops.CP_A_r(Z80._reg.d); },
        CP_A_E: function() { Z80._ops.CP_A_r(Z80._reg.e); },
        CP_A_H: function() { Z80._ops.CP_A_r(Z80._reg.h); },
        CP_A_L: function() { Z80._ops.CP_A_r(Z80._reg.l); },
        CP_A_A: function() { Z80._ops.CP_A_r(Z80._reg.a); },
        CP_A_HLm: function() { var addr = (Z80._reg.h << 8) | Z80._reg.l; Z80._ops.CP_A_r(MMU.rb(addr)); Z80._reg.m = 2; Z80._reg.t = 8; },

        INC_BC: function() {
            var bc = ((Z80._reg.b << 8) | Z80._reg.c) + 1;
            bc &= 0xFFFF;
            Z80._reg.b = (bc >> 8) & 0xFF;
            Z80._reg.c = bc & 0xFF;
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        INC_DE: function() {
            var de = ((Z80._reg.d << 8) | Z80._reg.e) + 1;
            de &= 0xFFFF;
            Z80._reg.d = (de >> 8) & 0xFF;
            Z80._reg.e = de & 0xFF;
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        INC_SP: function() {
            Z80._reg.sp = (Z80._reg.sp + 1) & 0xFFFF;
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        DEC_BC: function() {
            var bc = ((Z80._reg.b << 8) | Z80._reg.c) - 1;
            bc &= 0xFFFF;
            Z80._reg.b = (bc >> 8) & 0xFF;
            Z80._reg.c = bc & 0xFF;
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        DEC_DE: function() {
            var de = ((Z80._reg.d << 8) | Z80._reg.e) - 1;
            de &= 0xFFFF;
            Z80._reg.d = (de >> 8) & 0xFF;
            Z80._reg.e = de & 0xFF;
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        DEC_SP: function() {
            Z80._reg.sp = (Z80._reg.sp - 1) & 0xFFFF;
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        INC_HLm: function() {
            var addr = (Z80._reg.h << 8) | Z80._reg.l;
            var value = Z80._ops._inc8(MMU.rb(addr));
            MMU.wb(addr, value);
            Z80._reg.m = 3; Z80._reg.t = 12;
        },

        DEC_HLm: function() {
            var addr = (Z80._reg.h << 8) | Z80._reg.l;
            var value = Z80._ops._dec8(MMU.rb(addr));
            MMU.wb(addr, value);
            Z80._reg.m = 3; Z80._reg.t = 12;
        },

        AND_A_n: function() {
            Z80._reg.a &= MMU.rb(Z80._reg.pc++);
            Z80._reg.f = Z80._reg.a ? 0 : 0x80;
            Z80._reg.f |= 0x20;
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        XOR_A_n: function() {
            Z80._reg.a ^= MMU.rb(Z80._reg.pc++);
            Z80._reg.f = Z80._reg.a ? 0 : 0x80;
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        OR_A_n: function() {
            Z80._reg.a |= MMU.rb(Z80._reg.pc++);
            Z80._reg.f = Z80._reg.a ? 0 : 0x80;
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        CPr_n: function(value) {
            var i = Z80._reg.a - value;
            Z80._reg.f = 0x40;
            if(!(i & 0xFF)) Z80._reg.f |= 0x80;
            if((Z80._reg.a & 0x0F) < (value & 0x0F)) Z80._reg.f |= 0x20;
            if(i < 0) Z80._reg.f |= 0x10;
        },

        CP_A_n: function() {
            Z80._ops.CPr_n(MMU.rb(Z80._reg.pc++));
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        LDH_a8_A: function() {
            var addr = 0xFF00 + MMU.rb(Z80._reg.pc++);
            MMU.wb(addr, Z80._reg.a);
            Z80._reg.m = 3; Z80._reg.t = 12;
        },

        LDH_A_a8: function() {
            Z80._reg.a = MMU.rb(0xFF00 + MMU.rb(Z80._reg.pc++));
            Z80._reg.m = 3; Z80._reg.t = 12;
        },

        LDH_C_A: function() {
            MMU.wb(0xFF00 + Z80._reg.c, Z80._reg.a);
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        LDH_A_C: function() {
            Z80._reg.a = MMU.rb(0xFF00 + Z80._reg.c);
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        JP_HL: function() {
            Z80._reg.pc = (Z80._reg.h << 8) | Z80._reg.l;
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        LD_SP_HL: function() {
            Z80._reg.sp = (Z80._reg.h << 8) | Z80._reg.l;
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        ADD_SP_r8: function() {
            var offset = MMU.rb(Z80._reg.pc++);
            if(offset & 0x80) offset -= 0x100;
            var result = Z80._reg.sp + offset;
            Z80._reg.f = 0;
            if(((Z80._reg.sp & 0x0F) + (offset & 0x0F)) > 0x0F) Z80._reg.f |= 0x20;
            if(((Z80._reg.sp & 0xFF) + (offset & 0xFF)) > 0xFF) Z80._reg.f |= 0x10;
            Z80._reg.sp = result & 0xFFFF;
            Z80._reg.m = 4; Z80._reg.t = 16;
        },

        LD_HL_SP_r8: function() {
            var offset = MMU.rb(Z80._reg.pc++);
            if(offset & 0x80) offset -= 0x100;
            var result = Z80._reg.sp + offset;
            Z80._reg.f = 0;
            if(((Z80._reg.sp & 0x0F) + (offset & 0x0F)) > 0x0F) Z80._reg.f |= 0x20;
            if(((Z80._reg.sp & 0xFF) + (offset & 0xFF)) > 0xFF) Z80._reg.f |= 0x10;
            Z80._reg.h = (result >> 8) & 0xFF;
            Z80._reg.l = result & 0xFF;
            Z80._reg.m = 3; Z80._reg.t = 12;
        },

        DI: function() {
            Z80._reg.ime = 0;
            Z80._imePending = 0;
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        EI: function() {
            Z80._imePending = 2;
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        HALT: function() {
            Z80._halt = 1;
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        STOP: function() {
            Z80._stop = 1;
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        CCF: function() {
            var zero = Z80._reg.f & 0x80;
            var carry = (Z80._reg.f & 0x10) ? 0 : 0x10;
            Z80._reg.f = zero | carry;
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        RLCA: function() {
            var carry = (Z80._reg.a & 0x80) ? 1 : 0;
            Z80._reg.a = ((Z80._reg.a << 1) | carry) & 0xFF;
            Z80._reg.f = carry ? 0x10 : 0;
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        RRCA: function() {
            var carry = Z80._reg.a & 0x01;
            Z80._reg.a = ((Z80._reg.a >> 1) | (carry << 7)) & 0xFF;
            Z80._reg.f = carry ? 0x10 : 0;
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        RLA: function() {
            var carryIn = (Z80._reg.f & 0x10) ? 1 : 0;
            var carryOut = (Z80._reg.a & 0x80) ? 0x10 : 0;
            Z80._reg.a = ((Z80._reg.a << 1) | carryIn) & 0xFF;
            Z80._reg.f = carryOut;
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        RRA: function() {
            var carryIn = (Z80._reg.f & 0x10) ? 0x80 : 0;
            var carryOut = (Z80._reg.a & 0x01) ? 0x10 : 0;
            Z80._reg.a = ((Z80._reg.a >> 1) | carryIn) & 0xFF;
            Z80._reg.f = carryOut;
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        SCF: function() {
            Z80._reg.f = (Z80._reg.f & 0x80) | 0x10;
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        CPL: function() {
            Z80._reg.a ^= 0xFF;
            Z80._reg.f |= 0x40 | 0x20;
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        DAA: function() {
            var a = Z80._reg.a;
            var adjust = 0;
            if(Z80._reg.f & 0x10) {
                adjust |= 0x60;
            }
            if(Z80._reg.f & 0x20) {
                adjust |= 0x06;
            }
            if((a & 0x0F) > 9) adjust |= 0x06;
            if(a > 0x99) adjust |= 0x60;
            if(Z80._reg.f & 0x40) {
                a = (a - adjust) & 0xFF;
            } else {
                a = (a + adjust) & 0xFF;
            }
            Z80._reg.a = a;
            Z80._reg.f &= 0x10;
            if(!a) Z80._reg.f |= 0x80;
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        RET_NZ: function() {
            if(!(Z80._reg.f & 0x80)) {
                Z80._reg.pc = MMU.rw(Z80._reg.sp);
                Z80._reg.sp += 2;
                Z80._reg.m = 5; Z80._reg.t = 20;
            } else {
                Z80._reg.m = 2; Z80._reg.t = 8;
            }
        },

        RET_Z: function() {
            if(Z80._reg.f & 0x80) {
                Z80._reg.pc = MMU.rw(Z80._reg.sp);
                Z80._reg.sp += 2;
                Z80._reg.m = 5; Z80._reg.t = 20;
            } else {
                Z80._reg.m = 2; Z80._reg.t = 8;
            }
        },

        RET_NC: function() {
            if(!(Z80._reg.f & 0x10)) {
                Z80._reg.pc = MMU.rw(Z80._reg.sp);
                Z80._reg.sp += 2;
                Z80._reg.m = 5; Z80._reg.t = 20;
            } else {
                Z80._reg.m = 2; Z80._reg.t = 8;
            }
        },

        RET_C: function() {
            if(Z80._reg.f & 0x10) {
                Z80._reg.pc = MMU.rw(Z80._reg.sp);
                Z80._reg.sp += 2;
                Z80._reg.m = 5; Z80._reg.t = 20;
            } else {
                Z80._reg.m = 2; Z80._reg.t = 8;
            }
        },

        CALL_NZ: function() {
            var addr = MMU.rw(Z80._reg.pc);
            Z80._reg.pc += 2;
            if(!(Z80._reg.f & 0x80)) {
                Z80._reg.sp -= 2;
                MMU.ww(Z80._reg.sp, Z80._reg.pc);
                Z80._reg.pc = addr;
                Z80._reg.m = 6; Z80._reg.t = 24;
            } else {
                Z80._reg.m = 3; Z80._reg.t = 12;
            }
        },

        CALL_Z: function() {
            var addr = MMU.rw(Z80._reg.pc);
            Z80._reg.pc += 2;
            if(Z80._reg.f & 0x80) {
                Z80._reg.sp -= 2;
                MMU.ww(Z80._reg.sp, Z80._reg.pc);
                Z80._reg.pc = addr;
                Z80._reg.m = 6; Z80._reg.t = 24;
            } else {
                Z80._reg.m = 3; Z80._reg.t = 12;
            }
        },

        CALL_NC: function() {
            var addr = MMU.rw(Z80._reg.pc);
            Z80._reg.pc += 2;
            if(!(Z80._reg.f & 0x10)) {
                Z80._reg.sp -= 2;
                MMU.ww(Z80._reg.sp, Z80._reg.pc);
                Z80._reg.pc = addr;
                Z80._reg.m = 6; Z80._reg.t = 24;
            } else {
                Z80._reg.m = 3; Z80._reg.t = 12;
            }
        },

        CALL_C: function() {
            var addr = MMU.rw(Z80._reg.pc);
            Z80._reg.pc += 2;
            if(Z80._reg.f & 0x10) {
                Z80._reg.sp -= 2;
                MMU.ww(Z80._reg.sp, Z80._reg.pc);
                Z80._reg.pc = addr;
                Z80._reg.m = 6; Z80._reg.t = 24;
            } else {
                Z80._reg.m = 3; Z80._reg.t = 12;
            }
        },

        // Start vblank handler (0040h)
        RST40: function() {
            //disacle further interrupts until EI is executed
            Z80._reg.ime = 0;

            //save current SP on the stack
            Z80._reg.sp -= 2;
            MMU.ww(Z80._reg.sp, Z80._reg.pc);
            
            //jump to vblank handler
            Z80._reg.pc = 0x40;
            Z80._reg.m = 3;
            Z80._reg.t = 12;
        },

        // Return from vblank handler and enable interrupts
        RETI: function() {
            // jump to the address on the stack
            Z80._reg.pc = MMU.rw(Z80._reg.sp);
            Z80._reg.sp += 2;

            // restore interrups
            Z80._reg.ime = 1;
            Z80._reg.m = 4;
            Z80._reg.t = 16;
        },

        RST_00: function() { Z80._reg.sp -= 2; MMU.ww(Z80._reg.sp, Z80._reg.pc); Z80._reg.pc = 0x00; Z80._reg.m = 4; Z80._reg.t = 16; },
        RST_08: function() { Z80._reg.sp -= 2; MMU.ww(Z80._reg.sp, Z80._reg.pc); Z80._reg.pc = 0x08; Z80._reg.m = 4; Z80._reg.t = 16; },
        RST_10: function() { Z80._reg.sp -= 2; MMU.ww(Z80._reg.sp, Z80._reg.pc); Z80._reg.pc = 0x10; Z80._reg.m = 4; Z80._reg.t = 16; },
        RST_18: function() { Z80._reg.sp -= 2; MMU.ww(Z80._reg.sp, Z80._reg.pc); Z80._reg.pc = 0x18; Z80._reg.m = 4; Z80._reg.t = 16; },
        RST_20: function() { Z80._reg.sp -= 2; MMU.ww(Z80._reg.sp, Z80._reg.pc); Z80._reg.pc = 0x20; Z80._reg.m = 4; Z80._reg.t = 16; },
        RST_28: function() { Z80._reg.sp -= 2; MMU.ww(Z80._reg.sp, Z80._reg.pc); Z80._reg.pc = 0x28; Z80._reg.m = 4; Z80._reg.t = 16; },
        RST_30: function() { Z80._reg.sp -= 2; MMU.ww(Z80._reg.sp, Z80._reg.pc); Z80._reg.pc = 0x30; Z80._reg.m = 4; Z80._reg.t = 16; },
        RST_38: function() { Z80._reg.sp -= 2; MMU.ww(Z80._reg.sp, Z80._reg.pc); Z80._reg.pc = 0x38; Z80._reg.m = 4; Z80._reg.t = 16; },

        INC_B: function() {
            Z80._reg.b = Z80._ops._inc8(Z80._reg.b);
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        DEC_B: function() {
            Z80._reg.b = Z80._ops._dec8(Z80._reg.b);
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        INC_C: function() {
            Z80._reg.c = Z80._ops._inc8(Z80._reg.c);
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        DEC_C: function() {
            Z80._reg.c = Z80._ops._dec8(Z80._reg.c);
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        INC_D: function() {
            Z80._reg.d = Z80._ops._inc8(Z80._reg.d);
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        DEC_D: function() {
            Z80._reg.d = Z80._ops._dec8(Z80._reg.d);
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        INC_E: function() {
            Z80._reg.e = Z80._ops._inc8(Z80._reg.e);
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        DEC_E: function() {
            Z80._reg.e = Z80._ops._dec8(Z80._reg.e);
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        INC_H: function() {
            Z80._reg.h = Z80._ops._inc8(Z80._reg.h);
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        DEC_H: function() {
            Z80._reg.h = Z80._ops._dec8(Z80._reg.h);
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        INC_L: function() {
            Z80._reg.l = Z80._ops._inc8(Z80._reg.l);
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        DEC_L: function() {
            Z80._reg.l = Z80._ops._dec8(Z80._reg.l);
            Z80._reg.m = 1; Z80._reg.t = 4;
        },

        DEC_HL: function() {
            var hl = ((Z80._reg.h << 8) | Z80._reg.l) - 1;
            hl &= 0xFFFF;
            Z80._reg.h = (hl >> 8) & 0xFF;
            Z80._reg.l = hl & 0xFF;
            Z80._reg.m = 2; Z80._reg.t = 8;
        },

        // Push registers B and C to the stack
        PUSHBC: function() {
            Z80._reg.sp--;                                      // Drop through the stack
            MMU.wb(Z80._reg.sp, Z80._reg.b);                    // Write B
            Z80._reg.sp--;                                      // Drop through the stack
            MMU.wb(Z80._reg.sp, Z80._reg.c);                    // Write C
            Z80._reg.m = 4; Z80._reg.t = 16;                    // 4 M-times taken

        },

        // Push registers D and E to the stack
        PUSHDE: function() {
            Z80._reg.sp--;                                      // Drop through the stack
            MMU.wb(Z80._reg.sp, Z80._reg.d);                    // Write B
            Z80._reg.sp--;                                      // Drop through the stack
            MMU.wb(Z80._reg.sp, Z80._reg.e);                    // Write C
            Z80._reg.m = 4; Z80._reg.t = 16;                    // 4 M-times taken

        },

        // Push registers H and L to the stack
        PUSHHL: function() {
            Z80._reg.sp--;                                      // Drop through the stack
            MMU.wb(Z80._reg.sp, Z80._reg.h);                    // Write B
            Z80._reg.sp--;                                      // Drop through the stack
            MMU.wb(Z80._reg.sp, Z80._reg.l);                    // Write C
            Z80._reg.m = 4; Z80._reg.t = 16;                    // 4 M-times taken

        },

        // Push registers A and F to the stack
        PUSHAF: function() {
            Z80._reg.sp--;                                      // Drop through the stack
            MMU.wb(Z80._reg.sp, Z80._reg.a);                    // Write B
            Z80._reg.sp--;                                      // Drop through the stack
            MMU.wb(Z80._reg.sp, Z80._reg.f);                    // Write C
            Z80._reg.m = 4; Z80._reg.t = 16;                    // 4 M-times taken

        },

        //Pop registers B and C from the stack
        POPBC: function() {
            Z80._reg.c = MMU.rb(Z80._reg.sp);                   // Read B
            Z80._reg.sp++;                                      // Move back up the stack
            Z80._reg.b = MMU.rb(Z80._reg.sp);                   // Read C
            Z80._reg.sp++;                                      // Move back up the stack
            Z80._reg.m = 3; Z80._reg.t = 12;                    // 3 M-times taken
        },

        //Pop registers D and E from the stack
        POPDE: function() {
            Z80._reg.e = MMU.rb(Z80._reg.sp);                   // Read D
            Z80._reg.sp++;                                      // Move back up the stack
            Z80._reg.d = MMU.rb(Z80._reg.sp);                   // Read E
            Z80._reg.sp++;                                      // Move back up the stack
            Z80._reg.m = 3; Z80._reg.t = 12;                    // 3 M-times taken
        },

        //Pop registers H and L from the stack
        POPHL: function() {
            Z80._reg.l = MMU.rb(Z80._reg.sp);                   // Read L
            Z80._reg.sp++;                                      // Move back up the stack
            Z80._reg.h = MMU.rb(Z80._reg.sp);                   // Read H
            Z80._reg.sp++;                                      // Move back up the stack
            Z80._reg.m = 3; Z80._reg.t = 12;                    // 3 M-times taken

        },

        //Pop registers A and F from the stack
        POPAF: function() {
            Z80._reg.f = MMU.rb(Z80._reg.sp) & 0xF0;           // Read F (lower nibble is always zero)
            Z80._reg.sp++;                                      // Move back up the stack
            Z80._reg.a = MMU.rb(Z80._reg.sp);                   // Read A
            Z80._reg.sp++;                                      // Move back up the stack
            Z80._reg.m = 3; Z80._reg.t = 12;                    // 3 M-times taken

        },

        //Read a byte from absolute location into A
        LDAmm: function() {
            var addr = MMU.rw(Z80._reg.pc);                    // Get address from instruction
            Z80._reg.pc += 2;                                  // Advance pc
            Z80._reg.a = MMU.rb(addr);                         // Read from address
            Z80._reg.m = 4; Z80._reg.t = 16;                   // 4 M-times taken

        },

        // Register to register loads (LD r, r')
        LD_A_A: function() { Z80._reg.a = Z80._reg.a; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_A_B: function() { Z80._reg.a = Z80._reg.b; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_A_C: function() { Z80._reg.a = Z80._reg.c; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_A_D: function() { Z80._reg.a = Z80._reg.d; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_A_E: function() { Z80._reg.a = Z80._reg.e; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_A_H: function() { Z80._reg.a = Z80._reg.h; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_A_L: function() { Z80._reg.a = Z80._reg.l; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_B_A: function() { Z80._reg.b = Z80._reg.a; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_B_B: function() { Z80._reg.b = Z80._reg.b; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_B_C: function() { Z80._reg.b = Z80._reg.c; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_B_D: function() { Z80._reg.b = Z80._reg.d; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_B_E: function() { Z80._reg.b = Z80._reg.e; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_B_H: function() { Z80._reg.b = Z80._reg.h; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_B_L: function() { Z80._reg.b = Z80._reg.l; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_C_A: function() { Z80._reg.c = Z80._reg.a; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_C_B: function() { Z80._reg.c = Z80._reg.b; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_C_C: function() { Z80._reg.c = Z80._reg.c; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_C_D: function() { Z80._reg.c = Z80._reg.d; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_C_E: function() { Z80._reg.c = Z80._reg.e; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_C_H: function() { Z80._reg.c = Z80._reg.h; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_C_L: function() { Z80._reg.c = Z80._reg.l; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_D_A: function() { Z80._reg.d = Z80._reg.a; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_D_B: function() { Z80._reg.d = Z80._reg.b; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_D_C: function() { Z80._reg.d = Z80._reg.c; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_D_D: function() { Z80._reg.d = Z80._reg.d; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_D_E: function() { Z80._reg.d = Z80._reg.e; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_D_H: function() { Z80._reg.d = Z80._reg.h; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_D_L: function() { Z80._reg.d = Z80._reg.l; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_E_A: function() { Z80._reg.e = Z80._reg.a; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_E_B: function() { Z80._reg.e = Z80._reg.b; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_E_C: function() { Z80._reg.e = Z80._reg.c; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_E_D: function() { Z80._reg.e = Z80._reg.d; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_E_E: function() { Z80._reg.e = Z80._reg.e; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_E_H: function() { Z80._reg.e = Z80._reg.h; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_E_L: function() { Z80._reg.e = Z80._reg.l; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_H_A: function() { Z80._reg.h = Z80._reg.a; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_H_B: function() { Z80._reg.h = Z80._reg.b; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_H_C: function() { Z80._reg.h = Z80._reg.c; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_H_D: function() { Z80._reg.h = Z80._reg.d; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_H_E: function() { Z80._reg.h = Z80._reg.e; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_H_H: function() { Z80._reg.h = Z80._reg.h; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_H_L: function() { Z80._reg.h = Z80._reg.l; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_L_A: function() { Z80._reg.l = Z80._reg.a; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_L_B: function() { Z80._reg.l = Z80._reg.b; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_L_C: function() { Z80._reg.l = Z80._reg.c; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_L_D: function() { Z80._reg.l = Z80._reg.d; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_L_E: function() { Z80._reg.l = Z80._reg.e; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_L_H: function() { Z80._reg.l = Z80._reg.h; Z80._reg.m = 1; Z80._reg.t = 4; },
        LD_L_L: function() { Z80._reg.l = Z80._reg.l; Z80._reg.m = 1; Z80._reg.t = 4; },

        // Load from memory
        LD_A_BC: function() { Z80._reg.a = MMU.rb((Z80._reg.b << 8) | Z80._reg.c); Z80._reg.m = 2; Z80._reg.t = 8; },
        LD_A_DE: function() { Z80._reg.a = MMU.rb((Z80._reg.d << 8) | Z80._reg.e); Z80._reg.m = 2; Z80._reg.t = 8; },
        LD_BC_A: function() { MMU.wb((Z80._reg.b << 8) | Z80._reg.c, Z80._reg.a); Z80._reg.m = 2; Z80._reg.t = 8; },
        LD_DE_A: function() { MMU.wb((Z80._reg.d << 8) | Z80._reg.e, Z80._reg.a); Z80._reg.m = 2; Z80._reg.t = 8; },
        LDD_A_HL: function() { var addr = (Z80._reg.h << 8) | Z80._reg.l; Z80._reg.a = MMU.rb(addr); Z80._reg.l = (Z80._reg.l - 1) & 0xFF; if(Z80._reg.l === 0xFF) Z80._reg.h = (Z80._reg.h - 1) & 0xFF; Z80._reg.m = 2; Z80._reg.t = 8; },
        LDI_A_HL: function() { var addr = (Z80._reg.h << 8) | Z80._reg.l; Z80._reg.a = MMU.rb(addr); Z80._reg.l = (Z80._reg.l + 1) & 0xFF; if(Z80._reg.l === 0) Z80._reg.h = (Z80._reg.h + 1) & 0xFF; Z80._reg.m = 2; Z80._reg.t = 8; },
        LDD_HL_A: function() { var addr = (Z80._reg.h << 8) | Z80._reg.l; MMU.wb(addr, Z80._reg.a); Z80._reg.l = (Z80._reg.l - 1) & 0xFF; if(Z80._reg.l === 0xFF) Z80._reg.h = (Z80._reg.h - 1) & 0xFF; Z80._reg.m = 2; Z80._reg.t = 8; },
        LDI_HL_A: function() { var addr = (Z80._reg.h << 8) | Z80._reg.l; MMU.wb(addr, Z80._reg.a); Z80._reg.l = (Z80._reg.l + 1) & 0xFF; if(Z80._reg.l === 0) Z80._reg.h = (Z80._reg.h + 1) & 0xFF; Z80._reg.m = 2; Z80._reg.t = 8; },

        // Control flow
        RET: function() { Z80._reg.pc = MMU.rw(Z80._reg.sp); Z80._reg.sp += 2; Z80._reg.m = 4; Z80._reg.t = 16; },
        CALL: function() { var addr = MMU.rw(Z80._reg.pc); Z80._reg.pc += 2; Z80._reg.sp -= 2; MMU.ww(Z80._reg.sp, Z80._reg.pc); Z80._reg.pc = addr; Z80._reg.m = 6; Z80._reg.t = 24; },
        JR_C_r8: function() { var offset = MMU.rb(Z80._reg.pc++); if(Z80._reg.f & 0x10) { if(offset & 0x80) offset -= 0x100; Z80._reg.pc = (Z80._reg.pc + offset) & 0xFFFF; Z80._reg.m = 3; Z80._reg.t = 12; return; } Z80._reg.m = 2; Z80._reg.t = 8; },
        JR_NC_r8: function() { var offset = MMU.rb(Z80._reg.pc++); if(!(Z80._reg.f & 0x10)) { if(offset & 0x80) offset -= 0x100; Z80._reg.pc = (Z80._reg.pc + offset) & 0xFFFF; Z80._reg.m = 3; Z80._reg.t = 12; return; } Z80._reg.m = 2; Z80._reg.t = 8; },
        JP_Z_a16: function() { var addr = MMU.rw(Z80._reg.pc); Z80._reg.pc += 2; if(Z80._reg.f & 0x80) { Z80._reg.pc = addr; Z80._reg.m = 4; Z80._reg.t = 16; return; } Z80._reg.m = 3; Z80._reg.t = 12; },
        JP_NZ_a16: function() { var addr = MMU.rw(Z80._reg.pc); Z80._reg.pc += 2; if(!(Z80._reg.f & 0x80)) { Z80._reg.pc = addr; Z80._reg.m = 4; Z80._reg.t = 16; return; } Z80._reg.m = 3; Z80._reg.t = 12; },
        JP_C_a16: function() { var addr = MMU.rw(Z80._reg.pc); Z80._reg.pc += 2; if(Z80._reg.f & 0x10) { Z80._reg.pc = addr; Z80._reg.m = 4; Z80._reg.t = 16; return; } Z80._reg.m = 3; Z80._reg.t = 12; },
        JP_NC_a16: function() { var addr = MMU.rw(Z80._reg.pc); Z80._reg.pc += 2; if(!(Z80._reg.f & 0x10)) { Z80._reg.pc = addr; Z80._reg.m = 4; Z80._reg.t = 16; return; } Z80._reg.m = 3; Z80._reg.t = 12; },

        // Arithmetic/Logic
        SUB_A: function() { Z80._ops.SUB(0); },
        SUB_A_B: function() { Z80._ops.SUB(Z80._reg.b); },
        SUB_A_C: function() { Z80._ops.SUB(Z80._reg.c); },
        SUB_A_D: function() { Z80._ops.SUB(Z80._reg.d); },
        SUB_A_E: function() { Z80._ops.SUB(Z80._reg.e); },
        SUB_A_H: function() { Z80._ops.SUB(Z80._reg.h); },
        SUB_A_L: function() { Z80._ops.SUB(Z80._reg.l); },
        SUB_A_A: function() { Z80._ops.SUB(Z80._reg.a); },
        SUB_A_HLm: function() { var addr = (Z80._reg.h << 8) | Z80._reg.l; Z80._ops.SUB(MMU.rb(addr)); Z80._reg.m = 2; Z80._reg.t = 8; },
        ADD_A_HLm: function() { var addr = (Z80._reg.h << 8) | Z80._reg.l; Z80._ops._addA(MMU.rb(addr)); Z80._reg.m = 2; Z80._reg.t = 8; },
        SUB: function(value) {
            var a = Z80._reg.a;
            var diff = a - value;
            Z80._reg.f = 0x40;
            if((diff & 0xFF) === 0) Z80._reg.f |= 0x80;
            if((a & 0x0F) < (value & 0x0F)) Z80._reg.f |= 0x20;
            if(diff < 0) Z80._reg.f |= 0x10;
            Z80._reg.a = diff & 0xFF;
            Z80._reg.m = 1;
            Z80._reg.t = 4;
        },
        AND_A: function() { Z80._reg.a = Z80._reg.a & Z80._reg.a; Z80._reg.f = 0; if(!Z80._reg.a) Z80._reg.f |= 0x80; Z80._reg.m = 1; Z80._reg.t = 4; },
        OR_A: function() { Z80._reg.a = Z80._reg.a | Z80._reg.a; Z80._reg.f = 0; if(!Z80._reg.a) Z80._reg.f |= 0x80; Z80._reg.m = 1; Z80._reg.t = 4; },
        
        // CB opcode helpers
        _getReg: function(reg) {
            switch(reg) {
                case 0: return Z80._reg.b;
                case 1: return Z80._reg.c;
                case 2: return Z80._reg.d;
                case 3: return Z80._reg.e;
                case 4: return Z80._reg.h;
                case 5: return Z80._reg.l;
                case 6: return MMU.rb((Z80._reg.h << 8) | Z80._reg.l);
                case 7: return Z80._reg.a;
            }
        },
        
        _setReg: function(reg, value) {
            switch(reg) {
                case 0: Z80._reg.b = value; break;
                case 1: Z80._reg.c = value; break;
                case 2: Z80._reg.d = value; break;
                case 3: Z80._reg.e = value; break;
                case 4: Z80._reg.h = value; break;
                case 5: Z80._reg.l = value; break;
                case 6: MMU.wb((Z80._reg.h << 8) | Z80._reg.l, value); break;
                case 7: Z80._reg.a = value; break;
            }
        },
        
        // CB opcodes
        RLC: function(reg) {
            var value = Z80._ops._getReg(reg);
            var carry = (value & 0x80) ? 1 : 0;
            value = ((value << 1) | carry) & 0xFF;
            Z80._reg.f = carry ? 0x10 : 0;
            if(!value) Z80._reg.f |= 0x80;
            Z80._ops._setReg(reg, value);
            Z80._reg.m = reg === 6 ? 4 : 2;
            Z80._reg.t = reg === 6 ? 16 : 8;
        },
        
        RRC: function(reg) {
            var value = Z80._ops._getReg(reg);
            var carry = value & 1;
            value = ((value >> 1) | (carry << 7)) & 0xFF;
            Z80._reg.f = carry ? 0x10 : 0;
            if(!value) Z80._reg.f |= 0x80;
            Z80._ops._setReg(reg, value);
            Z80._reg.m = reg === 6 ? 4 : 2;
            Z80._reg.t = reg === 6 ? 16 : 8;
        },
        
        RL: function(reg) {
            var value = Z80._ops._getReg(reg);
            var carry = (Z80._reg.f & 0x10) ? 1 : 0;
            var newCarry = (value & 0x80) ? 0x10 : 0;
            value = ((value << 1) | carry) & 0xFF;
            Z80._reg.f = newCarry;
            if(!value) Z80._reg.f |= 0x80;
            Z80._ops._setReg(reg, value);
            Z80._reg.m = reg === 6 ? 4 : 2;
            Z80._reg.t = reg === 6 ? 16 : 8;
        },
        
        RR: function(reg) {
            var value = Z80._ops._getReg(reg);
            var carry = (Z80._reg.f & 0x10) ? 1 : 0;
            var newCarry = (value & 1) ? 0x10 : 0;
            value = ((value >> 1) | (carry << 7)) & 0xFF;
            Z80._reg.f = newCarry;
            if(!value) Z80._reg.f |= 0x80;
            Z80._ops._setReg(reg, value);
            Z80._reg.m = reg === 6 ? 4 : 2;
            Z80._reg.t = reg === 6 ? 16 : 8;
        },
        
        SLA: function(reg) {
            var value = Z80._ops._getReg(reg);
            var carry = (value & 0x80) ? 0x10 : 0;
            value = (value << 1) & 0xFF;
            Z80._reg.f = carry;
            if(!value) Z80._reg.f |= 0x80;
            Z80._ops._setReg(reg, value);
            Z80._reg.m = reg === 6 ? 4 : 2;
            Z80._reg.t = reg === 6 ? 16 : 8;
        },
        
        SRA: function(reg) {
            var value = Z80._ops._getReg(reg);
            var carry = (value & 1) ? 0x10 : 0;
            value = ((value >> 1) | (value & 0x80)) & 0xFF;
            Z80._reg.f = carry;
            if(!value) Z80._reg.f |= 0x80;
            Z80._ops._setReg(reg, value);
            Z80._reg.m = reg === 6 ? 4 : 2;
            Z80._reg.t = reg === 6 ? 16 : 8;
        },
        
        SRL: function(reg) {
            var value = Z80._ops._getReg(reg);
            var carry = (value & 1) ? 0x10 : 0;
            value = (value >> 1) & 0xFF;
            Z80._reg.f = carry;
            if(!value) Z80._reg.f |= 0x80;
            Z80._ops._setReg(reg, value);
            Z80._reg.m = reg === 6 ? 4 : 2;
            Z80._reg.t = reg === 6 ? 16 : 8;
        },
        
        SWAP: function(reg) {
            var value = Z80._ops._getReg(reg);
            value = ((value & 0x0F) << 4) | ((value & 0xF0) >> 4);
            Z80._reg.f = 0;
            if(!value) Z80._reg.f |= 0x80;
            Z80._ops._setReg(reg, value);
            Z80._reg.m = reg === 6 ? 4 : 2;
            Z80._reg.t = reg === 6 ? 16 : 8;
        },
        
        BIT: function(bit, reg) {
            var value = Z80._ops._getReg(reg);
            var test = value & (1 << bit);
            Z80._reg.f = (Z80._reg.f & 0x10) | 0x20; // half-carry set, carry preserved
            if(!test) Z80._reg.f |= 0x80;
            Z80._reg.m = reg === 6 ? 3 : 2;
            Z80._reg.t = reg === 6 ? 12 : 8;
        },
        
        SET: function(bit, reg) {
            var value = Z80._ops._getReg(reg);
            value |= (1 << bit);
            Z80._ops._setReg(reg, value);
            Z80._reg.m = reg === 6 ? 4 : 2;
            Z80._reg.t = reg === 6 ? 16 : 8;
        },
        
        RES: function(bit, reg) {
            var value = Z80._ops._getReg(reg);
            value &= ~(1 << bit);
            Z80._ops._setReg(reg, value);
            Z80._reg.m = reg === 6 ? 4 : 2;
            Z80._reg.t = reg === 6 ? 16 : 8;
        },
        
    },

    

};