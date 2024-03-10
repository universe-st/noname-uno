import {lib,game,ui,get,ai,_status} from '../../../../../noname.js'
import { basic } from '../../basic.js';
import { musicItem } from '../../config.js';
import { unoConfig } from './config.js';

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

function prepareCardSuit(){
    lib.suit.addArray(['unoRed','unoYelow','unoBlue','unoGreen','unoWild']);
    let translate = {
        'unos_red':`<span style='color:red;'>红</span>`,
        'unos_yellow':`<span style='color:yellow;'>黄</span>`,
        'unos_blue':`<span style='color:blue;'>蓝</span>`,
        'unos_green':`<span style='color:green;'>绿</span>`,
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
        'first_card':'首牌',
        'uno_tochange_red':'转红',
        'uno_tochange_yellow':'转黄',
        'uno_tochange_blue':'转蓝',
        'uno_tochange_green':'转绿',
    };
    Object.keys(translate).forEach(key=>lib.translate[key] = translate[key]);
}

export default {
    name:'uno',
    start:function*(event,map){
        prepareCardback();
        prepareCardSuit();
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
            player.initScore();
        });
        let firstCard = null;
        let firstPlayer = game.players.randomGet();
        while(true){
            firstCard = get.cards(1)[0];
            yield firstPlayer.showCards([firstCard],"第一张牌");
            game.cardsDiscard([firstCard]);
            //console.log(get.color(firstCard));
            let num = get.unoNumber(firstCard);
            if(typeof num == 'number' && num >=0 && num<=9 && ['red','blue','green','yellow'].includes(get.color(firstCard))){
                break;
            }
        }
        game.logv(firstPlayer,'first_card');
        game.logv(firstPlayer,[firstCard,[firstCard]]);
        yield game.gameDraw(game.me,get.beginCardCount());
        _status.unoNextColor = get.color(firstCard);
        _status.unoNextNumber = get.unoNumber(firstCard);
        yield game.phaseLoop(firstPlayer);
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
                trigger.all_excluded =true;
                if(get.winScore() == 0){
                    game.over(game.me == player);
                }else{
                    player.endPart();
                }
            }
        },
        _uno_warn:{
            direct:true,
            popup:false,
            trigger:{
                player:['loseEnd','gainEnd'],
            },
            filter:function(event,player){
                if(_status.isEndingPart)return false;
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
            endPart:function(){
                let next = game.createEvent('endPart');
                next.player = this;
                next.setContent('endPart');
                return next;
            },
            getScore:function(){
                if(typeof this.storage.uno_score == 'number')return this.storage.uno_score;
                return 0;
            },
            initScore:function(){
                this.node.score = ui.create.div('.uno-score',this);
                this.storage.uno_score = 0;
                this.refreshScore();
            },
            refreshScore:function(){
                this.node.score.innerHTML = "积分："+this.storage.uno_score;
            },
            addScore:function(num){
                this.storage.uno_score+=num;
                this.refreshScore();
            },
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
            endPart:function*(event,map){
                _status.isEndingPart = true;
                game.playUnoEffect('success');
                let player = event.player;
                player.$fullscreenpop('结算积分','fire');
                let players = game.players.slice(0);
                players.sortBySeat();
                for(let p of players){
                    if(p!=player){
                        yield p.give(p.getCards('h'),player);
                    }
                    p.setBan(false);
                    p.setToDraw(0);
                }
                let sum = 0;
                for(let c of player.getCards('h')){
                    game.delay(1);
                    yield player.lose(c);
                    player.$throw(c);
                    let info = get.info(c);
                    if(info && info.score){
                        sum+=info.score;
                        player.popup('+'+info.score);
                        player.addScore(info.score);
                        game.playUnoEffect('score');
                    }
                }
                if(player.getScore() >= get.winScore()){
                    game.over(player == game.me);
                }else{
                    player.$fullscreenpop('积分+'+sum+'，游戏继续','fire');
                    game.delay(3);
                    yield;
                    yield game.gameDraw(player,get.beginCardCount());
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
                    game.logv(player,'first_card');
                    game.logv(player,[firstCard,[firstCard]]);
                    _status.unoNextColor = get.color(firstCard);
                    _status.unoNextNumber = get.unoNumber(firstCard);
                    _status.unoDirection = 'next';
                    ui.unoDirection.classList.remove('uno-reverse');
                    _status.newBegin = player;
                    _status.unoPlusAdd = 0;
                    game.players.forEach(p=>p.refreshUnoState());
                }
                delete _status.isEndingPart;
                
            },
            chooseToChangeColor:function*(event,map){
                let player = event.player;
                let colors = ['unos_red','unos_yellow','unos_blue','unos_green'];
                let {control} = yield player.chooseControl(colors)
                    .set('prompt',"请选择你要转换的颜色")
                    .set('ai',function(){
                        let m = -1;
                        let mc = '';
                        let mcList = [];
                        colors.forEach(color=>{
                            let count = player.countCards('h',{color:color.slice(5)});
                            if(count >= m){
                                mc = color;
                                if(count != m){
                                    mcList.splice(0,mcList.length);
                                }
                                m = count;
                                mcList.add(mc);
                            }
                        });
                        return colors.indexOf(mcList.randomGet());
                });
                game.log(player,'选择了',control);
                control = control.slice(5);
                _status.unoNextColor = control;
                game.logv(player,'uno_tochange_'+control);
                game.playUnoEffect('change_'+control+'_male');
                player.say(get.translation(control));
            },
            phase:function*(event,map){
                //console.log('inPhase:'+get.translation(event.player));
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
                if(_status.newBegin == event.player){
                    return;
                }
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
                if(_status.newBegin == event.player){
                    return;
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
                while(!_status.over){
                    let player;
                    if(_status.newBegin){
                        event.player = _status.newBegin;
                        player = _status.newBegin;
                        delete _status.newBegin;
                        //console.log('nb:'+get.translation(player));
                    }else{
                        player = event.player;
                    }
                    //console.log(get.translation(player));
                    player.classList.add('glow_phase');
                    //console.log('begin:'+get.translation(player));
                    yield player.phase();
                    //console.log('end:'+get.translation(player));
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
        winScore:function(){
            let count = get.config('win_score');
            count = parseInt(count);
            if(isNaN(count))return 200;
            return count;
        },
        beginCardCount:function(){
            let count = get.config('begin_card_count');
            count = parseInt(count);
            if(isNaN(count))return 4;
            return count;
        },
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
    config:unoConfig,
};