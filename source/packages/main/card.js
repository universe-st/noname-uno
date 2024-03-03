import {lib,game,ui,get,ai,_status} from '../../../../../noname.js'
import {basic} from '../../basic.js'
export async function card(){
    let pack = {
        card:{
            'unocard_plus_two':{
                audio:(card,sex)=>{
                    return `../../../${basic.getExtensionRelativePath()}resource/audio/card/plus2_male`;
                },
                plusCard:true,
                image:card=>{
                    let color = get.color(card,null);
                    if(color == 'none') color = null;
                    return `${basic.getExtensionRelativePath().replace('extension/','ext:')}resource/image/card/${(card&&color)?color:'yellow'}_plus_two.jpg`;
                },
                type:"uno_event",
                fullskin:false,
                selectTarget:-1,
                filterTarget:function(card,player,target){
					return target == player.getUnoNext();
				},
                content:function*(event,map){
                    if(get.config('plus_rules') == 'add'){
                        if(!_status.unoPlusAdd)_status.unoPlusAdd = 0;
                        _status.unoPlusAdd += 2;
                        event.player.say("+2");
                        game.playUnoEffect('plustwo');
                        event.player.$fullscreenpop('+'+_status.unoPlusAdd,'fire');
                        return;
                    }
                    event.target.setToDraw(2);
                },
                ai:{
                    basic:{
                        order:function(){
                            let player = _status.event.player;
                            if(player){
                                if(player.getUnoNext().countCards('h') <= 2){
                                    return 3;
                                }
                            }
                            return 1;
                        },
                        result:{
                            player:1,
                        }
                    }
                }
            },
            'unocard_plus_four':{
                enable:(card,player)=>{
                    if(get.config('plus_rules') != 'strict')return true;
                    return player.hasCard((card)=>{return get.color(card) == _status.unoNextColor;},'h');
                },
                audio:(card,sex)=>{
                    return `../../../${basic.getExtensionRelativePath()}resource/audio/card/plus4_male`;
                },
                image:`${basic.getExtensionRelativePath().replace('extension/','ext:')}resource/image/card/wild_plus_four.jpg`,
                type:"uno_event",
                plusCard:true,
                fullskin:false,
                selectTarget:-1,
                filterTarget:function(card,player,target){
					return target == player.getUnoNext();
				},
                content:function*(event,map){
                    if(get.config('plus_rules') == 'add'){
                        if(!_status.unoPlusAdd)_status.unoPlusAdd = 0;
                        _status.unoPlusAdd += 4;
                        event.player.say("+4");
                        game.playUnoEffect('plusfour');
                        event.player.$fullscreenpop('+'+_status.unoPlusAdd,'fire');
                        yield event.player.chooseToChangeColor();
                        return;
                    }
                    let plusCount = 4;
                    let target = event.target;
                    if(get.config('plus_rules') == 'doubt'){
                        let {bool:doubt} = yield target.chooseBool(`${get.translation(event.player)}要令你罚摸四张牌，是否质疑？`)
                        .set('ai',()=>{
                            let count = event.player.countCards('h');
                            if(count <= 0)count = 1;
                            let rate = (1-1/count) * 0.9;
                            return Math.random() < rate;
                        });
                        if(doubt){
                            target.popup('质疑！');
                            game.playUnoEffect('doubt');
                            let showCards = event.player.getCards('h');
                            yield event.player.showCards(showCards,"展示牌")
                            .set('delay_time',6);
                            if(showCards.some(card=>{
                                return get.color(card) == _status.unoNextColor;
                            })){
                                target.popup('质疑成功');
                                game.playUnoEffect('haha');
                                game.log(target,'质疑成功');
                                _status.doubtSuccess = true;
                                yield event.player.draw(4);
                                return;
                            }else{
                                target.popup('质疑失败');
                                game.playUnoEffect('ganga');
                                game.log(target,"质疑失败");
                                plusCount += 2;
                            }
                        }
                    }
                    yield event.player.chooseToChangeColor();
                    event.target.setToDraw(plusCount);
                },
                ai:{
                    basic:{
                        order:function(){
                            let player = _status.event.player;
                            if(player){
                                if(player.getUnoNext().countCards('h') <= 2){
                                    return 1.2;
                                }
                            }
                            return 1;
                        },
                        result:{
                            player:1,
                        }
                    }
                }
            },
            "unocard_ban":{
                audio:(card,sex)=>{
                    return `../../../${basic.getExtensionRelativePath()}resource/audio/card/ban_male`;
                },
                image:card=>{
                    let color = get.color(card,null);
                    if(color == 'none') color = null;
                    return `${basic.getExtensionRelativePath().replace('extension/','ext:')}resource/image/card/${(card&&color)?color:'green'}_ban.jpg`;
                },
                selectTarget:-1,
                filterTarget:function(card,player,target){
					return target == player.getUnoNext();
				},
                type:"uno_event",
                fullskin:false,
                content:function*(event,map){
                    event.target.setBan(true);
                },
                ai:{
                    basic:{
                        order:function(){
                            let player = _status.event.player;
                            if(player){
                                if(player.getUnoNext().countCards('h') <= 2){
                                    return 3;
                                }
                            }
                            return 1;
                        },
                        result:{
                            player:1,
                        }
                    }
                }
            },
            "unocard_wild_change":{
                audio:(card,sex)=>{
                    return `../../../${basic.getExtensionRelativePath()}resource/audio/card/wanneng_male`;
                },
                image:`${basic.getExtensionRelativePath().replace('extension/','ext:')}resource/image/card/wild_change.jpg`,
                type:"uno_event",
                fullskin:false,
                notarget:true,
                content:function*(event,map){
                    event.player.chooseToChangeColor();
                },
                ai:{
                    basic:{
                        order:1,
                        result:{
                            player:1,
                        }
                    }
                }
            },
            "unocard_turn":{
                audio:(card,sex)=>{
                    return `../../../${basic.getExtensionRelativePath()}resource/audio/card/turn_male`;
                },
                image:card=>{
                    let color = get.color(card,null);
                    if(color == 'none') color = null;
                    return `${basic.getExtensionRelativePath().replace('extension/','ext:')}resource/image/card/${(card&&color)?color:'blue'}_turn.jpg`;
                },
                type:"uno_event",
                fullskin:false,
                notarget:true,
                content:function*(event,map){
                    game.playUnoEffect('turn');
                    if(_status.unoDirection == 'next'){
                        _status.unoDirection = 'previous';
                        ui.unoDirection.classList.add('uno-reverse');
                    }else{
                        _status.unoDirection = 'next';
                        ui.unoDirection.classList.remove('uno-reverse');
                    }
                },
                ai:{
                    basic:{
                        order:1,
                        result:{
                            player:1,
                        }
                    }
                }
            },
        },
        cardType:{
			uno_number:2,
		},
        translate:{
            "uno_number":"数字",
            "uno_event":"功能",
            "unocard_plus_two":"加二牌",
            "unocard_plus_two_info":"此牌可令下位出牌玩家罚抽两张牌，且不能出牌。",
            "unocard_plus_four":"加四牌",
            "unocard_plus_four_info":"此牌可接续任意颜色的牌打出。此牌可令下位出牌玩家罚抽四张牌，且不能出牌。",
            "unocard_turn":"反转牌",
            "unocard_turn_info":"打出反转后，当前出牌时的顺序将反转，轮到下家（原来的上家）出牌。",
            "unocard_wild_change":"变色牌",
            "unocard_wild_change_info":"此牌可接续任意颜色的牌打出。打出变色牌后，你可以随意指定下家出牌的颜色（4色中选1），随后下家出牌。",
            "unocard_ban":"封印牌",
            "unocard_ban_info":"跳过你下家的回合。",
        },
        list:[],
    };
    let trans = ['zero','one','two','three','four','five','six','seven','eight','nine'];
    let trans2 = ['〇','一','二','三','四','五','六','七','八','九'];
    for(let i=0;i<=9;i++){
        pack.card['unocard_'+trans[i]] = {
            audio:(card,sex)=>{
                let color = get.color(card,null);
                if(color == 'none') color = ['blue','red','green','yellow'].randomGet();
                return `../../../${basic.getExtensionRelativePath()}resource/audio/card/${(card&&color)?color:'red'}${i}_male`;
            },
            enable:(card,player)=>{
                return get.unoCardEnable(card,player);
            },
            image:card=>{
                let color = get.color(card,null);
                if(color == 'none') color = ['blue','red','green','yellow'].randomGet();
                return `${basic.getExtensionRelativePath().replace('extension/','ext:')}resource/image/card/${(card&&color)?color:'red'}_${i}.jpg`;
            },
            notarget:true,
            type:"uno_number",
            fullskin:false,
            content:function(){

            },
            ai:{
                basic:{
                    order:function(){
                        return 3;
                    },
                    result:{
                        player:function(player,target){
                            return 1;
                        }
                    }
                }
            }
        };
        pack.translate['unocard_'+trans[i]] = trans2[i];
        pack.translate['unocard_'+trans[i] +'_info'] = "普通的数字牌，可以接续相同颜色或数字的牌打出。";
    }
    Object.keys(pack.card).forEach(key=>{
        let info = pack.card[key];
        let enable = info.enable;
        if(enable === null || enable === undefined){
            enable = ()=>true;
        }else if(!(typeof enable == 'function')){
            let value = enable;
            enable = (card,player)=>{
                return value;
            }
        }
        info.enable = (card,player)=>{
            let unoEnable = get.unoCardEnable(card,player);
            return unoEnable && enable(card,player);
        };
        info.contentBefore = function*(event,map){

        }
    });
    return pack;
}