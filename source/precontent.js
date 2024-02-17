import {lib,game,ui,get,ai,_status} from '../../../noname.js'
import uno from './mode/uno/uno.js'
import {config as unoConfig} from './mode/uno/uno.js'
export async function precontent(config,pack){
    lib.suit.addArray(['unoRed','unoYelow','unoBlue','unoGreen','unoWild']);
    lib.translate['unoRed'] = '红';
    lib.translate['unoYellow'] = '黄';
    lib.translate['unoBlue'] = '蓝';
    lib.translate['unoGreen'] = '绿';
    lib.translate['unoWild'] = '万';
    game.addMode("uno",uno,unoConfig);
}