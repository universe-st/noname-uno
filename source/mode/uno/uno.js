import {lib,game,ui,get,ai,_status} from '../../../../../noname.js'
import { basic } from '../../basic.js';
import { musicItem } from '../../config.js';

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
    let bgm = game.getExtensionConfig(basic.getExtensionName(),'uno_bgm');
    if(bgm == 'follow')return;
    if(bgm != 'random'){
        let url = `ext:${basic.getExtensionName()}/resource/audio/bgm/${bgm}.mp3`;
        _status.tempMusic = url;
    }else{
        _status.tempMusic = Object.keys(musicItem).filter(item=>item!='random' && item !='follow')
        .map(item=>`ext:${basic.getExtensionName()}/resource/audio/bgm/${item}.mp3`);
    }
    game.playBackgroundMusic();
}

function prepareCardback(){
    var style=ui.css.cardback_style;
    ui.css.cardback_style=lib.init.css(basic.extensionDirectoryPath+'source/mode/uno','cardback');
    style.remove();
    if(ui.css.cardback_stylesheet){
        ui.css.cardback_stylesheet.remove();
        delete ui.css.cardback_stylesheet;
    }
    if(ui.css.cardback_stylesheet2){
        ui.css.cardback_stylesheet2.remove();
        delete ui.css.cardback_stylesheet2;
    }
}

export default {
    name:'uno',
    start:function*(event,map){
        prepareCardback();
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
        if(typeof playerNum != 'number'|| isNaN(playerNum) || playerNum < 3){
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
        _uno_check:{
            direct:true,
            popup:false,
            trigger:{
                player:'useCard',
            },
            filter:function(event,player){
                return player.countCards('h') == 0;
            },
            async content(event,trigger,player){
                game.over(player == game.me);
            }
        },
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
                    game.logv(event.player,"uno_jump");
                    game.playUnoEffect('ban');
                    game.delay(2);
                    yield;
                    event.player.setBan(false);
                    return;
                }
                if(_status.unoPlusAdd){
                    let prompt = `你可以打出一张叠加牌，将罚抽数字累加。否则你摸${_status.unoPlusAdd}张牌。`;
                    let result = yield event.player.chooseToUse()
                    .set('prompt',prompt)
                    .set('ai2',()=>{return 1;});
                    if(result.bool){
                        let color = get.color(result.cards[0]);
                        if(color != 'wild'){
                            _status.unoNextColor = get.color(result.cards[0]);
                        }
                        _status.unoNextNumber = get.unoNumber(result.cards[0]);
                    }else{
                        event.player.popup('罚摸');
                        event.player.$fullscreenpop(`摸${get.cnNumber(_status.unoPlusAdd)}张`,'fire');
                        if(_status.unoPlusAdd >= 5){
                            game.playUnoEffect('ganga');
                        }
                        game.delay(3);
                        yield event.player.draw(_status.unoPlusAdd);
                        _status.unoPlusAdd = 0;
                    }
                    return;
                }
                if(event.player.getToDraw()){
                    game.logv(event.player,"uno_plus"+event.player.getToDraw());
                    event.player.draw(event.player.getToDraw());
                    event.player.setToDraw(0);
                    return;
                }
                let prompt = `你需要打出一张颜色为
                <span style='color:${_status.unoNextColor}'>${get.translation(_status.unoNextColor)}</span>
                或者${typeof _status.unoNextNumber == 'number'?'点数':'牌类型'}
                为${get.translation(_status.unoNextNumber)}的牌，否则你摸一张牌。`;
                let result = yield event.player.chooseToUse()
                .set('ai2',function(){
                    return 1;
                })
                .set('prompt',prompt);
                if(!result.bool){
                    let cards = yield event.player.draw();
                    if(cards.filter((card)=>{
                        return get.unoCardEnable(card,event.player);
                    }).length){
                        let prompt = "你可以直接打出此牌。";
                        result = yield event.player.chooseToUse()
                        .set('filterCard',function(card,player,event){
                            if(!cards.includes(card))return false;
                            return lib.filter.filterCard.apply(null,arguments);
                        })
                        .set('ai2',function(){
                            return 1;
                        })
                        .set('prompt',prompt);
                    }
                }
                if(result.bool){
                    let color = get.color(result.cards[0]);
                    if(color != 'wild'){
                        _status.unoNextColor = get.color(result.cards[0]);
                    }
                    if(!_status.doubtSuccess){
                        _status.unoNextNumber = get.unoNumber(result.cards[0]);
                    }else{
                        _status.doubtSuccess = false;
                    }
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
            game.playAudio(`ext:${basic.getExtensionName()}/resource/audio/effect/${name}.mp3`);
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
            if(_status.unoPlusAdd){
                let info = get.info(card);
                return info.plusCard;
            }
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
        },
        'plus_rules':{
            name:"罚摸规则",
            intro:`<ul>
            <li><b>质疑规则</b>：+4牌要求在手牌中没有和参照牌同色的牌时才能打出。
            打出时，下家可以选择质疑其是否违规，被质疑需要展示所有手牌。
            质疑成功，则违规者摸四张牌。质疑失败，则质疑者除罚抽的四张牌外额外摸两张牌。</li>
            <li><b>叠加规则</b>：叠加规则下，不限制+4牌的打出。加号牌后可以直接打出加号牌避免罚摸，并叠加罚摸牌数，直到有玩家没有加号牌打出位置，该玩家摸叠加数的牌。</li>
            <li><b>宽松规则</b>：不对+4牌的使用作限制。</li>
            <li><b>严格规则</b>：由系统限制+4牌的使用。</li>
            </ul>`,
            init:'doubt',
            item:{
                "doubt":"质疑规则",
                "add":"叠加规则",
                "loose":"宽松规则",
                "strict":"严格规则",
            },
            onclick:function(item){
                game.saveConfig('plus_rules',item,'uno');
                game.reload();
            }
        }
    }
};