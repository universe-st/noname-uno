import {lib,game,ui,get,ai,_status} from '../../../noname.js'
import uno from './mode/uno/uno.js'
import {config as unoConfig} from './mode/uno/uno.js'
export async function precontent(config,pack){
    lib.suit.addArray(['unoRed','unoYelow','unoBlue','unoGreen','unoWild']);
    let translate = {
        'unoRed':'红',
        'unoYellow':'黄',
        'unoBlue':'蓝',
        'unoGreen':'绿',
        'unoWild':'万',
        'green':'绿色',
        'wild':'万能色',
        'yellow':'黄色',
        'blue':'蓝色',
        'uno_jump':'跳过',
        'uno_plus2':'罚二',
        'uno_plus4':'罚四',
        'uno_tochange_red':'转红',
        'uno_tochange_yellow':'转黄',
        'uno_tochange_blue':'转蓝',
        'uno_tochange_green':'转绿',
    };
    Object.keys(translate).forEach(key=>lib.translate[key] = translate[key]);
    game.addMode("uno",uno,unoConfig);
}