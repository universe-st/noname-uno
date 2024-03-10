import {lib,game,ui,get,ai,_status} from '../../../noname.js'
import uno from './mode/uno/uno.js'
import {config as unoConfig} from './mode/uno/uno.js'
export async function precontent(config,pack){
    game.addMode("uno",uno,unoConfig);
}