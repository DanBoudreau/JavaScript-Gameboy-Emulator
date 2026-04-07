KEY = {
    _rows: [0x0F, 0x0F],
    _column: 0,

    reset: function(){
        KEY._rows = [0x0F, 0x0F];
        KEY._column = 0;
    },
    
    rb: function(addr){
        switch(KEY._column){
            case 0x10: return KEY._rows[0];
            case 0x20: return K._rows[1];
            default: return 0;
            
        }
    },

    wb: function(addr, val){
        KEY._column = val & 0x30;
    },

/* Key        KeyCode                                GB-Z80 Bit
 * enter        13                                   
 * space        32                                   
 * ArrowLeft    37                                   
 * ArrowUp      38                                   
 * ArrowRight   39                                   
 * ArrowDown    40                                   
 * A-Z          65-90                                
 * 
 */ 

    // reset bit
    keydown: function(e){
        switch(e.keyCode){
            case 40: KEY._keys[1] &= 0x7; break; // down
            case 39: KEY._keys[1] &= 0xE; break; // right
            case 38: KEY._keys[1] &= 0xB; break; // up
            case 37: KEY._keys[1] &= 0xD; break; // left
            case 32: KEY._keys[0] &= 0xB; break; // space = select
            case 13: KEY._keys[0] &= 0x7; break; // enter = start
            case 88: KEY._keys[0] &= 0xD; break; // x = B
            case 90: KEY._keys[0] &= 0xE; break; // z = A
        }
    },

    // set bit
    keyup: function(e){
        switch(e.keyCode){
            case 40: KEY._keys[1] &= 0x8; break; // down
            case 39: KEY._keys[1] &= 0x1; break; // right
            case 38: KEY._keys[1] &= 0x4; break; // up
            case 37: KEY._keys[1] &= 0x2; break; // left
            case 32: KEY._keys[0] &= 0x4; break; // space = select
            case 13: KEY._keys[0] &= 0x8; break; // enter = start
            case 88: KEY._keys[0] &= 0x2; break; // x = B
            case 90: KEY._keys[0] &= 0x1; break; // z = A            
        }

    }

    
};

window.onkeydown = KEY.keydown;
window.onkeyup   = KEY.keyup;