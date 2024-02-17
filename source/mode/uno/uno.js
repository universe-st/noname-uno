import {lib,game,ui,get,ai,_status} from '../../../../../noname.js'
import { character } from '../../packages/main/character.js';
export default {
    name:'uno',
    start:function*(event,map){
        let originalCreateCard = ui.create.card;
        ui.create.card = function(){
            let ret = originalCreateCard.call(ui.create,...arguments);
            ret.node.name.hide();
            ret.node.name2.hide();
            ret.node.info.hide();
            if(ret.$name)ret.$name.hide();
            if(ret.$suitnum)ret.$suitnum.hide();
            return ret;
        };
        lib.card.list = get.unoCardPile();
        game.prepareArena(4);
        let arr = Object.keys(lib.character).filter(key=>get.character(key,4).includes('unoRandomPlayer'))
        .randomGets(4);
        game.players.forEach(player=>{
            player.getId();
            player.init(arr.shift());
        });
        let firstCard = null;
        while(true){
            firstCard = get.cards(1)[0];
            yield game.me.showCards([firstCard],"第一张牌");
            game.cardsDiscard([firstCard]);
            //console.log(get.color(firstCard));
            if(['red','blue','green','yellow'].includes(get.color(firstCard))){
                break;
            }
        }
        yield game.gameDraw(game.me);
        _status.unoNextColor = get.color(firstCard);
        _status.unoNextNumber = get.number(firstCard);
        yield game.phaseLoop(game.players.randomGet());
    },
    element:{
        content:{
            phase:function*(event,map){
                let result = yield event.player.chooseToUse()
                .set('ai2',function(){
                    return 1;
                })
                .set('prompt',"轮到你出牌了。");
                if(!result.bool){
                    yield event.player.draw();
                }else if(event.player.countCards('h') == 0){
                    game.over(game.me == event.player);
                }else{
                    _status.unoNextColor = get.color(result.cards[0]);
                    _status.unoNextNumber = get.number(result.cards[0]);
                }
            },
            phaseLoop:function*(event,map){
                let player = event.player;
                while(!_status.over){
                    yield player.phase();
                    if(_status.unoDirection === 1){
                        player = event.player = player.previous;
                    }else{
                        player = event.player = player.next;
                    }
                }
            }
        }
    },
    game:{
        
    },
    get:{
        rawAttitude:function(a,b){
            if(a == b)return 1;
            return -1;
        },
        color:function(card){
            switch(card.suit){
                case 'unoRed':return 'red';
                case 'unoGreen':return 'green';
                case 'unoBlue':return 'blue';
                case 'unoYellow':return 'yellow';
                case 'unoWild':return 'wild';
            }
            return 'none';
        },
        unoCardEnable:function(card,player){
            let color = get.color(card);
            if(_status.unoNextColor == color || (typeof _status.unoNextNumber == 'number'&& _status.unoNextNumber>=0 && _status.unoNextNumber<=9 && _status.unoNextNumber === get.number(card))){
                return true;
            }
            if(color == 'wild')return true;
            return false;
        },
        unoCardPile:()=>{
            let trans = ['zero','one','two','three','four','five','six','seven','eight','nine'];
            let ret = [];
            for(let i=0;i<=9;i++){
                for(let suit of ['unoRed','unoGreen','unoBlue','unoYellow']){
                    ret.add([suit,i,'unocard_'+trans[i]]);
                }
            }
            for(let i=1;i<=9;i++){
                for(let suit of ['unoRed','unoGreen','unoBlue','unoYellow']){
                    ret.add([suit,i,'unocard_'+trans[i]]);
                    ret.add([suit,i,'unocard_'+trans[i]]);
                }
            }
            return ret;
        }
    },
    help:{
        "uno":"游戏规则可参考：<a href='https://baike.baidu.com/item/UNO/25437'>UNO-百度百科</a>"
    }
};

export const config = {
    translate:"优诺牌",
    config:{
        
    }
};