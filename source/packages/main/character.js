import {lib,game,ui,get,ai,_status} from '../../../../../noname.js'
import { basic } from '../../basic.js';
import { generateRandomNickname } from '../../randomName.js';
function readAvatarList(){
    return new Promise((resolve)=>{
        game.getFileList(basic.extensionDirectoryPath+'resource/image/headimage',function(folders,files){
            resolve(files);
        });
    });
}
export const character = async function(){
    let pack = {
        character:{
            
        },
        translate:{
            
        },
    };
    if(_status.uno_characterPack){
        return _status.uno_characterPack;
    }
    let avatars = await readAvatarList();
    avatars = avatars.randomGets(20);
    let pool = [];
    for(let i=0;i<avatars.length;i++){
        let avatar = avatars[i];
        let id = avatar.slice(0,avatar.lastIndexOf('.jpg'));
        let [name,sex] = generateRandomNickname();
        if(pool.includes(name)){
            i--;
            continue;
        }
        pool.push(name);
        pack.character[id] = [sex,['wei','shu','wu','qun'].randomGet(),[3,4].randomGet(),[],
        [`unoRandomPlayer`,'unseen',`des:<small>此名称“${name}”由代码在库中随机挑选字符拼凑生成，头像亦为随机选取，不代表作者看法。如有雷同或冒犯，纯属巧合，敬请谅解。</small>`,basic.extensionDirectoryPath.replace('extension/','ext:')+'resource/image/headimage/'+avatar]];
        pack.translate[id] = name;
    }
    _status.uno_characterPack = pack;
    return pack;
}