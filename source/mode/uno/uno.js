import {lib,game,ui,get,ai,_status} from '../../../../../noname.js'
import { basic } from '../../basic.js';

function initUnoCard(){
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
}

function prepareMusic(){
    let bgm = game.getExtensionConfig(basic.extensionName,'uno_bgm');
    if(bgm == 'follow')return;
    let url = `ext:${basic.extensionName}/resource/audio/bgm/${bgm}.mp3`;
    _status.tempMusic = url;
    game.playBackgroundMusic();
}

export default {
    name:'uno',
    start:function*(event,map){
        _status.uno = true;
        _status.unoDirection = 'next';
        prepareMusic();
        ui.unoDirection = ui.create.div('.uno-turn',ui.background);
        ui.window.classList.add('leftbar');
        ui.window.classList.remove('rightbar');
        lib.init.css(basic.extensionDirectoryPath+'source/mode/uno','uno');
        initUnoCard();
        lib.card.list = get.unoCardPile();
        let playerNum = get.config('player_num');
        if(typeof playerNum == 'string')playerNum = parseInt(playerNum);
        if(typeof playerNum != 'number'|| isNaN(playerNum) || playerNum <= 3){
            playerNum = 4;
        }
        game.prepareArena(playerNum);
        let arr = Object.keys(lib.character).filter(key=>get.character(key,4).includes('unoRandomPlayer'))
        .randomGets(playerNum);
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
            let num = get.unoNumber(firstCard);
            if(typeof num == 'number' && num >=0 && num<=9 && ['red','blue','green','yellow'].includes(get.color(firstCard))){
                break;
            }
        }
        yield game.gameDraw(game.me);
        _status.unoNextColor = get.color(firstCard);
        _status.unoNextNumber = get.unoNumber(firstCard);
        yield game.phaseLoop(game.players.randomGet());
    },
    skill:{
        _uno_warn:{
            direct:true,
            popup:false,
            trigger:{
                player:['loseEnd','gainEnd'],
            },
            filter:function(event,player){
                if(event.name == 'lose'){
                    return player.countCards('h') <= 1;
                }else{
                    return player.countCards('h') > 1;
                }
            },
            content:function*(event,map){
                if(map.trigger.name == 'lose' && map.player.countCards('h') == 1){
                    game.playUnoEffect('uno');
                }
                map.player.refreshUnoState();
            }
        }
    },
    element:{
        player:{
            chooseToChangeColor:function(){
                let next = game.createEvent('chooseToChangeColor');
                next.player = this;
                next.setContent('chooseToChangeColor');
                return next;
            },
            getUnoNext:function(){
                return this[_status.unoDirection];
            },
            setToDraw:function(num){
                this.storage.uno_draw = num;
            },
            getToDraw:function(){
                return this.storage.uno_draw;
            },
            setBan:function(ban){
                if(!this.node.ban)this.node.ban = ui.create.div('.uno-ban',this);
                this.storage.uno_ban = ban;
                if(ban){
                    this.node.ban.show();
                }else{
                    this.node.ban.hide();
                }
            },
            isBanned:function(){
                return this.storage.uno_ban === true;
            },
            refreshUnoState:function(){
                let count = this.countCards('h');
                if(!this.node.unoState){
                    this.node.unoState = ui.create.div('.uno-warn',this);
                }
                if(count <= 1){
                    this.node.unoState.show();
                }else{
                    this.node.unoState.hide();
                }
            }
        },
        content:{
            chooseToChangeColor:function*(event,map){
                let player = event.player;
                let colors = ['red','yellow','blue','green'];
                let {control} = yield player.chooseControl(colors)
                    .set('prompt',"请选择你要转换的颜色")
                    .set('ai',function(){
                        let m = -1;
                        let mc = '';
                        colors.forEach(color=>{
                            let count = player.countCards('h',{color:color});
                            if(count > m){
                                mc = color;
                                m = count;
                            }
                        });
                        return colors.indexOf(mc);
                });
                game.log(player,'选择了',control);
                _status.unoNextColor = control;
                game.logv(player,'uno_tochange_'+control);
                game.playUnoEffect('change_'+control+'_male');
                player.say(get.translation(control));
            },
            phase:function*(event,map){
                if(event.player.isBanned()){
                    game.log(event.player,"跳过本次出牌。");
                    event.player.setBan(false);
                    game.logv(event.player,"uno_jump");
                    return;
                }
                if(event.player.getToDraw()){
                    game.logv(event.player,"uno_plus"+event.player.getToDraw());
                    event.player.draw(event.player.getToDraw());
                    event.player.setToDraw(0);
                    return;
                }
                let prompt = `你需要打出一张颜色为
                ${get.translation(_status.unoNextColor)}
                或者${typeof _status.unoNextNumber == 'number'?'点数':'牌类型'}
                为${get.translation(_status.unoNextNumber)}的牌，否则你摸一张牌。`;
                let result = yield event.player.chooseToUse()
                .set('ai2',function(){
                    return 1;
                })
                .set('prompt',prompt);
                if(!result.bool){
                    yield event.player.draw();
                }else if(event.player.countCards('h') == 0){
                    game.over(game.me == event.player);
                }else{
                    let color = get.color(result.cards[0]);
                    if(color != 'wild'){
                        _status.unoNextColor = get.color(result.cards[0]);
                    }
                    _status.unoNextNumber = get.unoNumber(result.cards[0]);
                }
            },
            phaseLoop:function*(event,map){
                let player = event.player;
                while(!_status.over){
                    player.classList.add('glow_phase');
                    yield player.phase();
                    player.classList.remove('glow_phase');
                    player = event.player = player.getUnoNext();
                }
            }
        }
    },
    game:{
        playUnoEffect:function(name,sex){
            if(sex)name = `${name}_${sex}`;
            game.playAudio(`ext:${basic.extensionName}/resource/audio/effect/${name}.mp3`);
        }
    },
    get:{
        unoNumber:function(card){
            if(typeof card.number == 'number' && card.number >= 0 && card.number <= 9){
                return get.number(card);
            }
            return get.name(card);
        },
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
            if(_status.unoNextColor == color)return true;
            if(color == 'wild')return true;
            if((typeof _status.unoNextNumber == 'number'&& _status.unoNextNumber>=0 && _status.unoNextNumber<=9 && _status.unoNextNumber === get.number(card))){
                return true;
            }
            if((typeof _status.unoNextNumber == 'string')){
                if(card.name == _status.unoNextNumber)return true;
            }
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
            let eventCards = ['unocard_plus_two','unocard_ban','unocard_turn'];
            for(let evt of eventCards){
                for(let suit of ['unoRed','unoGreen','unoBlue','unoYellow']){
                    ret.add([suit,-1,evt]);
                    ret.add([suit,-1,evt]);
                }
            }
            let wildCards = ['unocard_wild_change','unocard_plus_four'];
            for(let wc of wildCards){
                for(let i=0;i<4;i++){
                    ret.add(['unoWild',-1,wc]);
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
        'player_num':{
            name:"游戏人数",
            item:{
                3:'三人',
                4:'四人',
                5:'五人',
                6:'六人',
                7:'七人',
                8:'八人',
                9:'九人',
                10:'十人',
                11:'十一人',
                12:'十二人',
                13:'十三人',
                14:'十四人',
                15:'十五人',
                16:'十六人',
            },
            init:4,
        }
    }
};