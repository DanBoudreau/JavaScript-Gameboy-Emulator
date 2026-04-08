GPU = {
    _canvas: {},
    _screen: {},
    _tileset: {},
    _objdata: [],

    reset: function(){
        
        var canv = document.getElementById('screen');
        
        if(canv && canv.getContext('2d')){
            GPU._canvas = canv.getContext('2d');
            if(GPU._canvas){
                if(GPU._canvas.createImageData)
                    GPU._screen = GPU._canvas.createImageData(160, 144);
                else
                    GPU._screen = {
                        'width': 160,
                        'height': 144,
                        'data': new Array(160*144*4)    
                    };
                
                // initialize to black screen
                for(var i = 0; i<160*144*4; i++)
                    GPU._screen.data[i] = (i % 4 === 3) ? 255 : 0;
                
                // Draw a test pattern
                for(var y = 0; y < 10; y++) {
                    for(var x = 0; x < 10; x++) {
                        var offset = (y * 160 + x) * 4;
                        GPU._screen.data[offset] = 255;     // R
                        GPU._screen.data[offset + 1] = 255; // G
                        GPU._screen.data[offset + 2] = 255; // B
                        GPU._screen.data[offset + 3] = 255; // A
                    }
                }

                GPU._canvas.putImageData(GPU._screen, 0, 0);
            }

        }

        
        GPU._vram = [];
        GPU._oam = [];
        GPU._objdata = [];
        GPU._palette = [
            [255,255,255,255],
            [192,192,192,255],
            [96,96,96,255],
            [0,0,0,255]
        ];
        GPU._pal = {
            'obj0': [
                [255,255,255,255],
                [192,192,192,255],
                [96,96,96,255],
                [0,0,0,255]
            ],
            'obj1': [
                [255,255,255,255],
                [192,192,192,255],
                [96,96,96,255],
                [0,0,0,255]
            ]
        };
        GPU._scx = 0;
        GPU._scy = 0;
        GPU._bgmap = 0;
        GPU._bgtile = 0;
        GPU._winmap = 0;
        GPU._switchwin = 0;
        GPU._switchbg = 1;
        GPU._switchobj = 0;
        GPU._objsize = 0;
        GPU._switchlcd = 1;
        GPU._wy = 0;
        GPU._wx = 0;
        GPU._stat = 0;
        GPU._lyc = 0;
        GPU._mode = 2;
        GPU._modeclock = 0;
        GPU._line = 0;
        GPU._renderScanLogged = false;

        for(var i = 0; i < 8192; i++)
            GPU._vram[i] = 0;
        for(var i = 0; i < 160; i++)
            GPU._oam[i] = 0;
        for(var i=0, n=0; i < 40; i++, n+=4)
	    {
	        GPU._oam[n + 0] = 0;
	        GPU._oam[n + 1] = 0;
	        GPU._oam[n + 2] = 0;
	        GPU._oam[n + 3] = 0;
	        GPU._objdata[i] = {
	            'y': -16, 'x': -8,
		        'tile': 0, 'palette': 0,
		        'xflip': 0, 'yflip': 0, 'prio': 0, 'num': i
	        };
	    }
        GPU._tileset = [];
        
        for(var i = 0; i < 384; i++){
            GPU._tileset[i] = [];
            for(var j = 0; j < 8; j++)
                GPU._tileset[i][j] = [0,0,0,0,0,0,0,0];
        }

    },

    // Clock Step

    _mode: 0,
    _modeclock: 0,
    _line: 0,

    step: function(){
        if(!GPU._switchlcd)
            return;

        GPU._modeclock += Z80._stepT || Z80._reg.t;

        switch(GPU._mode){
            // OAM read mode, scanline active
            case 2:
                if(GPU._modeclock >= 80){
                    GPU._modeclock = 0;
                    GPU._mode = 3;
                }
                break;
            
            // VRAM read mode, scanline active
            // Treat end of mode 3 as end of scanline
            case 3:
                if(GPU._modeclock >= 172){
                    // enter hblank
                    GPU._modeclock = 0;
                    GPU._mode = 0;

                    // write scanline to framebuffer
                    GPU.renderscan();
                }
                break;
            
            // Hblank
            //after last hblank, push screen data to canvas
            case 0:
                if(GPU._modeclock >= 204){
                    GPU._modeclock = 0;
                    GPU._line++;

                    if(GPU._line == 143){
                        // enter vblank
                        GPU._mode = 1;
                        MMU._if |= 0x01;
                        if(GPU._canvas && GPU._screen) {
                            GPU._canvas.putImageData(GPU._screen, 0, 0);
                        }
                    }
                    else{
                        GPU._mode = 2;
                    }
                }
                break;

            // vblank (10 lines)
            case 1:
                if(GPU._modeclock >= 456){
                    GPU._modeclock = 0;
                    GPU._line++;

                    if(GPU._line > 153){
                        //restart scanning modes
                        GPU._mode = 2;
                        GPU._line = 0;
                    }
                }
                break;

        }
    },

    // takes value written to VRAM and updates the internal tile data set
    updatetile: function(addr, val){
        if(addr >= 0x1800)
            return;

        // get base address for the tile row
        addr &= 0x1FFE;

        // work out which tile row was updated
        var tile = (addr >> 4) & 511;
        if(tile >= 384)
            return;
        var y = (addr >> 1) & 7;

        var sx;
        for(var x = 0; x < 8; x++){
            //find bit index for pixels
            sx = 1 << (7 - x);

            //update tile set
            GPU._tileset[tile][y][x] = ((GPU._vram[addr] & sx) ? 1 : 0) + ((GPU._vram[addr+1] & sx) ? 2 : 0);
        }
    },

    updateoam: function(addr, val){
        GPU.buildobjdata(addr, val);
    },

    buildobjdata: function(addr, val){
        addr &= 0xFF;

        var obj = (addr >> 2) & 0x3F;
        if(obj >= 40)
            return;

        if(!GPU._objdata[obj]){
            GPU._objdata[obj] = {
                'y': -16, 'x': -8,
                'tile': 0, 'palette': 0,
                'xflip': 0, 'yflip': 0, 'prio': 0, 'num': obj
            };
        }

        switch(addr & 3){
            case 0:
                GPU._objdata[obj].y = val - 16;
                break;

            case 1:
                GPU._objdata[obj].x = val - 8;
                break;

            case 2:
                GPU._objdata[obj].tile = val;
                break;

            case 3:
                GPU._objdata[obj].palette = (val & 0x10) ? 1 : 0;
                GPU._objdata[obj].xflip = (val & 0x20) ? 1 : 0;
                GPU._objdata[obj].yflip = (val & 0x40) ? 1 : 0;
                GPU._objdata[obj].prio = (val & 0x80) ? 1 : 0;
                break;
        }
    },

    renderscan: function(){
        // VRAM offset for tile map
        var mapoffset = GPU._bgmap ? 0x1C00 : 0x1800;
        var scanrow = [];

        // which line of tiles to use in the map
        mapoffset += ((((GPU._line + GPU._scy) & 255) >> 3) * 32);
        
        // which tile to start with in the map line
        var lineoffset = (GPU._scx >> 3);

        // which line of pixels to use in the tiles
        var y = (GPU._line + GPU._scy) & 7;

        // where in the tileline to start
        var x = GPU._scx & 7;

        // where to render on canvas
        var canvasoffset = GPU._line * 160 * 4;

        // read tile index from background map
        var colour;
        var tile = GPU._vram[mapoffset + lineoffset];

        // LCDC bit 4 cleared selects the signed tile data region starting at 0x8800.
        if(GPU._bgtile === 0 && tile < 128)
            tile += 256;

        for(var i = 0; i < 160; i++){
            // re-map the tile pixel through the pallette
            colour = GPU._palette[GPU._tileset[tile][y][x]];

            // plot the pixel to canvas
            GPU._screen.data[canvasoffset + 0] = colour[0];
            GPU._screen.data[canvasoffset + 1] = colour[1];
            GPU._screen.data[canvasoffset + 2] = colour[2];
            GPU._screen.data[canvasoffset + 3] = colour[3];
            canvasoffset += 4;

            // Store the pixel for later checking
    		scanrow[i] = GPU._tileset[tile][y][x];


            // when this tile ends, read another
            x++
            if(x == 8){
                x = 0;
                lineoffset = (lineoffset + 1) & 31;
                tile = GPU._vram[mapoffset + lineoffset];
                
                if(GPU._bgtile === 0 && tile < 128)
                    tile += 256;
            }
        }

        if(GPU._switchwin && GPU._line >= GPU._wy){
            var windowx = GPU._wx - 7;
            if(windowx < 160){
                var windowmapoffset = GPU._winmap ? 0x1C00 : 0x1800;
                var windowline = GPU._line - GPU._wy;
                var windowrow = windowline & 7;
                windowmapoffset += ((windowline >> 3) * 32);

                for(var screenx = Math.max(windowx, 0); screenx < 160; screenx++){
                    var winx = screenx - windowx;
                    var windowtile = GPU._vram[windowmapoffset + (winx >> 3)];

                    if(GPU._bgtile === 0 && windowtile < 128)
                        windowtile += 256;

                    colour = GPU._palette[GPU._tileset[windowtile][windowrow][winx & 7]];

                    canvasoffset = (GPU._line * 160 + screenx) * 4;
                    GPU._screen.data[canvasoffset + 0] = colour[0];
                    GPU._screen.data[canvasoffset + 1] = colour[1];
                    GPU._screen.data[canvasoffset + 2] = colour[2];
                    GPU._screen.data[canvasoffset + 3] = colour[3];
                    scanrow[screenx] = GPU._tileset[windowtile][windowrow][winx & 7];
                }
            }
        }
        
        // Render sprites if they're switched on
        if(GPU._switchobj){
            var spriteheight = GPU._objsize ? 16 : 8;
            var linesprites = [];

            for(var i = 0; i < 40; i++){
                var obj = GPU._objdata[i];

                if(obj.y <= GPU._line && obj.y + spriteheight > GPU._line){
                    linesprites.push(obj);
                    if(linesprites.length === 10)
                        break;
                }
            }

            linesprites.sort(function(a, b) {
                if(a.x !== b.x)
                    return b.x - a.x;
                return b.num - a.num;
            });

            for(var i = 0; i < linesprites.length; i++){
                var obj = linesprites[i];
                var pal = obj.palette ? GPU._pal.obj1 : GPU._pal.obj0;
                var row = GPU._line - obj.y;

                if(obj.yflip)
                    row = spriteheight - 1 - row;

                var tileindex = obj.tile;
                if(spriteheight === 16){
                    tileindex &= 0xFE;
                    if(row >= 8){
                        tileindex++;
                        row -= 8;
                    }
                }

                var tilerow = GPU._tileset[tileindex][row];

                for(var x = 0; x < 8; x++){
                    var pixelx = obj.x + x;
                    var pixel = tilerow[obj.xflip ? (7 - x) : x];

                    if(pixelx < 0 || pixelx >= 160 || pixel === 0)
                        continue;

                    // OBJ priority bit set means the sprite is behind non-zero BG/window pixels.
                    if(obj.prio && scanrow[pixelx] !== 0)
                        continue;

                    var colour = pal[pixel];
                    var pixeloffset = (GPU._line * 160 + pixelx) * 4;

                    GPU._screen.data[pixeloffset + 0] = colour[0];
                    GPU._screen.data[pixeloffset + 1] = colour[1];
                    GPU._screen.data[pixeloffset + 2] = colour[2];
                    GPU._screen.data[pixeloffset + 3] = colour[3];
                }
            }
        }
        GPU._renderScanLogged = true;
    },

    // Register Handling
    rb: function(addr){
        switch(addr){

            // LCD control
            case 0xFF40:
                return (GPU._switchbg  ? 0x01 : 0x00) | 
                       (GPU._switchobj ? 0x02 : 0x00) |
                       (GPU._objsize   ? 0x04 : 0x00) |
                       (GPU._bgmap     ? 0x08 : 0x00) | 
                       (GPU._bgtile    ? 0x10 : 0x00) |
                       (GPU._switchwin ? 0x20 : 0x00) |
                       (GPU._winmap    ? 0x40 : 0x00) |
                       (GPU._switchlcd ? 0x80 : 0x00);

            case 0xFF41:
                return (GPU._stat & 0x78) |
                       ((GPU._line === GPU._lyc) ? 0x04 : 0x00) |
                       (GPU._mode & 0x03);

            case 0xFF45:
                return GPU._lyc;
            
            // scroll y
            case 0xFF42:
                return GPU._scy;

            // scroll x
            case 0xFF43:
                return GPU._scx;

            // current scanline
            case 0xFF44:
                return GPU._line;

            case 0xFF4A:
                return GPU._wy;

            case 0xFF4B:
                return GPU._wx;

        }

        return 0;
    },

    wb: function(addr, val){
        switch(addr){

            // LCD control
            case 0xFF40:
                GPU._switchbg   = (val & 0x01) ? 1 : 0;
                GPU._switchobj  = (val & 0x02) ? 1 : 0;
                GPU._objsize    = (val & 0x04) ? 1 : 0;
                GPU._bgmap      = (val & 0x08) ? 1 : 0;
                GPU._bgtile     = (val & 0x10) ? 1 : 0;
                GPU._switchwin  = (val & 0x20) ? 1 : 0;
                GPU._winmap     = (val & 0x40) ? 1 : 0;
                GPU._switchlcd  = (val & 0x80) ? 1 : 0;
                break;

            case 0xFF41:
                GPU._stat = val & 0x78;
                break;

            case 0xFF45:
                GPU._lyc = val;
                break;
            
            // scroll y
            case 0xFF42:
                GPU._scy = val;
                break;

            // scroll x
            case 0xFF43:
                GPU._scx = val;
                break;

            case 0xFF4A:
                GPU._wy = val;
                break;

            case 0xFF4B:
                GPU._wx = val;
                break;

            // background palette
            case 0xFF47:
                for(var i = 0; i < 4; i++){
                    switch((val >> (i * 2)) & 3){
                        case 0: 
                            GPU._palette[i] = [255,255,255,255];
                            break;
                            
                        case 1:
                            GPU._palette[i] = [192,192,192,255];
                            break;

                        case 2:
                            GPU._palette[i] = [96,96,96,255];
                            break;

                        case 3:
                            GPU._palette[i] = [0,0,0,255];
                            break;

                    }
                }
            break;

            // Object palettes
	        case 0xFF48:
	            for(var i = 0; i < 4; i++){
                    switch((val >> (i * 2)) & 3){
		                case 0: GPU._pal.obj0[i] = [255,255,255,255]; break;
			            case 1: GPU._pal.obj0[i] = [192,192,192,255]; break;
			            case 2: GPU._pal.obj0[i] = [ 96, 96, 96,255]; break;
			            case 3: GPU._pal.obj0[i] = [  0,  0,  0,255]; break;
		            }
                }   
		    break;

	        case 0xFF49:
	            for(var i = 0; i < 4; i++){
		            switch((val >> (i * 2)) & 3){
		                case 0: GPU._pal.obj1[i] = [255,255,255,255]; break;
			            case 1: GPU._pal.obj1[i] = [192,192,192,255]; break;
			            case 2: GPU._pal.obj1[i] = [ 96, 96, 96,255]; break;
			            case 3: GPU._pal.obj1[i] = [  0,  0,  0,255]; break;
		            }
                }
		    break;
        }
    },
} 