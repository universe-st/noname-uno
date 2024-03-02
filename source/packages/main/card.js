import {lib,game,ui,get,ai,_status} from '../../../../../noname.js'
import {basic} from '../../basic.js'
export async function card(){
    let pack = {
        card:{
            'unocard_plus_two':{
                enable:(card,player)=>{
                    return get.unoCardEnable(card,player);
                },
                audio:(card,sex)=>{
                    return `../../../${basic.extensionDirectoryPath}resource/audio/card/plus2_male`;
                },
                image:card=>{
                    let color = get.color(card,null);
                    if(color == 'none') color = null;
                    return `${basic.extensionDirectoryPath.replace('extension/','ext:')}resource/image/card/${(card&&color)?color:'yellow'}_plus_two.jpg`;
                },
                type:"uno_event",
                fullskin:false,
                selectTarget:-1,
                filterTarget:function(card,player,target){
					return target == player.getUnoNext();
				},
                content:function*(event,map){
                    event.target.setToDraw(2);
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
            'unocard_plus_four':{
                enable:(card,player)=>{
                    return get.unoCardEnable(card,player);
                },
                audio:(card,sex)=>{
                    return `../../../${basic.extensionDirectoryPath}resource/audio/card/plus4_male`;
                },
                image:`${basic.extensionDirectoryPath.replace('extension/','ext:')}resource/image/card/wild_plus_four.jpg`,
                type:"uno_event",
                fullskin:false,
                selectTarget:-1,
                filterTarget:function(card,player,target){
					return target == player.getUnoNext();
				},
                content:function*(event,map){
                    yield event.player.chooseToChangeColor();
                    event.target.setToDraw(4);
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
            "unocard_ban":{
                enable:(card,player)=>{
                    return get.unoCardEnable(card,player);
                },
                audio:(card,sex)=>{
                    return `../../../${basic.extensionDirectoryPath}resource/audio/card/ban_male`;
                },
                image:card=>{
                    let color = get.color(card,null);
                    if(color == 'none') color = null;
                    return `${basic.extensionDirectoryPath.replace('extension/','ext:')}resource/image/card/${(card&&color)?color:'green'}_ban.jpg`;
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
                        order:1,
                        result:{
                            player:1,
                        }
                    }
                }
            },
            "unocard_wild_change":{
                enable:(card,player)=>{
                    return get.unoCardEnable(card,player);
                },
                image:`${basic.extensionDirectoryPath.replace('extension/','ext:')}resource/image/card/wild_change.jpg`,
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
                enable:(card,player)=>{
                    return get.unoCardEnable(card,player);
                },
                audio:(card,sex)=>{
                    return `../../../${basic.extensionDirectoryPath}resource/audio/card/turn_male`;
                },
                image:card=>{
                    let color = get.color(card,null);
                    if(color == 'none') color = null;
                    return `${basic.extensionDirectoryPath.replace('extension/','ext:')}resource/image/card/${(card&&color)?color:'blue'}_turn.jpg`;
                },
                type:"uno_event",
                fullskin:false,
                notarget:true,
                content:function*(event,map){
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
            "unocard_ban":"禁止牌",
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
                return `../../../${basic.extensionDirectoryPath}resource/audio/card/${(card&&color)?color:'red'}${i}_male`;
            },
            enable:(card,player)=>{
                return get.unoCardEnable(card,player);
            },
            image:card=>{
                let color = get.color(card,null);
                if(color == 'none') color = ['blue','red','green','yellow'].randomGet();
                return `${basic.extensionDirectoryPath.replace('extension/','ext:')}resource/image/card/${(card&&color)?color:'red'}_${i}.jpg`;
            },
            notarget:true,
            type:"uno_number",
            fullskin:false,
            content:function(){

            },
            ai:{
                basic:{
                    order:function(){
                        return 1;
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
    
    return pack;
}