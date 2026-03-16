GPU = {
    _canvas: {},
    _screen: {},
    _tileset: {},

    reset: function(){
        
        var canv = document.getElementById('screen');
        
        if(canv && canv.getContext('2D')){
            GPU._canvas = canv.getContext('2D');
            if(GPU._canvas){
                if(GPU._canvas.createImageData)
                    GPU._screen = GPU._canvas.createImageData(160, 144);
                else if (GPU._canvas.createImageData)
                    GPU._screen = GPU._canvas.createImageData(0, 0, 160, 144);
                else
                    GPU._screen = {
                        'width': 160,
                        'height': 144,
                        'data': new Array(160*144*4)    
                    };
                
                // initialize to white screen
                for(var i = 0; i<160*144*4; i++)
                    GPU._screen.data[i] = 255;


                GPU._canvas.putImageData(GPU._screen, 0, 0);
            }

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
        GPU._modeclock += Z80._reg.t;

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
                        GPU._canvas.putImageData(GPU._screen, 0, 0);
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
        // get base address for the tile row
        addr &= 0x1FFE;

        // work out which tile row was updated
        var tile = (addr >> 4) & 511;
        var y = (addr >> 1) & 7;

        var sx;
        for(var x = 0; x < 8; x++){
            //find bit index for pixels
            sx = 1 << (7 - x);

            //update tile set
            GPU._tileset[tile][y][x] = ((GPU._vram[addr] & sx) ? 1 : 0) + ((GPU._vram[addr+1] & sx) ? 2 : 0);
        }
    },

    renderscan: function(){
        // VRAM offset for tile map
        var mapoffset = GPU._bgmap ? 0x1C00 : 0x1800;

        // which line of tiles to use in the map
        mapoffset += ((GPU._line + GPU._scy) & 255) >> 3;
        
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

        // if the tile data set in use is #1, the indices are signed; calculate tile offset
        if(GPU._bgtile ==  1 && tile < 128) 
            tile += 256;

        for(var i = 0; i < 160; i++){
            //re-map the tile pixel through the pallette
            colour = GPU._palette[GPU._tileset[tile][y][x]];

            //plot the pixel to canvas
            GPU._screen.data[canvasoffset + 0] = colour[0];
            GPU._screen.data[canvasoffset + 1] = colour[1];
            GPU._screen.data[canvasoffset + 2] = colour[2];
            GPU._screen.data[canvasoffset + 3] = colour[3];
            canvasoffset += 4;

            // when this tile ends, read another
            x++
            if(x == 8){
                x = 0;
                lineoffset = (lineoffset + 1) & 31;
                tile = GPU._vram[mapoffset + lineoffset];
                
                if(GPU._bgtile == 1 && tile < 128)
                    tile += 256;
            }

        }


    }
} 