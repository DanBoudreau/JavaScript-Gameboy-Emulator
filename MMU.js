/* 
 * memory management unit
 *
 */

MMU = {

    // Flag indicating BiIOS is mapped in
    // BIOS is unmapped with the first instruction above 0x00FF
    _inbios: 1,

    // Memory regions (init at reset time)
    _bios: [
        0x31, 0xFE, 0xFF, 0xAF, 0x21, 0xFF, 0x9F, 0x32, 0xCB, 0x7C, 0x20, 0xFB, 0x21, 0x26, 0xFF, 0x0E,
        0x11, 0x3E, 0x80, 0x32, 0xE2, 0x0C, 0x3E, 0xF3, 0xE2, 0x32, 0x3E, 0x77, 0x77, 0x3E, 0xFC, 0xE0,
        0x47, 0x11, 0x04, 0x01, 0x21, 0x10, 0x80, 0x1A, 0xCD, 0x95, 0x00, 0xCD, 0x96, 0x00, 0x13, 0x7B,
        0xFE, 0x34, 0x20, 0xF3, 0x11, 0xD8, 0x00, 0x06, 0x08, 0x1A, 0x13, 0x22, 0x23, 0x05, 0x20, 0xF9,
        0x3E, 0x19, 0xEA, 0x10, 0x99, 0x21, 0x2F, 0x99, 0x0E, 0x0C, 0x3D, 0x28, 0x08, 0x32, 0x0D, 0x20,
        0xF9, 0x2E, 0x0F, 0x18, 0xF3, 0x67, 0x3E, 0x64, 0x57, 0xE0, 0x42, 0x3E, 0x91, 0xE0, 0x40, 0x04,
        0x1E, 0x02, 0x0E, 0x0C, 0xF0, 0x44, 0xFE, 0x90, 0x20, 0xFA, 0x0D, 0x20, 0xF7, 0x1D, 0x20, 0xF2,
        0x0E, 0x13, 0x24, 0x7C, 0x1E, 0x83, 0xFE, 0x62, 0x28, 0x06, 0x1E, 0xC1, 0xFE, 0x64, 0x20, 0x06,
        0x7B, 0xE2, 0x0C, 0x3E, 0x87, 0xF2, 0xF0, 0x42, 0x90, 0xE0, 0x42, 0x15, 0x20, 0xD2, 0x05, 0x20,
        0x4F, 0x16, 0x20, 0x18, 0xCB, 0x4F, 0x06, 0x04, 0xC5, 0xCB, 0x11, 0x17, 0xC1, 0xCB, 0x11, 0x17,
        0x05, 0x20, 0xF5, 0x22, 0x23, 0x22, 0x23, 0xC9, 0xCE, 0xED, 0x66, 0x66, 0xCC, 0x0D, 0x00, 0x0B,
        0x03, 0x73, 0x00, 0x83, 0x00, 0x0C, 0x00, 0x0D, 0x00, 0x08, 0x11, 0x1F, 0x88, 0x89, 0x00, 0x0E,
        0xDC, 0xCC, 0x6E, 0xE6, 0xDD, 0xDD, 0xD9, 0x99, 0xBB, 0xBB, 0x67, 0x63, 0x6E, 0x0E, 0xEC, 0xCC,
        0xDD, 0xDC, 0x99, 0x9F, 0xBB, 0xB9, 0x33, 0x3E, 0x3c, 0x42, 0xB9, 0xA5, 0xB9, 0xA5, 0x42, 0x4C,
        0x21, 0x04, 0x01, 0x11, 0xA8, 0x00, 0x1A, 0x13, 0xBE, 0x20, 0xFE, 0x23, 0x7D, 0xFE, 0x34, 0x20,
        0xF5, 0x06, 0x19, 0x78, 0x86, 0x23, 0x05, 0x20, 0xFB, 0x86, 0x20, 0xFE, 0x3E, 0x01, 0xE0, 0x50
    ],
    _rom: '',
    _wram: [],
    _eram: [],
    _zram: [],
    
    // copy of the ROM cartridge type, used for MBC handling
    _carttype: 0,
    
    _ie: 0,
    _if: 0,
    
    // MBC states
    _mbc: [],

    // Offset for ROM bank
    _rombankoffset: 0x4000,

    // Offset for RAM bank
    _rambankoffset: 0x0000,


    reset: function(){
        for(var i = 0; i < 8192; i++){
            MMU._wram[i] = 0;
        }

        for(var i = 0; i < 32768; i++){
            MMU._eram[i] = 0;
        }

        for(var i = 0; i < 127; i++){
            MMU._zram[i] = 0;
        }

        MMU._inbios = 1;
        MMU._ie = 0;
        MMU._if = 0;

        // initialize MBC states
        MMU._mbc[0] = {};
        MMU._mbc[1] = { 
            romBank: 1,     // selected Rom Bank
            ramBank: 0,     // selected Ram Bank (if applicable)
            ramEnabled: 0,  // Ram enable flag
            bankingMode: 0  // 0: ROM Banking Mode, 1: RAM Banking Mode
        };
        MMU._mbc[5] = {
            romBank: 1,
            ramBank: 0,
            ramEnabled: 0
        };
        MMU._rombankoffset = 0x4000;
        MMU._rambankoffset = 0x0000;

    },

    load: function(file){
        try {
            var b = new BinFileReader(file);
            MMU._rom = b.readString(b.getFileSize(), 0);
            MMU._carttype = MMU._rom.charCodeAt(0x0147);

            LOG.out('MMU', 'ROM loaded, '+ MMU._rom.length +' bytes.');
        } catch (e) {
            console.error('Failed to load ROM:', e.message);
            alert('Failed to load ROM: ' + e.message);
        }
    },


    // Read Bytes from memory
    // Read 8 bit byte from a given address
    rb: function(addr) {
        switch(addr & 0xF000){
            // BIOS (256b)/ROM0
            case 0x0000:
                if(MMU._inbios){
                    if(addr < 0x0100)
                        return MMU._bios[addr];
                    else if(addr >= 0x0100) {
                        MMU._inbios = 0;
                        console.log('BIOS dismounted at address 0x' + addr.toString(16));
                    }
                };
                var val = MMU._rom.charCodeAt(addr);
                return isNaN(val) ? 0 : val;
            
            // ROM0
            case 0x1000:
            case 0x2000:
            case 0x3000:
                var val = MMU._rom.charCodeAt(addr);
                return isNaN(val) ? 0 : val;

            // ROM1 (switched bank)
            case 0x4000:
            case 0x5000:
            case 0x6000:
            case 0x7000:
                var val = MMU._rom.charCodeAt(MMU._rombankoffset + (addr & 0x3FFF));
                return isNaN(val) ? 0 : val;
            
            // Graphics: VRAM
            case 0x8000:
            case 0x9000:
                return GPU._vram[addr & 0x1FFF];
            
            // External RAM
            case 0xA000:
            case 0xB000:
                return MMU._eram[MMU._rambankoffset + (addr & 0x1FFF)];

            // Working RAM
            case 0xC000:
            case 0xD000:
                return MMU._wram[addr & 0x1FFF];

            // Working RAM shadow
            case 0xE000:
                return MMU._wram[addr & 0x1FFF];

            // Working RAM shadow, I/O, Zero-page RAM
            case 0xF000:
                switch(addr & 0x0F00){
                    // Working RAM shadow
                    case 0x000: case 0x100: case 0x200: case 0x300:
                    case 0x400: case 0x500: case 0x600: case 0x700:
                    case 0x800: case 0x900: case 0xA00: case 0xB00:
                    case 0xC00: case 0xD00:
                        return MMU._wram[addr & 0x1FFF];

                    // Graphics: object attribute memory
                    //OAM is 160 bytes, remaining bytes read as 0
                    case 0xE00:
                        return (addr < 0xFEA0) ? GPU._oam[addr & 0xFF] : 0;

                    // zero page
                    case 0xF00:
                        if(addr == 0xFFFF){
			                return MMU._ie;
                        }
                        else if(addr == 0xFF0F){
                            return MMU._if;
                        }
                        else if(addr >= 0xFF80){
                            return MMU._zram[addr & 0x7F];
                        }
                        else if(addr >=0xFF40){
                            // GPU 64 registers
                            return GPU.rb(addr);
                        }
                        switch(addr) {
                            case 0xFF00: return KEY.rb();
                            case 0xFF04:
                            case 0xFF05:
                            case 0xFF06:
                            case 0xFF07:
                                return TIMER.rb(addr);
                            default:
                                return 0;
                        }

                };
                return 0;


        };
    },

    // Read 16 Bit word from a given address
    rw: function(addr) {
        return MMU.rb(addr) + (MMU.rb(addr+1) << 8);
    },

    // Write from given address
    // Write 8 bit byte from a given address
    wb: function(addr, val) {
        switch(addr & 0xF000){
            // ROM bank 0
            case 0x000:
                if(MMU._inbios && addr<0x0100) return;
        
            // fall through
            case 0x1000:
                switch(MMU._carttype){
                    case 2:
                    case 3:
                        MMU._mbc[1].ramEnabled = ((val & 0x0f) == 0x0A) ? 1 : 0;
                    break;
                    case 0x19:
                    case 0x1A:
                    case 0x1B:
                    case 0x1C:
                    case 0x1D:
                    case 0x1E:
                        MMU._mbc[5].ramEnabled = ((val & 0x0f) == 0x0A) ? 1 : 0;
                    break;
                }
                break;

            // MBC1 ROM bank
            case 0x2000:
            case 0x3000:
                // set the lower 5 bits of the ROM bank number
                switch(MMU._carttype){
                    case 1: 
                    case 2: 
                    case 3:
                        if(!val) 
                            val = 1;
                        
                        MMU._mbc[1].romBank = (MMU._mbc[1].romBank & 0x60) + val;
                        // calculate ROM bank offset
                        MMU._rombankoffset = MMU._mbc[1].romBank * 0x4000;

                    break;
                    case 0x19:
                    case 0x1A:
                    case 0x1B:
                    case 0x1C:
                    case 0x1D:
                    case 0x1E:
                        MMU._mbc[5].romBank = (MMU._mbc[5].romBank & 0x100) | val;
                        MMU._rombankoffset = MMU._mbc[5].romBank * 0x4000;

                    break;
                }
                break;

            case 0x3000:
                switch(MMU._carttype){
                    case 0x19:
                    case 0x1A:
                    case 0x1B:
                    case 0x1C:
                    case 0x1D:
                    case 0x1E:
                        MMU._mbc[5].romBank = (MMU._mbc[5].romBank & 0xFF) | ((val & 0x01) << 8);
                        MMU._rombankoffset = MMU._mbc[5].romBank * 0x4000;
                    break;
                }
                break;
            
            // RAM bank 1
            case 0x4000:
            case 0x5000:
                    switch(MMU._carttype){
                        case 1:
                        case 2:
                        case 3:
                            // MBC1: set RAM bank number or upper bits of ROM bank number, depending on banking mode
                            if(MMU._mbc[1].bankingMode){
                                MMU._mbc[1].ramBank = val & 3;
                                MMU._rambankoffset = MMU._mbc[1].ramBank * 0x2000;
                            }
                            //ROM banking mode: set high bits of ROM bank
                            else {
                                MMU._mbc[1].romBank = (MMU._mbc[1].romBank & 0x1F) + ((val & 3) << 5);
                                MMU._rombankoffset = MMU._mbc[1].romBank * 0x4000;
                            }
                        break;
                        case 0x19:
                        case 0x1A:
                        case 0x1B:
                        case 0x1C:
                        case 0x1D:
                        case 0x1E:
                            MMU._mbc[5].ramBank = val & 0x0F;
                            MMU._rambankoffset = MMU._mbc[5].ramBank * 0x2000;
                        break;
                    }
                break;
            case 0x6000:
            case 0x7000:
                switch(MMU._carttype)
	        	{
		            case 1:
		            case 2:
		            case 3:
	    	        MMU._mbc[1].bankingMode = val & 1;
			        break;
		        }
            break;
    
            // VRAM
            case 0x8000:
            case 0x9000:
                GPU._vram[addr & 0x1FFF] = val;
                if(typeof GPU.updatetile === 'function') {
                    GPU.updatetile(addr & 0x1FFF, val);
                    if(!MMU._vramWriteLogged) {
                        console.log('VRAM write detected at address 0x' + addr.toString(16));
                        MMU._vramWriteLogged = true;
                    }
                }
                break;

            // External RAM
            case 0xA000:
            case 0xB000:
                MMU._eram[MMU._rambankoffset + (addr & 0x1FFF)] = val;
                break;
            
            // Work RAM and Echo
            case 0xC000:
            case 0xD000:
            case 0xE000:
                MMU._wram[addr & 0x1FFF] = val;
                break;
            
            // Others
            case 0xF000:
                switch(addr & 0x0F00){
                    // Echo RAM
                    case 0x000: case 0x100: case 0x200: case 0x300:
                    case 0x400: case 0x500: case 0x600: case 0x700:
                    case 0x800: case 0x900: case 0xA00: case 0xB00:
                    case 0xC00: case 0xD00:
                        return MMU._wram[addr & 0x1FFF] = val;
                        break;

                    //OAM
                    case 0xE00:
                        if((addr < 0xFEA0)) GPU._oam[addr & 0xFF] = val;
                        GPU.buildobjdata(addr - 0xFE00, val);
                        break;
                    
                    // Zero-page RAM, I/O
                    case 0xF00:
                        if(addr == 0xFFFF)
                            MMU._ie = val;
                        else if(addr == 0xFF0F)
                            MMU._if = val;
                        else if(addr > 0xFF7F)
                            MMU._zram[addr & 0x7F] = val;
                        else
                        {
                            // I/O
                            switch(addr){
                                case 0xFF00:
                                    KEY.wb(addr, val);
                                    break;

                                case 0xFF04:
                                case 0xFF05:
                                case 0xFF06:
                                case 0xFF07:
                                    TIMER.wb(addr, val);
                                    break;

                                case 0xFF40:
                                case 0xFF41:
                                case 0xFF42:
                                case 0xFF43:
                                case 0xFF45:
                                case 0xFF47:
                                case 0xFF48:
                                case 0xFF49:
                                case 0xFF4A:
                                case 0xFF4B:
                                    GPU.wb(addr, val);
                                    break;

                                case 0xFF46:
                                    var base = val << 8;
                                    for(var i = 0; i < 0xA0; i++)
                                        MMU.wb(0xFE00 + i, MMU.rb(base + i));
                                    break;

                            }
                        }
                }
                break;

        }

    },

    // Write 16 Bit word from a given address
    ww: function(addr, val) {
        MMU.wb(addr, val & 255);
        MMU.wb(addr + 1, val >> 8);
    }

};