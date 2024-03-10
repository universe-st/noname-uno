import {lib,game,ui,get,ai,_status} from '../../../noname.js'
import { basic } from './basic.js';
export let musicItem = {
    'follow':'跟随无名杀',
    'random':'随机',
    'daokoudewangpai':'倒扣的王牌',
    'youxiwang':'热烈的决斗者',
    'doudizhu':'斗地主',
    'zhutumengjin':'猪突猛进',
    'huanxiaodekaixuan':"欢笑的凯旋",
    'xiaohualiuyan':'硝华流焰',
    'feihuadiancui':"飞花点翠",
    'ruyiling':'如意令',
    'zhuzhiqu':'竹枝曲',
    'huanyu':'欢愉',
    'blissful_little_ditty':'谐惬的俚曲',
};
export const config = {
    'uno_bgm':{
        name:'对局音乐',
        intro:'可以更改对局音乐。',
        item:musicItem,
        init:'random',
        onclick:function(item){
            game.saveExtensionConfig(basic.extensionName,'uno_bgm',item);
            if(item == 'follow'){
                delete _status.tempMusic;
                game.playBackgroundMusic();
            }else if(item == 'random'){
                _status.tempMusic = Object.keys(musicItem).filter(item=>item!='random' && item !='follow')
                .map(item=>`ext:${basic.extensionName}/resource/audio/bgm/${item}.mp3`);
                game.playBackgroundMusic();
            }else{
                let url = `ext:${basic.extensionName}/resource/audio/bgm/${item}.mp3`;
                _status.tempMusic = url;
                game.playBackgroundMusic();
            }
        }
    }
}