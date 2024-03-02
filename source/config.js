import {lib,game,ui,get,ai,_status} from '../../../noname.js'
import { basic } from './basic.js';
export const config = {
    'uno_bgm':{
        name:'对局音乐',
        intro:'可以更改对局音乐。',
        item:{
            'follow':'跟随无名杀',
            'daokoudewangpai':'倒扣的王牌',
            'youxiwang':'热烈的决斗者',
            'doudizhu':'斗地主',
        },
        init:'daokoudewangpai',
        onclick:function(item){
            game.saveExtensionConfig(basic.extensionName,'uno_bgm',item);
            if(item == 'follow'){
                delete _status.tempMusic;
                game.playBackgroundMusic();
            }else{
                let url = `ext:${basic.extensionName}/resource/audio/bgm/${item}.mp3`;
                _status.tempMusic = url;
                game.playBackgroundMusic();
            }
        }
    }
}